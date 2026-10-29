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
    is_cleared_for_exit: bool = False


class AssetUpdate(BaseModel):
    asset_type: str | None = None
    brand_model: str | None = None
    serial_number: str | None = None
    photo_data: str | None = None
    photo_url: str | None = None
    is_cleared_for_exit: bool | None = None
    cleared_by: str | None = None
    disposition: str | None = None  # "CARRIED_OUT" | "RETAINED_ON_PREMISES" | "PENDING"
    retention_note: str | None = None


class AssetPhotoUpload(BaseModel):
    photo_data: str


class AssetDispositionItem(BaseModel):
    asset_id: UUID
    disposition: str  # "CARRIED_OUT" | "RETAINED_ON_PREMISES" | "PENDING"
    retention_note: str | None = None


class BatchDispositionPayload(BaseModel):
    visit_id: UUID
    dispositions: list[AssetDispositionItem]


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
    disposition: str | None = None

    class Config:
        from_attributes = True

