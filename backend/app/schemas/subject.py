
from pydantic import BaseModel, ConfigDict


class SubjectCreate(BaseModel):
    semester_id: int
    name: str
    code: str
    description: str | None = None


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class SubjectResponse(BaseModel):
    id: int
    semester_id: int
    name: str
    code: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
