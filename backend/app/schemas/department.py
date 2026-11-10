
from pydantic import BaseModel, ConfigDict


class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: str | None = None


class DepartmentUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None


class DepartmentResponse(BaseModel):
    id: int
    name: str
    code: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
