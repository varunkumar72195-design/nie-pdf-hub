

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db

from app.models.admin import Admin
from app.models.department import Department
from app.models.subject import Subject
from app.models.material import Material
from app.schemas.admin import (
    AdminLogin,
    TokenResponse,
    AdminResponse,
    AdminProfileUpdate,
    AdminPasswordChange
)

from app.services.auth import (
    verify_password,
    create_access_token,
    hash_password
)

from app.dependencies.auth import get_current_admin


router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)


# ==========================================
# COMMON LOGIN VALIDATION
# ==========================================

def authenticate_admin(email: str, password: str, db: Session):
    admin = db.query(Admin).filter(
        Admin.email == email
    ).first()

    if (
        not admin
        or not verify_password(password, admin.hashed_password)
        or not admin.is_active
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    return admin


# ==========================================
# COMMON TOKEN RESPONSE
# ==========================================

def generate_token(admin: Admin):
    token = create_access_token(admin.id)

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }


# ==========================================
# LOGIN FOR REACT FRONTEND
# ==========================================

@router.post("/login", response_model=TokenResponse)
def admin_login(
    data: AdminLogin,
    db: Session = Depends(get_db)
):
    admin = authenticate_admin(
        data.email,
        data.password,
        db
    )

    return generate_token(admin)


# ==========================================
# LOGIN FOR SWAGGER
# ==========================================

@router.post("/token", response_model=TokenResponse)
def admin_swagger_login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    admin = authenticate_admin(
        form_data.username,
        form_data.password,
        db
    )

    return generate_token(admin)


# ==========================================
# GET ADMIN PROFILE
# ==========================================

@router.get("/me", response_model=AdminResponse)
def get_admin_profile(
    admin: Admin = Depends(get_current_admin)
):
    return admin


# ==========================================
# UPDATE ADMIN PROFILE
# ==========================================

@router.put("/profile", response_model=AdminResponse)
def update_admin_profile(
    data: AdminProfileUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Please provide at least one field to update"
        )

    for field, value in updates.items():
        if value is None or (
            isinstance(value, str) and not value.strip()
        ):
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be empty"
            )

    if "email" in updates:
        updates["email"] = str(
            updates["email"]
        ).lower().strip()

        existing_admin = db.query(Admin).filter(
            Admin.email == updates["email"],
            Admin.id != admin.id
        ).first()

        if existing_admin:
            raise HTTPException(
                status_code=409,
                detail="Email address is already in use"
            )

    if "name" in updates:
        updates["name"] = updates["name"].strip()

    try:
        for field, value in updates.items():
            setattr(admin, field, value)

        db.commit()
        db.refresh(admin)

        return admin

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to update admin profile"
        )


# ==========================================
# CHANGE ADMIN PASSWORD
# ==========================================

