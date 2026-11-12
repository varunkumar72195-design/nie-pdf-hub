
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin

from app.models.regulation import Regulation
from app.models.department import Department
from app.models.academic_year import AcademicYear

from app.schemas.regulation import (
    RegulationCreate,
    RegulationUpdate,
    RegulationResponse
)


router = APIRouter(
    prefix="/api/admin/regulations",
    tags=["Admin Regulations"]
)


# ADMIN: Get all regulations
@router.get(
    "/",
    response_model=list[RegulationResponse]
)
def get_all_regulations(
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    return (
        db.query(Regulation)
        .order_by(
            Regulation.department_id,
            Regulation.code
        )
        .all()
    )


# ADMIN: Create regulation
@router.post(
    "/",
    response_model=RegulationResponse,
    status_code=status.HTTP_201_CREATED
)
def create_regulation(
    data: RegulationCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    department = db.query(Department).filter(
        Department.id == data.department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    existing = db.query(Regulation).filter(
        Regulation.department_id == data.department_id,
        Regulation.code == data.code
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="This regulation code already exists in this department"
        )

    regulation = Regulation(**data.model_dump())

    db.add(regulation)
    db.commit()
    db.refresh(regulation)

    return regulation


# ADMIN: Update regulation
@router.put(
    "/{regulation_id}",
    response_model=RegulationResponse
)
def update_regulation(
    regulation_id: int,
    data: RegulationUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    regulation = db.query(Regulation).filter(
        Regulation.id == regulation_id
    ).first()

    if not regulation:
        raise HTTPException(
            status_code=404,
            detail="Regulation not found"
        )

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    if "name" in updates and updates["name"] is None:
        raise HTTPException(400, "Regulation name cannot be empty")

    if "code" in updates and updates["code"] is None:
        raise HTTPException(400, "Regulation code cannot be empty")

    new_code = updates.get("code", regulation.code)

    duplicate = db.query(Regulation).filter(
        Regulation.department_id == regulation.department_id,
        Regulation.code == new_code,
        Regulation.id != regulation_id
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="This regulation code already exists in this department"
        )

    for field, value in updates.items():
        setattr(regulation, field, value)

    db.commit()
    db.refresh(regulation)

    return regulation


# ADMIN: Delete regulation
@router.delete("/{regulation_id}")
def delete_regulation(
    regulation_id: int,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin)
):
    regulation = db.query(Regulation).filter(
        Regulation.id == regulation_id
    ).first()

    if not regulation:
        raise HTTPException(
            status_code=404,
            detail="Regulation not found"
        )

    academic_year_count = db.query(AcademicYear).filter(
        AcademicYear.regulation_id == regulation_id
    ).count()

    if academic_year_count > 0:
        raise HTTPException(
            status_code=409,
            detail=(
                "Cannot delete this regulation because it contains "
                "academic years. Delete or move those academic years first."
            )
        )

    db.delete(regulation)
    db.commit()

    return {
        "message": "Regulation deleted successfully"
    }
