
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    func
)

from app.database import Base


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(Integer, primary_key=True, index=True)

    event_type = Column(
        String(30),
        nullable=False,
        index=True
    )

    visitor_id = Column(
        String(100),
        nullable=False,
        index=True
    )

    session_id = Column(
        String(100),
        nullable=False,
        index=True
    )

    page_path = Column(
        String(500),
        nullable=True
    )

    material_id = Column(
        Integer,
        ForeignKey("materials.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
