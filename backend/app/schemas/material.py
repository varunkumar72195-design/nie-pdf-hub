
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MaterialResponse(BaseModel):
    id: int
    subject_id: int
    title: str
    description: str | None = None
    file_name: str
    file_size: int
    uploaded_at: datetime

    view_url: str
    download_url: str

    model_config = ConfigDict(from_attributes=True)


class MaterialUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
