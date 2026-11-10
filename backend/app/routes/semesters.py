
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.semester import Semester
from app.models.academic_year import AcademicYear
from app.schemas.semester import (
    SemesterCreate,
    SemesterUpdate,
    SemesterResponse
)
from app.dependencies.auth import get_current_admin


router = APIRouter(
    prefix="/api",
    tags=["Semesters"]
)


# PUBLIC: Get semesters under an academic year
@router.get(
    "/academic-years/{academic_year_id}/semesters",
    response_model=list[SemesterResponse]
)
def get_semesters(
    academic_year_id: int,
    db: Session = Depends(get_db)
):
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.id == academic_year_id
    ).first()

    if not academic_year:
        raise HTTPException(
            status_code=404,
            detail="Academic year not found"
        )

    return db.query(Semester).filter(
        Semester.academic_year_id == academic_year_id
    ).order_by(Semester.semester_number).all()


# ADMIN: Create semester
@router.post(
    "/semesters",
    response_model=SemesterResponse,
    status_code=status.HTTP_201_CREATED
)
def create_semester(
    data: SemesterCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.id == data.academic_year_id
    ).first()

    if not academic_year:
        raise HTTPException(
            status_code=404,
            detail="Academic year not found"
        )

    if data.semester_number not in (1, 2):
        raise HTTPException(
            status_code=400,
            detail="Semester number must be 1 or 2 within an academic year"
        )

    existing = db.query(Semester).filter(
        Semester.academic_year_id == data.academic_year_id,
        Semester.semester_number == data.semester_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Semester already exists in this academic year"
        )

    semester = Semester(**data.model_dump())

    db.add(semester)
    db.commit()
    db.refresh(semester)

    return semester


# ADMIN: Update semester
@router.put(
    "/semesters/{semester_id}",
    response_model=SemesterResponse
)
def update_semester(
    semester_id: int,
    data: SemesterUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    semester = db.query(Semester).filter(
        Semester.id == semester_id
    ).first()

    if not semester:
        raise HTTPException(
            status_code=404,
            detail="Semester not found"
        )

    updates = data.model_dump(exclude_unset=True)

    if "semester_number" in updates:
        if updates["semester_number"] not in (1, 2):
            raise HTTPException(
                status_code=400,
                detail="Semester number must be 1 or 2"
            )

        duplicate = db.query(Semester).filter(
            Semester.academic_year_id == semester.academic_year_id,
            Semester.semester_number == updates["semester_number"],
            Semester.id != semester_id
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Semester number already exists"
            )

    for field, value in updates.items():
        setattr(semester, field, value)

    db.commit()
    db.refresh(semester)

    return semester


# ADMIN: Delete semester
@router.delete("/semesters/{semester_id}")
def delete_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    semester = db.query(Semester).filter(
        Semester.id == semester_id
    ).first()

    if not semester:
        raise HTTPException(
            status_code=404,
            detail="Semester not found"
        )

    db.delete(semester)
    db.commit()

    return {"message": "Semester deleted successfully"}
