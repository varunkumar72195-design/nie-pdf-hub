
from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_admin
from app.models.admin import Admin
from app.models.analytics import AnalyticsEvent
from app.models.material import Material


router = APIRouter(
    prefix="/api/analytics",
    tags=["Analytics"]
)


# ==========================================
# REQUEST SCHEMA
# ==========================================

class PageViewRequest(BaseModel):
    event_type: str = Field(pattern="^page_view$")
    visitor_id: UUID
    session_id: UUID
    page_path: str = Field(min_length=1, max_length=500)


# ==========================================
# PUBLIC: TRACK PAGE VIEWS
# ==========================================

@router.post("/track")
def track_page_view(
    data: PageViewRequest,
    db: Session = Depends(get_db)
):
    event = AnalyticsEvent(
        event_type=data.event_type,
        visitor_id=str(data.visitor_id),
        session_id=str(data.session_id),
        page_path=data.page_path
    )

    db.add(event)
    db.commit()

    return {
        "message": "Page view recorded"
    }


# ==========================================
# ADMIN: ANALYTICS SUMMARY
# ==========================================

@router.get("/summary")
def get_analytics_summary(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    page_views = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.event_type == "page_view"
    ).count()

    unique_visitors = db.query(
        func.count(func.distinct(AnalyticsEvent.visitor_id))
    ).filter(
        AnalyticsEvent.event_type == "page_view"
    ).scalar() or 0

    pdf_views = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.event_type == "pdf_view"
    ).count()

    pdf_downloads = db.query(AnalyticsEvent).filter(
        AnalyticsEvent.event_type == "pdf_download"
    ).count()

    return {
        "total_visits": page_views,
        "unique_visitors": unique_visitors,
        "page_views": page_views,
        "pdf_views": pdf_views,
        "pdf_downloads": pdf_downloads
    }


# ==========================================
# ADMIN: MOST DOWNLOADED PDFs
# ==========================================

@router.get("/top-downloads")
def get_top_downloads(
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    results = (
        db.query(
            Material.id,
            Material.title,
            Material.file_name,
            func.count(AnalyticsEvent.id).label("download_count")
        )
        .join(
            AnalyticsEvent,
            AnalyticsEvent.material_id == Material.id
        )
        .filter(
            AnalyticsEvent.event_type == "pdf_download"
        )
        .group_by(
            Material.id,
            Material.title,
            Material.file_name
        )
        .order_by(
            desc("download_count")
        )
        .limit(5)
        .all()
    )

    return [
        {
            "material_id": row.id,
            "title": row.title,
            "file_name": row.file_name,
            "downloads": row.download_count
        }
        for row in results
    ]


# ==========================================
# ADMIN: DAILY ACTIVITY
# ==========================================

@router.get("/activity")
def get_analytics_activity(
    days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
    admin: Admin = Depends(get_current_admin)
):
    start_date = datetime.now(timezone.utc) - timedelta(days=days - 1)

    results = (
        db.query(
            func.date(AnalyticsEvent.created_at).label("activity_date"),
            AnalyticsEvent.event_type,
            func.count(AnalyticsEvent.id).label("event_count")
        )
        .filter(
            AnalyticsEvent.created_at >= start_date
        )
        .group_by(
            func.date(AnalyticsEvent.created_at),
            AnalyticsEvent.event_type
        )
        .order_by(
            func.date(AnalyticsEvent.created_at)
        )
        .all()
    )

    activity = {}

    for row in results:
        date_key = str(row.activity_date)

        if date_key not in activity:
            activity[date_key] = {
                "date": date_key,
                "page_views": 0,
                "pdf_views": 0,
                "pdf_downloads": 0
            }

        if row.event_type == "page_view":
            activity[date_key]["page_views"] = row.event_count

        elif row.event_type == "pdf_view":
            activity[date_key]["pdf_views"] = row.event_count

        elif row.event_type == "pdf_download":
            activity[date_key]["pdf_downloads"] = row.event_count

    return list(activity.values())
