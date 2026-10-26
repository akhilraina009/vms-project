
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class VisitorCreate(BaseModel):
    first_name: str = Field(min_length=1, max_length=100)
    last_name: str = Field(min_length=1, max_length=100)
    phone_number: str = Field(min_length=1, max_length=20)
    email: EmailStr | None = None
    company_name: str | None = Field(default=None, max_length=255)
    photo_url: str | None = Field(default=None, max_length=500)

    # Visitor address details
    address_line1: str | None = Field(default=None, max_length=255)
    address_line2: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=100)
    state: str | None = Field(default=None, max_length=100)
    postal_code: str | None = Field(default=None, max_length=20)
    country: str | None = Field(default=None, max_length=100)


class VisitorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    visitor_id: int
    first_name: str
    last_name: str
    phone_number: str
    email: EmailStr | None
    company_name: str | None
    photo_url: str | None

    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
