
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field, ConfigDict


class PublicRegistrationAsset(BaseModel):
    asset_type: str = Field(min_length=1, max_length=100)
    brand_model: str | None = Field(default=None, max_length=255)
    serial_number: str | None = Field(default=None, max_length=255)
    photo_data: str | None = None


class PublicRegistrationCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone_number: str = Field(min_length=1, max_length=20)
    email: EmailStr | None = None
    company_name: str | None = Field(default=None, max_length=255)

    # Visitor address details
    address_line1: str | None = Field(default=None, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)

    # The frontend submits the captured photo as a data URL.
    photo_data: str | None = None

    host_employee_id: int = Field(gt=0)
    purpose: str = Field(min_length=1, max_length=500)
    expected_out_time: datetime | None = None

    assets: list[PublicRegistrationAsset] = Field(
        default_factory=list,
        max_length=20,
    )


class PublicRegistrationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    visitor_id: int
    visit_id: str
    visitor_name: str
    host_name: str
    purpose: str
    expected_out_time: datetime | None
    status: str
    qr_token: str
