from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.announcement import Announcement
from app.schemas.announcement import (
    AnnouncementUpdate,
    AnnouncementResponse
)
from app.dependencies.auth import get_current_admin
from app.models.admin import Admin


router = APIRouter(
    prefix="/api/announcements",
    tags=["Announcements"]
)


# ==========================================
# GET ACTIVE ANNOUNCEMENT - PUBLIC
# ==========================================

@router.get(
    "/active",
    response_model=AnnouncementResponse | None
)
def get_active_announcement(
    db: Session = Depends(get_db)
):
    return (
        db.query(Announcement)
        .filter(Announcement.is_active == True)
        .order_by(Announcement.id.desc())
        .first()
    )


# ==========================================
# GET ANNOUNCEMENT - ADMIN
# ==========================================

@router.get(
    "/admin",
    response_model=AnnouncementResponse | None
)
def get_admin_announcement(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    return (
        db.query(Announcement)
        .order_by(Announcement.id.asc())
        .first()
    )


# ==========================================
# CREATE / UPDATE ANNOUNCEMENT - ADMIN
# ==========================================

@router.put(
    "/admin",
    response_model=AnnouncementResponse
)
def save_announcement(
    data: AnnouncementUpdate,
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    title = data.title.strip()
    message = data.message.strip()

    if not title or not message:
        raise HTTPException(
            status_code=422,
            detail="Title and message cannot be empty."
        )

    announcement = (
        db.query(Announcement)
        .order_by(Announcement.id.asc())
        .first()
    )

    try:
        if announcement is None:
            announcement = Announcement(
                title=title,
                message=message,
                announcement_type=data.announcement_type,
                is_active=data.is_active
            )
            db.add(announcement)

        else:
            announcement.title = title
            announcement.message = message
            announcement.announcement_type = data.announcement_type
            announcement.is_active = data.is_active

        db.commit()
        db.refresh(announcement)

        return announcement

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to save announcement."
        )