@router.put("/password")
def change_admin_password(
    data: AdminPasswordChange,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    if not verify_password(
        data.current_password,
        admin.hashed_password
    ):
        raise HTTPException(
            status_code=400,
            detail="Current password is incorrect"
        )

    if data.current_password == data.new_password:
        raise HTTPException(
            status_code=400,
            detail="New password must be different from current password"
        )

    try:
        admin.hashed_password = hash_password(
            data.new_password
        )

        db.commit()

        return {
            "message": "Password changed successfully"
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to change password"
        )


# ==========================================
# ADMIN DASHBOARD STATISTICS
# ==========================================

@router.get("/dashboard")
def get_admin_dashboard(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    total_departments = db.query(Department).count()
    total_subjects = db.query(Subject).count()
    total_materials = db.query(Material).count()

    recent_materials = (
        db.query(Material)
        .order_by(Material.uploaded_at.desc())
        .limit(5)
        .all()
    )

    recent_uploads = [
        {
            "id": material.id,
            "title": material.title,
            "file_name": material.file_name,
            "subject_id": material.subject_id,
            "file_size": material.file_size,
            "uploaded_at": material.uploaded_at,
            "view_url": f"/api/materials/{material.id}/view",
            "download_url": f"/api/materials/{material.id}/download"
        }
        for material in recent_materials
    ]

    return {
        "total_departments": total_departments,
        "total_subjects": total_subjects,
        "total_materials": total_materials,
        "recent_uploads": recent_uploads
    }


# ==========================================
# STORAGE SIZE FORMATTER
# ==========================================

def format_storage_size(size_bytes: int) -> str:
    size = float(size_bytes)

    for unit in ["Bytes", "KB", "MB", "GB", "TB"]:
        if size < 1024:
            return f"{size:.2f} {unit}"

        size /= 1024

    return f"{size:.2f} PB"


# ==========================================
# ADMIN DATABASE OVERVIEW
# ==========================================


    """
    Return database-only storage information.

    Uploaded files are stored in Supabase Storage. This endpoint
    deliberately does not inspect the computer's local folders or disks.
    """

    database_size_bytes = db.execute(
        text("SELECT pg_database_size(current_database())")
    ).scalar_one()

    total_materials = db.query(Material).count()

    return {
        "database_size_bytes": database_size_bytes,
        "database_size": format_storage_size(database_size_bytes),
        "total_materials": total_materials,
        "file_storage_provider": "Supabase Storage"
    }
# ==========================================
# ADMIN STORAGE OVERVIEW
# ==========================================

SUPABASE_BUCKET_NAME = "nie-pdf-hub-pdfs"

# Supabase Free Plan reference limit: 1 GiB
SUPABASE_STORAGE_LIMIT_BYTES = 1024 ** 3


@router.get("/storage")
def get_admin_storage(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    try:
        # PostgreSQL database size
        database_size_bytes = db.execute(
            text("SELECT pg_database_size(current_database())")
        ).scalar_one()

        # Actual Supabase bucket usage
        bucket_usage = db.execute(
            text("""
                SELECT
                    COUNT(*) AS total_files,
                    COALESCE(
                        SUM(
                            CASE
                                WHEN metadata->>'size' ~ '^[0-9]+$'
                                THEN (metadata->>'size')::BIGINT
                                ELSE 0
                            END
                        ),
                        0
                    ) AS used_bytes
                FROM storage.objects
                WHERE bucket_id = :bucket_id
            """),
            {"bucket_id": SUPABASE_BUCKET_NAME}
        ).mappings().one()

        total_files = int(bucket_usage["total_files"] or 0)
        used_bytes = int(bucket_usage["used_bytes"] or 0)

        remaining_bytes = max(
            0,
            SUPABASE_STORAGE_LIMIT_BYTES - used_bytes
        )

        usage_percent = round(
            (used_bytes / SUPABASE_STORAGE_LIMIT_BYTES) * 100,
            2
        )

        total_materials = db.query(Material).count()

        return {
            "database_size_bytes": database_size_bytes,
            "database_size": format_storage_size(database_size_bytes),

            "total_materials": total_materials,

            "file_storage_provider": "Supabase Storage",
            "storage_bucket": SUPABASE_BUCKET_NAME,

            "bucket_file_count": total_files,

            "bucket_used_bytes": used_bytes,
            "bucket_used": format_storage_size(used_bytes),

            "storage_limit_bytes": SUPABASE_STORAGE_LIMIT_BYTES,
            "storage_limit": format_storage_size(
                SUPABASE_STORAGE_LIMIT_BYTES
            ),

            "remaining_bytes_estimate": remaining_bytes,
            "remaining_storage_estimate": format_storage_size(
                remaining_bytes
            ),

            "usage_percent_estimate": usage_percent,

            "quota_scope": (
                "Bucket-level estimate. Other buckets and projects "
                "may also consume organization storage."
            )
        }

    except Exception as exc:
        print("Storage overview error:", exc)

        raise HTTPException(
            status_code=500,
            detail="Unable to retrieve storage information."
        )
