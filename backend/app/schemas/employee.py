from pydantic import BaseModel, EmailStr


class EmployeeCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None = None


class EmployeeResponse(BaseModel):
    employee_id: int
    first_name: str
    last_name: str
    email: EmailStr
    department: str | None
    status: str

    class Config:
        from_attributes = True