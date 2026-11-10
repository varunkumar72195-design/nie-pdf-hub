
import logging
import mimetypes
import uuid
from pathlib import PurePosixPath
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)
from fastapi.responses import Response
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.admin import Admin
from app.models.material import Material
from app.models.subject import Subject
from app.models.semester import Semester
from app.models.academic_year import AcademicYear
from app.models.department import Department
from app.schemas.material import MaterialResponse
from app.storage import upload_file, download_file, delete_file


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api",
    tags=["Materials"]
)


# --------------------------------------------------
# STORAGE CONFIGURATION
# --------------------------------------------------

MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB

ALLOWED_FILES = {
    ".pdf": {"content_type": "application/pdf"},
    ".jpg": {"content_type": "image/jpeg"},
    ".jpeg": {"content_type": "image/jpeg"},
    ".png": {"content_type": "image/png"},
    ".webp": {"content_type": "image/webp"},
}


# --------------------------------------------------
# HELPER: CHECK FILE SIGNATURE
# --------------------------------------------------

def validate_file_content(
    file_bytes: bytes,
    extension: str
) -> bool:

    if extension == ".pdf":
        return file_bytes.startswith(b"%PDF-")

    if extension in (".jpg", ".jpeg"):
        return file_bytes.startswith(b"\xff\xd8\xff")

    if extension == ".png":
        return file_bytes.startswith(
            b"\x89PNG\r\n\x1a\n"
        )

    if extension == ".webp":
        return (
            len(file_bytes) >= 12
            and file_bytes[:4] == b"RIFF"
            and file_bytes[8:12] == b"WEBP"
        )

    return False


# --------------------------------------------------
# HELPER: READ AND VALIDATE UPLOAD
# --------------------------------------------------

async def read_uploaded_file(file: UploadFile):

    original_name = PurePosixPath(
        (file.filename or "").replace("\\", "/")
    ).name

    if not original_name:
        raise HTTPException(
            status_code=400,
            detail="File name is required"
        )

    extension = PurePosixPath(original_name).suffix.lower()

    if extension not in ALLOWED_FILES:
        raise HTTPException(
            status_code=400,
            detail="Only PDF, JPG, JPEG, PNG and WEBP files are allowed"
        )

    expected_type = ALLOWED_FILES[extension]["content_type"]

    if file.content_type != expected_type:
        raise HTTPException(
            status_code=400,
            detail="File type does not match the file extension"
        )

    file_bytes = bytearray()

    while chunk := await file.read(1024 * 1024):

        file_bytes.extend(chunk)

        if len(file_bytes) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail="File size must not exceed 20 MB"
            )

    if not file_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded file is empty"
        )

    if not validate_file_content(
        bytes(file_bytes),
        extension
    ):
        raise HTTPException(
            status_code=400,
            detail="Invalid file content"
        )

    return (
        original_name,
        extension,
        expected_type,
        bytes(file_bytes)
    )


# --------------------------------------------------
# HELPER: GENERATE SUPABASE OBJECT PATH
# --------------------------------------------------

def generate_storage_path(extension: str) -> str:

    stored_name = f"{uuid.uuid4().hex}{extension}"

    return f"materials/{stored_name}", stored_name


# --------------------------------------------------
# HELPER: VALIDATE SUPABASE OBJECT PATH
# --------------------------------------------------

def is_cloud_storage_path(file_path: str) -> bool:
    if not file_path:
        return False

    path = PurePosixPath(file_path)
    return (
        len(path.parts) == 2
        and path.parts[0] == "materials"
        and path.parts[1] not in ("", ".", "..")
    )


# --------------------------------------------------
# HELPER: REMOVE SUPABASE OBJECT
# --------------------------------------------------

def remove_stored_file(file_path: str):
    if not is_cloud_storage_path(file_path):
        logger.error("Refusing to delete invalid cloud path: %s", file_path)
        return

    try:
        delete_file(file_path)
    except Exception:
        # The database change has already succeeded. Log cleanup failure
        # so it can be handled without losing the database operation.
        logger.exception(
            "Could not delete Supabase object: %s",
            file_path
        )


# --------------------------------------------------
# HELPER: DOWNLOAD FILE CONTENT FROM SUPABASE
# --------------------------------------------------

def get_file_content(material: Material):
    if not is_cloud_storage_path(material.file_path):
        logger.error(
            "Invalid Supabase object path for material %s: %s",
            material.id,
            material.file_path
        )
        raise HTTPException(
            status_code=500,
            detail="Material has an invalid cloud storage path"
        )

    try:
        return download_file(material.file_path)
    except Exception:
        logger.exception(
            "Supabase download failed for material %s",
            material.id
        )
        raise HTTPException(
            status_code=404,
            detail="Stored file could not be retrieved from cloud storage"
        )


# --------------------------------------------------
# HELPER: GET MATERIAL
# --------------------------------------------------

