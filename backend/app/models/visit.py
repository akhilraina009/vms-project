import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.employee import Employee
from app.models.visitor import Visitor
from app.models.asset import Asset


class Visit(Base):
    __tablename__ = "visits"

    visit_id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4
    )

    visitor_id: Mapped[int] = mapped_column(
        ForeignKey("visitors.visitor_id"),
        nullable=False
    )

    host_employee_id: Mapped[int] = mapped_column(
        ForeignKey("employees.employee_id"),
        nullable=False
    )

    purpose: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )

    check_in_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        default=None,
        nullable=True
    )

    expected_out_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    check_out_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="ACTIVE",
        nullable=False
    )

    # Relationship with Visitor
    visitor: Mapped[Visitor] = relationship(
        "Visitor",
        foreign_keys=[visitor_id]
    )

    # Relationship with Employee/Host
    host_employee: Mapped[Employee] = relationship(
        "Employee",
        foreign_keys=[host_employee_id]
    )

    # Relationship with Assets
    assets: Mapped[list[Asset]] = relationship(
        "Asset",
        foreign_keys="Asset.visit_id"
    )
