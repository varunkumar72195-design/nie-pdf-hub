
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func
)
from sqlalchemy.orm import relationship

from app.database import Base


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)

    subject_id = Column(
        Integer,
        ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Original PDF filename
    file_name = Column(String(255), nullable=False)

    # Secure generated filename
    stored_file_name = Column(String(255), unique=True, nullable=False)

    # Internal storage location
    file_path = Column(String(500), nullable=False)

    file_size = Column(Integer, nullable=False)

    uploaded_by = Column(
        Integer,
        ForeignKey("admins.id", ondelete="SET NULL"),
        nullable=True
    )

    uploaded_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )

    subject = relationship(
        "Subject",
        back_populates="materials"
    )
