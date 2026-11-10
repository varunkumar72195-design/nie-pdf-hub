
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


class Semester(Base):
    __tablename__ = "semesters"

    id = Column(Integer, primary_key=True, index=True)

    academic_year_id = Column(
        Integer,
        ForeignKey("academic_years.id", ondelete="CASCADE"),
        nullable=False
    )

    semester_number = Column(Integer, nullable=False)
    name = Column(String(50), nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "academic_year_id",
            "semester_number",
            name="uq_academic_year_semester"
        ),
    )

    academic_year = relationship(
        "AcademicYear",
        back_populates="semesters"
    )

    subjects = relationship(
        "Subject",
        back_populates="semester",
        cascade="all, delete-orphan"
    )
