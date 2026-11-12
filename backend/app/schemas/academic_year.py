
from pydantic import BaseModel, ConfigDict, Field


class AcademicYearCreate(BaseModel):
    department_id: int
    regulation_id: int
    year_number: int = Field(ge=1, le=4)
    name: str = Field(min_length=1, max_length=50)


class AcademicYearUpdate(BaseModel):
    regulation_id: int | None = None
    year_number: int | None = Field(default=None, ge=1, le=4)
    name: str | None = Field(default=None, min_length=1, max_length=50)


class AcademicYearResponse(BaseModel):
    id: int
    department_id: int
    regulation_id: int
    year_number: int
    name: str

    model_config = ConfigDict(from_attributes=True)
