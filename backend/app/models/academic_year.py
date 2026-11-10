
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    DateTime,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)

    department_id = Column(
        Integer,
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False
    )

    year_number = Column(Integer, nullable=False)
    name = Column(String(50), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "department_id",
            "year_number",
            name="uq_department_year"
        ),
    )

    department = relationship(
        "Department",
        back_populates="academic_years"
    )

    semesters = relationship(
        "Semester",
        back_populates="academic_year",
        cascade="all, delete-orphan"
    )
