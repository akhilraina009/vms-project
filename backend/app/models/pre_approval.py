import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.employee import Employee
from app.models.visitor import Visitor


class PreApproval(Base):
    __tablename__ = "pre_approvals"

    pre_approval_id: Mapped[uuid.UUID] = mapped_column(
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

    expected_in_time: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False
    )

    expected_out_time: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    status: Mapped[str] = mapped_column(
        String(30),
        default="PENDING",
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        nullable=False
    )

    visitor: Mapped[Visitor] = relationship(
        "Visitor",
        foreign_keys=[visitor_id]
    )

    host_employee: Mapped[Employee] = relationship(
        "Employee",
        foreign_keys=[host_employee_id]
    )