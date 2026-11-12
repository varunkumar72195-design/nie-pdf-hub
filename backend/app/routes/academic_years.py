
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.academic_year import AcademicYear
from app.models.department import Department
from app.models.regulation import Regulation
from app.models.semester import Semester

from app.schemas.academic_year import (
    AcademicYearCreate,
    AcademicYearUpdate,
    AcademicYearResponse
)

from app.dependencies.auth import get_current_admin


router = APIRouter(
    prefix="/api",
    tags=["Academic Years"]
)


# PUBLIC: Get academic years for a department
# Kept for backward compatibility with the old frontend route.
@router.get(
    "/departments/{department_id}/years",
    response_model=list[AcademicYearResponse]
)
def get_academic_years(
    department_id: int,
    db: Session = Depends(get_db)
):
    department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if not department:
        raise HTTPException(404, "Department not found")

    return (
        db.query(AcademicYear)
        .filter(AcademicYear.department_id == department_id)
        .order_by(
            AcademicYear.regulation_id,
            AcademicYear.year_number
        )
        .all()
    )


# PUBLIC: Get academic years for a specific regulation
@router.get(
    "/regulations/{regulation_id}/academic-years",
    response_model=list[AcademicYearResponse]
)
def get_regulation_academic_years(
    regulation_id: int,
    db: Session = Depends(get_db)
):
    regulation = db.query(Regulation).filter(
        Regulation.id == regulation_id
    ).first()

    if not regulation:
        raise HTTPException(
            status_code=404,
            detail="Regulation not found"
        )

    return (
        db.query(AcademicYear)
        .filter(
            AcademicYear.regulation_id == regulation_id,
            AcademicYear.department_id == regulation.department_id
        )
        .order_by(AcademicYear.year_number)
        .all()
    )


# ADMIN: Get all academic years
@router.get(
    "/academic-years",
    response_model=list[AcademicYearResponse]
)
def get_all_academic_years(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    return (
        db.query(AcademicYear)
        .order_by(
            AcademicYear.department_id,
            AcademicYear.regulation_id,
            AcademicYear.year_number
        )
        .all()
    )


# ADMIN: Create academic year
@router.post(
    "/academic-years",
    response_model=AcademicYearResponse,
    status_code=status.HTTP_201_CREATED
)
def create_academic_year(
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    department = db.query(Department).filter(
        Department.id == data.department_id
    ).first()

    if not department:
        raise HTTPException(404, "Department not found")

    regulation = db.query(Regulation).filter(
        Regulation.id == data.regulation_id,
        Regulation.department_id == data.department_id
    ).first()

    if not regulation:
        raise HTTPException(
            status_code=404,
            detail="Regulation not found for this department"
        )

    existing = db.query(AcademicYear).filter(
        AcademicYear.department_id == data.department_id,
        AcademicYear.regulation_id == data.regulation_id,
        AcademicYear.year_number == data.year_number
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Academic year already exists for this regulation"
        )

    academic_year = AcademicYear(**data.model_dump())

    db.add(academic_year)
    db.commit()
    db.refresh(academic_year)

    return academic_year


# ADMIN: Update academic year
@router.put(
    "/academic-years/{academic_year_id}",
    response_model=AcademicYearResponse
)
def update_academic_year(
    academic_year_id: int,
    data: AcademicYearUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.id == academic_year_id
    ).first()

    if not academic_year:
        raise HTTPException(404, "Academic year not found")

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(400, "No fields provided for update")

    new_regulation_id = updates.get(
        "regulation_id",
        academic_year.regulation_id
    )

    regulation = db.query(Regulation).filter(
        Regulation.id == new_regulation_id,
        Regulation.department_id == academic_year.department_id
    ).first()

    if not regulation:
        raise HTTPException(
            status_code=404,
            detail="Regulation not found for this department"
        )

    new_year_number = updates.get(
        "year_number",
        academic_year.year_number
    )

    duplicate = db.query(AcademicYear).filter(
        AcademicYear.department_id == academic_year.department_id,
        AcademicYear.regulation_id == new_regulation_id,
        AcademicYear.year_number == new_year_number,
        AcademicYear.id != academic_year_id
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Academic year already exists for this regulation"
        )

    for field, value in updates.items():
        setattr(academic_year, field, value)

    db.commit()
    db.refresh(academic_year)

    return academic_year


# ADMIN: Delete academic year
@router.delete("/academic-years/{academic_year_id}")
def delete_academic_year(
    academic_year_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    academic_year = db.query(AcademicYear).filter(
        AcademicYear.id == academic_year_id
    ).first()

    if not academic_year:
        raise HTTPException(404, "Academic year not found")

    semester_count = db.query(Semester).filter(
        Semester.academic_year_id == academic_year_id
    ).count()

    if semester_count > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete academic year because it contains semesters. "
                "Delete its semesters and materials first."
            )
        )

    db.delete(academic_year)
    db.commit()

    return {
        "message": "Academic year deleted successfully"
    }
