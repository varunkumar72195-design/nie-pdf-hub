
from pydantic import BaseModel, ConfigDict, Field


class RegulationCreate(BaseModel):
    department_id: int
    name: str = Field(min_length=1, max_length=50)
    code: str = Field(min_length=1, max_length=20)
    description: str | None = None


class RegulationUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=50)
    code: str | None = Field(default=None, min_length=1, max_length=20)
    description: str | None = None


class RegulationResponse(BaseModel):
    id: int
    department_id: int
    name: str
    code: str
    description: str | None = None

    model_config = ConfigDict(from_attributes=True)
