import base64
import binascii
import hashlib
import re
import secrets
import uuid
from uuid import UUID
from datetime import datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.asset import Asset
from app.models.audit_log import AuditLog
from app.models.employee import Employee
from app.models.pre_approval import PreApproval
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.models.visitor_pass_token import VisitorPassToken
from app.schemas.public_registration import PublicRegistrationCreate


router = APIRouter(
    prefix="/public-registration",
    tags=["Public Visitor Registration"],
)

BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
PHOTO_DIR = (BACKEND_DIR / "uploads" / "visitor_photos").resolve()
PHOTO_DIR.mkdir(parents=True, exist_ok=True)
ASSET_PHOTO_DIR = (BACKEND_DIR / "uploads" / "asset_photos").resolve()
ASSET_PHOTO_DIR.mkdir(parents=True, exist_ok=True)

MAX_PHOTO_BYTES = 3 * 1024 * 1024
PASS_TOKEN_LIFETIME_HOURS = 24


def create_pass_token() -> tuple[str, str]:
    """Return the raw QR token and its SHA-256 hash."""
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(
        raw_token.encode("utf-8")
    ).hexdigest()

    return raw_token, token_hash


@router.get("/hosts")
async def get_active_hosts(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            Employee.employee_id,
            Employee.first_name,
            Employee.last_name,
            Employee.department,
        )
        .where(Employee.status == "ACTIVE")
        .order_by(Employee.first_name, Employee.last_name)
    )

    employees = result.all()

    return [
        {
            "employee_id": employee.employee_id,
            "name": (
                f"{employee.first_name} {employee.last_name}"
            ),
            "department": employee.department,
        }
        for employee in employees
    ]


def save_asset_photo(photo_data: str | None) -> str | None:
    """Validate a JPEG/PNG data URL and save the asset photo."""
    if not photo_data:
        return None

    match = re.fullmatch(
        r"data:image/(jpeg|jpg|png);base64,([A-Za-z0-9+/=\r\n]+)",
        photo_data,
    )

    if not match:
        raise HTTPException(
            status_code=422,
            detail="Asset photo must be a valid JPEG or PNG data URL.",
        )

    image_type = match.group(1)
    encoded = match.group(2)

    try:
        photo_bytes = base64.b64decode(encoded, validate=True)
    except (binascii.Error, ValueError):
        raise HTTPException(
            status_code=422,
            detail="The asset photo data is invalid.",
        )

    if not photo_bytes or len(photo_bytes) > MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Asset photo must be smaller than 3 MB.",
        )

    if image_type in ("jpeg", "jpg"):
        if not photo_bytes.startswith(b"\xff\xd8\xff"):
            raise HTTPException(
                status_code=422,
                detail="Invalid JPEG image for asset.",
            )
        extension = ".jpg"
    else:
        if not photo_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(
                status_code=422,
                detail="Invalid PNG image for asset.",
            )
        extension = ".png"

    ASSET_PHOTO_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    destination = ASSET_PHOTO_DIR / filename
    destination.write_bytes(photo_bytes)

    return f"/uploads/asset_photos/{filename}"


