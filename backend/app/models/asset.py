import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class Asset(Base):
    __tablename__ = "assets"

    asset_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    visit_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("visits.visit_id"),
        nullable=False
    )

    asset_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    brand_model: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    serial_number: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    photo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    is_cleared_for_exit: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False
    )

    # Audit trail: who cleared the asset
    cleared_by: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    # Audit trail: when the asset was cleared
    cleared_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    # Relationship with Visit
    visit = relationship(
        "Visit",
        back_populates="assets"
    )