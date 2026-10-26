from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class AssetCreate(BaseModel):
    visit_id: UUID
    asset_type: str
    brand_model: str | None = None
    serial_number: str | None = None
    photo_data: str | None = None
    photo_url: str | None = None


class AssetResponse(BaseModel):
    asset_id: UUID
    visit_id: UUID
    asset_type: str
    brand_model: str | None
    serial_number: str | None
    photo_url: str | None = None
    is_cleared_for_exit: bool
    cleared_by: str | None = None
    cleared_at: datetime | None = None

    class Config:
        from_attributes = True