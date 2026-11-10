
from pydantic import BaseModel, ConfigDict


class SemesterCreate(BaseModel):
    academic_year_id: int
    semester_number: int
    name: str


class SemesterUpdate(BaseModel):
    semester_number: int | None = None
    name: str | None = None


class SemesterResponse(BaseModel):
    id: int
    academic_year_id: int
    semester_number: int
    name: str

    model_config = ConfigDict(from_attributes=True)