def save_visitor_photo(photo_data: str | None) -> str | None:
    """Validate a JPEG/PNG data URL and save the photo."""
    if not photo_data:
        return None

    match = re.fullmatch(
        r"data:image/(jpeg|jpg|png);base64,([A-Za-z0-9+/=\r\n]+)",
        photo_data,
    )

    if not match:
        raise HTTPException(
            status_code=422,
            detail="Photo must be a valid JPEG or PNG data URL.",
        )

    image_type = match.group(1)
    encoded = match.group(2)

    try:
        photo_bytes = base64.b64decode(
            encoded,
            validate=True,
        )
    except (binascii.Error, ValueError):
        raise HTTPException(
            status_code=422,
            detail="The photo data is invalid.",
        )

    if not photo_bytes or len(photo_bytes) > MAX_PHOTO_BYTES:
        raise HTTPException(
            status_code=413,
            detail="Photo must be smaller than 3 MB.",
        )

    # Check file signatures instead of trusting the submitted MIME type.
    if image_type in ("jpeg", "jpg"):
        if not photo_bytes.startswith(b"\xff\xd8\xff"):
            raise HTTPException(
                status_code=422,
                detail="Invalid JPEG image.",
            )

        extension = ".jpg"
    else:
        if not photo_bytes.startswith(b"\x89PNG\r\n\x1a\n"):
            raise HTTPException(
                status_code=422,
                detail="Invalid PNG image.",
            )

        extension = ".png"

    PHOTO_DIR.mkdir(parents=True, exist_ok=True)

    filename = f"{uuid.uuid4().hex}{extension}"
    destination = PHOTO_DIR / filename
    destination.write_bytes(photo_bytes)

    # Store the web URL path in the database.
    return f"/uploads/visitor_photos/{filename}"


@router.post("/register", status_code=201)
async def register_public_visitor(
    data: PublicRegistrationCreate,
    db: AsyncSession = Depends(get_db),
):
    first_name = data.first_name.strip()
    last_name = data.last_name.strip()
    phone_number = data.phone_number.strip()
    purpose = data.purpose.strip()

    if (
        not first_name
        or not last_name
        or not phone_number
        or not purpose
    ):
        raise HTTPException(
            status_code=422,
            detail=(
                "Name, phone number, and visit purpose are required."
            ),
        )

    if data.expected_out_time is not None:
        expected_out_time = data.expected_out_time

        if expected_out_time.tzinfo is not None:
            expected_out_time = expected_out_time.replace(
                tzinfo=None
            )
    else:
        expected_out_time = None

    host_result = await db.execute(
        select(Employee).where(
            Employee.employee_id == data.host_employee_id,
            Employee.status == "ACTIVE",
        )
    )

    host = host_result.scalar_one_or_none()

    if host is None:
        raise HTTPException(
            status_code=422,
            detail="Selected host is not active or does not exist.",
        )

    # Validate and save the photo before committing database records.
    photo_path = save_visitor_photo(data.photo_data)

    # Create the visitor, including address fields.
    visitor = Visitor(
        first_name=first_name,
        last_name=last_name,
        phone_number=phone_number,
        email=str(data.email) if data.email else None,
        company_name=(
            data.company_name.strip()
            if data.company_name
            else None
        ),
        photo_url=photo_path,
        address_line1=(
            data.address_line1.strip()
            if data.address_line1
            else None
        ),
        address_line2=(
            data.address_line2.strip()
            if data.address_line2
            else None
        ),
        city=(
            data.city.strip()
            if data.city
            else None
        ),
        state=(
            data.state.strip()
            if data.state
            else None
        ),
        postal_code=(
            data.postal_code.strip()
            if data.postal_code
            else None
        ),
        country=(
            data.country.strip()
            if data.country
            else None
        ),
    )

    try:
        db.add(visitor)
        await db.flush()

        # Create PreApproval in PENDING status for Admin cross-check and approval
        pre_approval = PreApproval(
            visitor_id=visitor.visitor_id,
            host_employee_id=host.employee_id,
            purpose=purpose,
            expected_in_time=datetime.utcnow(),
            expected_out_time=expected_out_time,
            status="PENDING",
        )
        db.add(pre_approval)

        # Create Visit record in PENDING status (not checked in yet)
        visit = Visit(
            visitor_id=visitor.visitor_id,
            host_employee_id=host.employee_id,
            purpose=purpose,
            expected_out_time=expected_out_time,
            check_in_time=None,
            status="PENDING",
        )

        db.add(visit)
        await db.flush()

        # Register any assets submitted with the visitor form.
        for item in data.assets:
            asset_type = item.asset_type.strip()

            if not asset_type:
                raise HTTPException(
                    status_code=422,
                    detail="Asset type cannot be blank.",
                )

            asset_photo_path = save_asset_photo(item.photo_data)
            db.add(
                Asset(
                    visit_id=visit.visit_id,
                    asset_type=asset_type,
                    brand_model=(
                        item.brand_model.strip()
                        if item.brand_model
                        else None
                    ),
                    serial_number=(
                        item.serial_number.strip()
                        if item.serial_number
                        else None
                    ),
                    photo_url=asset_photo_path,
                )
            )

        # Generate a visitor pass token and store only its hash.
        qr_token, token_hash = create_pass_token()

        pass_token_record = VisitorPassToken(
            visit_id=visit.visit_id,
            token_hash=token_hash,
            expires_at=(
                datetime.utcnow()
                + timedelta(hours=PASS_TOKEN_LIFETIME_HOURS)
            ),
            revoked=False,
        )

        db.add(pass_token_record)
        await db.flush()

        # Record visitor request raised in audit log for real-time notifications
        is_it_visit = "[IT_VISIT]" in (visit.purpose or "")
        db.add(
            AuditLog(
                visit_id=visit.visit_id,
                action="IT_VISITOR_REQUEST_RAISED" if is_it_visit else "VISITOR_REQUEST_RAISED",
                description=(
                    f"{'IT ' if is_it_visit else ''}Visitor request raised by {visitor.first_name} {visitor.last_name} "
                    f"to meet {host.first_name} {host.last_name} ({host.department or 'General'}). "
                    f"Purpose: {visit.purpose}. Awaiting Admin / IT approval."
                ),
                performed_by=f"{'IT Visitor' if is_it_visit else 'Visitor'} ({visitor.first_name} {visitor.last_name})",
                created_at=datetime.utcnow(),
            )
        )

        await db.commit()
        await db.refresh(visitor)
        await db.refresh(visit)
        await db.refresh(pre_approval)

        return {
            "visitor_id": visitor.visitor_id,
            "pre_approval_id": str(pre_approval.pre_approval_id),
            "visit_id": str(visit.visit_id),
            "visitor_name": (
                f"{visitor.first_name} {visitor.last_name}"
            ),
            "host_name": (
                f"{host.first_name} {host.last_name}"
            ),
            "purpose": visit.purpose,
            "expected_out_time": visit.expected_out_time,
            "status": visit.status,
            "qr_token": qr_token,
        }

    except Exception:
        await db.rollback()
        raise


