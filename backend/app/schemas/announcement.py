from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class AnnouncementUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1)
    announcement_type: Literal["info", "warning", "important"]
    is_active: bool = False


class AnnouncementResponse(BaseModel):
    id: int
    title: str
    message: str
    announcement_type: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)