def get_material_or_404(
    material_id: int,
    db: Session
):

    material = db.query(Material).filter(
        Material.id == material_id
    ).first()

    if not material:
        raise HTTPException(
            status_code=404,
            detail="Material not found"
        )

    return material


# --------------------------------------------------
# 1. ADMIN: UPLOAD MATERIAL
# POST /api/materials
# --------------------------------------------------

@router.post(
    "/materials",
    status_code=status.HTTP_201_CREATED
)
async def upload_material(
    subject_id: int = Form(...),
    title: str = Form(...),
    description: str | None = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):

    subject = db.query(Subject).filter(
        Subject.id == subject_id
    ).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    if not title.strip():
        raise HTTPException(
            status_code=400,
            detail="Title is required"
        )

    storage_path = None
    cloud_uploaded = False

    try:

        (
            original_name,
            extension,
            content_type,
            file_bytes
        ) = await read_uploaded_file(file)

        storage_path, stored_name = generate_storage_path(
            extension
        )

        # Upload to private Supabase Storage.
        upload_file(
            storage_path,
            file_bytes,
            content_type
        )

        cloud_uploaded = True

        material = Material(
            subject_id=subject_id,
            title=title.strip(),
            description=description,
            file_name=original_name,
            stored_file_name=stored_name,
            file_path=storage_path,
            file_size=len(file_bytes),
            uploaded_by=admin.id
        )

        db.add(material)
        db.commit()
        db.refresh(material)

        return {
            "message": "Material uploaded successfully",
            "id": material.id,
            "title": material.title,
            "file_name": material.file_name,
            "file_size": material.file_size
        }

    except Exception:

        db.rollback()

        if cloud_uploaded and storage_path:
            try:
                delete_file(storage_path)
            except Exception:
                logger.exception(
                    "Could not clean up failed upload: %s",
                    storage_path
                )

        raise

    finally:
        await file.close()


# --------------------------------------------------
# 2. PUBLIC: GET SUBJECT MATERIALS
# GET /api/subjects/{subject_id}/materials
# --------------------------------------------------

@router.get(
    "/subjects/{subject_id}/materials",
    response_model=list[MaterialResponse]
)
def get_subject_materials(
    subject_id: int,
    db: Session = Depends(get_db)
):

    subject = db.query(Subject).filter(
        Subject.id == subject_id
    ).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    materials = (
        db.query(Material)
        .filter(Material.subject_id == subject_id)
        .order_by(Material.uploaded_at.desc())
        .all()
    )

    return [
        {
            "id": material.id,
            "subject_id": material.subject_id,
            "title": material.title,
            "description": material.description,
            "file_name": material.file_name,
            "file_size": material.file_size,
            "uploaded_at": material.uploaded_at,
            "view_url": f"/api/materials/{material.id}/view",
            "download_url": f"/api/materials/{material.id}/download"
        }
        for material in materials
    ]


# --------------------------------------------------
# 3. PUBLIC: VIEW MATERIAL
# GET /api/materials/{material_id}/view
# --------------------------------------------------

@router.get("/materials/{material_id}/view")
def view_material(
    material_id: int,
    db: Session = Depends(get_db)
):

    material = get_material_or_404(
        material_id,
        db
    )

    content_type = (
        mimetypes.guess_type(material.file_name)[0]
        or "application/octet-stream"
    )

    file_bytes = get_file_content(material)
    encoded_name = quote(material.file_name)

    return Response(
        content=file_bytes,
        media_type=content_type,
        headers={
            "Content-Disposition": (
                f"inline; filename*=UTF-8''{encoded_name}"
            ),
            "X-Content-Type-Options": "nosniff"
        }
    )


# --------------------------------------------------
# 4. PUBLIC: DOWNLOAD MATERIAL
# GET /api/materials/{material_id}/download
# --------------------------------------------------

@router.get("/materials/{material_id}/download")
def download_material(
    material_id: int,
    db: Session = Depends(get_db)
):

    material = get_material_or_404(
        material_id,
        db
    )

    content_type = (
        mimetypes.guess_type(material.file_name)[0]
        or "application/octet-stream"
    )

    file_bytes = get_file_content(material)
    encoded_name = quote(material.file_name)

    return Response(
        content=file_bytes,
        media_type=content_type,
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{encoded_name}"
            ),
            "X-Content-Type-Options": "nosniff"
        }
    )


# --------------------------------------------------
# 5. ADMIN: UPDATE MATERIAL
# PUT /api/materials/{material_id}
# --------------------------------------------------

