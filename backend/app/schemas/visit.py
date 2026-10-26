from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class VisitorInfo(BaseModel):
    visitor_id: int
    first_name: str
    last_name: str
    phone_number: str
    email: str | None = None
    company_name: str | None = None
    photo_url: str | None = None

    # Visitor address details
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None

    class Config:
        from_attributes = True


class EmployeeInfo(BaseModel):
    employee_id: int
    first_name: str
    last_name: str
    email: str
    department: str | None = None
    status: str

    class Config:
        from_attributes = True


class SecurityVisitResponse(BaseModel):
    visit_id: UUID
    status: str
    purpose: str
    check_in_time: datetime | None = None
    visitor: VisitorInfo
    host_employee: EmployeeInfo
    assets: list[dict] = []


class VisitCreate(BaseModel):
    visitor_id: int
    host_employee_id: int
    purpose: str
    expected_out_time: datetime | None = None


class VisitResponse(BaseModel):
    visit_id: UUID
    visitor_id: int
    host_employee_id: int
    purpose: str
    check_in_time: datetime | None = None
    expected_out_time: datetime | None = None
    check_out_time: datetime | None = None
    status: str

    class Config:
        from_attributes = True


# =========================================
# PRE-APPROVAL SCHEMAS
# =========================================

class PreApprovalCreate(BaseModel):
    visitor_id: int
    host_employee_id: int
    purpose: str
    expected_in_time: datetime
    expected_out_time: datetime | None = None


class PreApprovalResponse(BaseModel):
    pre_approval_id: UUID
    visitor_id: int
    host_employee_id: int
    purpose: str
    expected_in_time: datetime
    expected_out_time: datetime | None = None
    status: str
    created_at: datetime
    visitor: VisitorInfo | None = None
    host_employee: EmployeeInfo | None = None

    class Config:
        from_attributes = True
