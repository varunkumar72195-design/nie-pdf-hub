
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.department import Department
from app.models.academic_year import AcademicYear
from app.schemas.department import (
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentResponse
)
from app.models.admin import Admin
from app.dependencies.auth import get_current_admin

router = APIRouter(
    prefix="/api/departments",
    tags=["Departments"]
)


# PUBLIC: Get all departments
@router.get("/", response_model=list[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return (
        db.query(Department)
        .order_by(Department.name)
        .all()
    )


# ADMIN ONLY: Create department
@router.post(
    "/",
    response_model=DepartmentResponse,
    status_code=status.HTTP_201_CREATED
)
def create_department(
    data: DepartmentCreate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    existing = db.query(Department).filter(
        (Department.name == data.name) |
        (Department.code == data.code)
    ).first()

    if existing:
        raise HTTPException(
            status_code=409,
            detail="Department name or code already exists"
        )

    department = Department(**data.model_dump())

    db.add(department)
    db.commit()
    db.refresh(department)

    return department


# ADMIN ONLY: Update department
@router.put(
    "/{department_id}",
    response_model=DepartmentResponse
)
def update_department(
    department_id: int,
    data: DepartmentUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided for update"
        )

    new_name = updates.get("name", department.name)
    new_code = updates.get("code", department.code)

    duplicate = db.query(Department).filter(
        Department.id != department_id,
        (Department.name == new_name) |
        (Department.code == new_code)
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=409,
            detail="Department name or code already exists"
        )

    for field, value in updates.items():
        setattr(department, field, value)

    db.commit()
    db.refresh(department)

    return department


# ADMIN ONLY: Delete department
@router.delete("/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    department = db.query(Department).filter(
        Department.id == department_id
    ).first()

    if not department:
        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    academic_years = db.query(AcademicYear).filter(
        AcademicYear.department_id == department_id
    ).count()

    if academic_years > 0:
        raise HTTPException(
            status_code=409,
            detail="Cannot delete department because academic years exist"
        )

    db.delete(department)
    db.commit()

    return {
        "message": "Department deleted successfully"
    }