@router.put("/materials/{material_id}")
async def update_material(
    material_id: int,
    title: str | None = Form(None),
    description: str | None = Form(None),
    file: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):

    material = get_material_or_404(
        material_id,
        db
    )

    if title is not None and not title.strip():
        raise HTTPException(
            status_code=400,
            detail="Title cannot be empty"
        )

    old_file_path = material.file_path

    new_storage_path = None
    cloud_uploaded = False

    try:

        if file is not None:

            (
                original_name,
                extension,
                content_type,
                file_bytes
            ) = await read_uploaded_file(file)

            new_storage_path, stored_name = (
                generate_storage_path(extension)
            )

            upload_file(
                new_storage_path,
                file_bytes,
                content_type
            )

            cloud_uploaded = True

            material.file_name = original_name
            material.stored_file_name = stored_name
            material.file_path = new_storage_path
            material.file_size = len(file_bytes)

        if title is not None:
            material.title = title.strip()

        if description is not None:
            material.description = description

        db.commit()
        db.refresh(material)

        # Remove the previous file only after DB commit succeeds.
        if new_storage_path:
            remove_stored_file(old_file_path)

        return {
            "message": "Material updated successfully",
            "id": material.id,
            "title": material.title,
            "file_name": material.file_name,
            "file_size": material.file_size
        }

    except Exception:

        db.rollback()

        if cloud_uploaded and new_storage_path:
            try:
                delete_file(new_storage_path)
            except Exception:
                logger.exception(
                    "Could not clean up replacement upload: %s",
                    new_storage_path
                )

        raise

    finally:
        if file is not None:
            await file.close()


# --------------------------------------------------
# 6. ADMIN: DELETE MATERIAL
# DELETE /api/materials/{material_id}
# --------------------------------------------------

@router.delete(
    "/materials/{material_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
def delete_material(
    material_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):

    material = get_material_or_404(
        material_id,
        db
    )

    old_file_path = material.file_path

    try:

        db.delete(material)
        db.commit()

    except Exception:
        db.rollback()
        raise

    # Remove the stored object after successful DB deletion.
    remove_stored_file(old_file_path)

    return None


# --------------------------------------------------
# 7. HELPER: MATERIAL SUMMARY
# --------------------------------------------------

def get_material_summary(
    material,
    subject,
    semester,
    academic_year,
    department
):

    return {
        "id": material.id,
        "title": material.title,
        "description": material.description,
        "file_name": material.file_name,
        "file_size": material.file_size,
        "uploaded_at": material.uploaded_at,

        "subject_id": subject.id,
        "subject_name": subject.name,

        "semester_id": semester.id,
        "semester_name": semester.name,

        "academic_year_id": academic_year.id,
        "year_name": academic_year.name,

        "department_id": department.id,
        "department_name": department.name,

        "view_url": f"/api/materials/{material.id}/view",
        "download_url": f"/api/materials/{material.id}/download"
    }


# --------------------------------------------------
# 8. PUBLIC: PORTAL OVERVIEW
# GET /api/portal/overview
# --------------------------------------------------

@router.get("/portal/overview")
def get_portal_overview(
    db: Session = Depends(get_db)
):

    departments_count = db.query(Department).count()
    subjects_count = db.query(Subject).count()
    semesters_count = db.query(Semester).count()
    materials_count = db.query(Material).count()

    recent_rows = (
        db.query(
            Material,
            Subject,
            Semester,
            AcademicYear,
            Department
        )
        .join(
            Subject,
            Material.subject_id == Subject.id
        )
        .join(
            Semester,
            Subject.semester_id == Semester.id
        )
        .join(
            AcademicYear,
            Semester.academic_year_id == AcademicYear.id
        )
        .join(
            Department,
            AcademicYear.department_id == Department.id
        )
        .order_by(Material.uploaded_at.desc())
        .limit(6)
        .all()
    )

    recent_materials = [
        get_material_summary(*row)
        for row in recent_rows
    ]

    return {
        "statistics": {
            "departments": departments_count,
            "subjects": subjects_count,
            "semesters": semesters_count,
            "materials": materials_count
        },
        "recent_materials": recent_materials
    }


# --------------------------------------------------
# 9. PUBLIC: SEARCH PORTAL MATERIALS
# GET /api/portal/search?q=python
# --------------------------------------------------

@router.get("/portal/search")
def search_portal_materials(
    q: str = Query(..., min_length=1, max_length=100),
    db: Session = Depends(get_db)
):

    query_text = q.strip()

    if not query_text:
        return []

    search_term = f"%{query_text}%"

    matching_rows = (
        db.query(
            Material,
            Subject,
            Semester,
            AcademicYear,
            Department
        )
        .join(
            Subject,
            Material.subject_id == Subject.id
        )
        .join(
            Semester,
            Subject.semester_id == Semester.id
        )
        .join(
            AcademicYear,
            Semester.academic_year_id == AcademicYear.id
        )
        .join(
            Department,
            AcademicYear.department_id == Department.id
        )
        .filter(
            or_(
                Material.title.ilike(search_term),
                Material.description.ilike(search_term),
                Material.file_name.ilike(search_term),
                Subject.name.ilike(search_term),
                Subject.code.ilike(search_term),
                Department.name.ilike(search_term),
                Department.code.ilike(search_term)
            )
        )
        .order_by(Material.uploaded_at.desc())
        .limit(20)
        .all()
    )

    return [
        get_material_summary(*row)
        for row in matching_rows
    ]