@router.get("/verify-pass/{token}")
async def verify_visitor_pass(
    token: str,
    db: AsyncSession = Depends(get_db),
):
    token_str = token.strip()
    token_hash = hashlib.sha256(
        token_str.encode("utf-8")
    ).hexdigest()

    # 1. Look up pass record by sha256(token_str) OR direct token_str (if already hash)
    result = await db.execute(
        select(VisitorPassToken).where(
            (VisitorPassToken.token_hash == token_hash)
            | (VisitorPassToken.token_hash == token_str),
            VisitorPassToken.revoked.is_(False),
        )
    )

    pass_record = result.scalars().first()

    # 2. If not found, check if token is a direct visit UUID or badge reference (e.g. VMS-UUID)
    clean_uuid_str = token_str[4:] if token_str.upper().startswith("VMS-") else token_str
    if pass_record is None:
        try:
            visit_uuid = UUID(clean_uuid_str)
            res_by_visit = await db.execute(
                select(VisitorPassToken)
                .where(
                    VisitorPassToken.visit_id == visit_uuid,
                    VisitorPassToken.revoked.is_(False),
                )
                .order_by(VisitorPassToken.created_at.desc())
            )
            pass_record = res_by_visit.scalars().first()
        except (ValueError, TypeError):
            pass_record = None

    visit = None
    if pass_record is not None:
        visit_result = await db.execute(
            select(Visit).where(
                Visit.visit_id == pass_record.visit_id
            )
        )
        visit = visit_result.scalar_one_or_none()
    else:
        # If no pass_record found, try finding the visit directly by UUID or badge prefix
        try:
            visit_uuid = UUID(clean_uuid_str)
            visit_result = await db.execute(
                select(Visit).where(Visit.visit_id == visit_uuid)
            )
            visit = visit_result.scalar_one_or_none()
        except (ValueError, TypeError):
            pass

    if visit is None:
        raise HTTPException(
            status_code=404,
            detail="Visitor pass is invalid or has been revoked.",
        )

    now = datetime.utcnow()

    # Handle timezone-aware database timestamps safely.
    if pass_record and pass_record.expires_at:
        expires_at = pass_record.expires_at
        if expires_at.tzinfo is not None:
            expires_at = expires_at.replace(tzinfo=None)

        # Allow actively on-site visitors to verify their pass for gate departure check-out
        if expires_at <= now and visit.status != "ACTIVE":
            raise HTTPException(
                status_code=410,
                detail="Visitor pass has expired.",
            )
    else:
        expires_at = visit.expected_out_time or (datetime.utcnow() + timedelta(days=1))

    visitor_result = await db.execute(
        select(Visitor).where(
            Visitor.visitor_id == visit.visitor_id
        )
    )

    visitor = visitor_result.scalar_one_or_none()

    if visitor is None:
        raise HTTPException(
            status_code=404,
            detail="Visitor record was not found.",
        )

    host_result = await db.execute(
        select(Employee).where(
            Employee.employee_id == visit.host_employee_id
        )
    )

    host = host_result.scalar_one_or_none()

    assets_result = await db.execute(
        select(Asset).where(
            Asset.visit_id == visit.visit_id
        )
    )

    assets = assets_result.scalars().all()

    asset_details = [
        {
            "asset_id": str(asset.asset_id),
            "asset_type": asset.asset_type,
            "brand_model": asset.brand_model,
            "serial_number": asset.serial_number,
            "photo_url": (
                f"/uploads/asset_photos/{Path(asset.photo_url).name}"
                if asset.photo_url
                else None
            ),
            "is_cleared_for_exit": asset.is_cleared_for_exit,
            "cleared_by": asset.cleared_by,
            "disposition": asset.disposition,
        }
        for asset in assets
    ]

    # Look up latest pre-approval for expected_in_time and real-time host decision
    pre_app_result = await db.execute(
        select(PreApproval)
        .where(PreApproval.visitor_id == visit.visitor_id)
        .order_by(PreApproval.created_at.desc())
    )
    pre_app = pre_app_result.scalars().first()
    expected_in_time = pre_app.expected_in_time if pre_app else None

    # If the pre-approval has a specific decision (RESCHEDULED, WAITING, REJECTED, APPROVED),
    # ensure it takes precedence unless the visitor is already ACTIVE or CHECKED_OUT.
    live_status = visit.status
    if pre_app and visit.status not in ["ACTIVE", "CHECKED_OUT"]:
        if pre_app.status in ["RESCHEDULED", "WAITING", "REJECTED", "APPROVED"]:
            live_status = pre_app.status

    # Return visitor details, including live status, address, check_in_time
    return {
        "visit_id": str(visit.visit_id),
        "visitor_id": visitor.visitor_id,
        "visitor_name": (
            f"{visitor.first_name} {visitor.last_name}"
        ),
        "company_name": visitor.company_name,
        "phone_number": visitor.phone_number,
        "email": visitor.email,
        "host_name": (
            f"{host.first_name} {host.last_name}"
            if host
            else "Unknown"
        ),
        "host_department": host.department if host else "General",
        "purpose": visit.purpose,
        "status": live_status,
        "expected_in_time": expected_in_time,
        "check_in_time": visit.check_in_time,
        "expected_out_time": visit.expected_out_time,
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
        "expires_at": expires_at,
        "assets": asset_details,
    }
