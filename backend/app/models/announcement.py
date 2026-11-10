from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, func

from app.database import Base


class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String(200), nullable=False)

    message = Column(Text, nullable=False)

    announcement_type = Column(
        String(20),
        nullable=False,
        default="info"
    )

    is_active = Column(
        Boolean,
        nullable=False,
        default=False
    )

    created_at = Column(
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