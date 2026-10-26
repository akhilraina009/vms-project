
from pathlib import Path

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.database import Base


class Visitor(Base):
    __tablename__ = "visitors"

    visitor_id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True
    )

    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    phone_number: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    company_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    photo_url: Mapped[str | None] = mapped_column(
        String(500),
        nullable=True
    )

    # Visitor address details
    address_line1: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    address_line2: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    state: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )

    postal_code: Mapped[str | None] = mapped_column(
        String(20),
        nullable=True
    )

    country: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True
    )


def verify_visitor_pass(visitor, host, visit, pass_record):
    return {
        "visitor_name": f"{visitor.first_name} {visitor.last_name}",
        "host_name": (
            f"{host.first_name} {host.last_name}" if host else "Unknown"
        ),
        "purpose": visit.purpose,
        "status": visit.status,
        "expires_at": pass_record.expires_at,
        "photo_url": (
            f"/uploads/visitor_photos/{Path(visitor.photo_url).name}"
            if visitor.photo_url
            else None
        ),
        "address": {
            "address_line1": visitor.address_line1,
            "address_line2": visitor.address_line2,
            "city": visitor.city,
            "state": visitor.state,
            "postal_code": visitor.postal_code,
            "country": visitor.country,
        },
    }
