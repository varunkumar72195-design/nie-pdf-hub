
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.subject import Subject
from app.models.semester import Semester
from app.models.material import Material
from app.schemas.subject import (
    SubjectCreate,
    SubjectUpdate,
    SubjectResponse
)
from app.dependencies.auth import get_current_admin


router = APIRouter(
    prefix="/api",
    tags=["Subjects"]
)


# PUBLIC: Get subjects by semester
@router.get(
    "/semesters/{semester_id}/subjects",
    response_model=list[SubjectResponse]
)
def get_subjects(
    semester_id: int,
    db: Session = Depends(get_db)
):
    semester = db.query(Semester).filter(
        Semester.id == semester_id
    ).first()

    if not semester:
        raise HTTPException(
            status_code=404,
            detail="Semester not found"
        )

    return db.query(Subject).filter(
        Subject.semester_id == semester_id
    ).order_by(Subject.name).all()


# PUBLIC: Get one subject
@router.get(
    "/subjects/{subject_id}",
    response_model=SubjectResponse
)
def get_subject(
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

    return subject


# ADMIN: Create subject
@router.post(
    "/subjects",
    response_model=SubjectResponse,
    status_code=status.HTTP_201_CREATED
)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    semester = db.query(Semester).filter(
        Semester.id == data.semester_id
    ).first()

    if not semester:
        raise HTTPException(
            status_code=404,
            detail="Semester not found"
        )

    existing = db.query(Subject).filter(
        Subject.semester_id == data.semester_id,
        Subject.code == data.code
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Subject code already exists in this semester"
        )

    subject = Subject(**data.model_dump())

    db.add(subject)
    db.commit()
    db.refresh(subject)

    return subject


# ADMIN: Update subject
@router.put(
    "/subjects/{subject_id}",
    response_model=SubjectResponse
)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id
    ).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    updates = data.model_dump(exclude_unset=True)

    if "code" in updates:
        duplicate = db.query(Subject).filter(
            Subject.semester_id == subject.semester_id,
            Subject.code == updates["code"],
            Subject.id != subject_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Subject code already exists in this semester"
            )

    for field, value in updates.items():
        setattr(subject, field, value)

    db.commit()
    db.refresh(subject)

    return subject


# ADMIN: Delete subject
@router.delete("/subjects/{subject_id}")
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    subject = db.query(Subject).filter(
        Subject.id == subject_id
    ).first()

    if not subject:
        raise HTTPException(
            status_code=404,
            detail="Subject not found"
        )

    material_count = db.query(Material).filter(
        Material.subject_id == subject_id
    ).count()

    if material_count > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete this subject because it contains "
                f"{material_count} PDF material(s). Delete its materials first."
            )
        )

    db.delete(subject)
    db.commit()

    return {
        "message": "Subject deleted successfully"
    }
