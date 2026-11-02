from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None = None
    phone_number: str | None = None
    designation: str | None = None
    office_location: str | None = None
    notes: str | None = None
    status: str | None = "ACTIVE"


class EmployeeResponse(BaseModel):
    employee_id: int
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None = None
    status: str = "ACTIVE"
    phone_number: str | None = None
    designation: str | None = None
    office_location: str | None = None
    notes: str | None = None

    class Config:
        from_attributes = True
