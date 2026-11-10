
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    DateTime,
    UniqueConstraint,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String(150), nullable=False)
    code = Column(String(30), nullable=False)
    description = Column(Text, nullable=True)

    semester_id = Column(
        Integer,
        ForeignKey("semesters.id", ondelete="CASCADE"),
        nullable=False
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    __table_args__ = (
        UniqueConstraint(
            "semester_id",
            "code",
            name="uq_semester_subject_code"
        ),
    )

    semester = relationship(
        "Semester",
        back_populates="subjects"
    )

    materials = relationship(
        "Material",
        back_populates="subject",
        cascade="all, delete-orphan"
    )
