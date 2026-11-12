from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class Regulation(Base):
    __tablename__ = "regulations"

    id = Column(Integer, primary_key=True, index=True)

    department_id = Column(
        Integer,
        ForeignKey("departments.id", ondelete="CASCADE"),
        nullable=False
    )

    name = Column(String(50), nullable=False)
    code = Column(String(20), nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "department_id",
            "code",
            name="uq_department_regulation"
        ),
    )

    department = relationship(
        "Department",
        back_populates="regulations"
    )

    academic_years = relationship(
        "AcademicYear",
        back_populates="regulation"
    )