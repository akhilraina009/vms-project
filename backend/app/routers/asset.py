from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.asset import Asset
from app.models.audit_log import AuditLog
from app.models.employee import Employee
from app.models.security_user import SecurityUser
from app.models.visit import Visit
from app.models.visitor import Visitor
from app.schemas.asset import AssetCreate, AssetDispositionItem, AssetPhotoUpload, AssetResponse, AssetUpdate, BatchDispositionPayload
from app.services.auth_dependencies import get_current_user, get_optional_current_user, require_roles


router = APIRouter(
    prefix="/assets",
    tags=["Assets"]
)


class AssetRecoveryPayload(BaseModel):
    visitor_id: int | None = None
    first_name: str | None = None
    last_name: str | None = None
    phone_number: str | None = None
    email: str | None = None
    company_name: str | None = None
    address_line1: str | None = None
    city: str | None = None
    state: str | None = None

    host_employee_id: int
    asset_type: str
    brand_model: str | None = None
    serial_number: str | None = None
    recovery_reason: str = "IT Asset Recovery"
    photo_data: str | None = None
    is_cleared_for_exit: bool = False


@router.post(
    "/",
    response_model=AssetResponse
)
async def create_asset(
    asset_data: AssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    # Prevent registering the same serial number twice
    # for the same visit. Serial numbers are optional.
    serial_number = (
        asset_data.serial_number.strip()
        if asset_data.serial_number
        else None
    )

    if serial_number:
        existing_result = await db.execute(
            select(Asset).where(
                Asset.visit_id == asset_data.visit_id,
                Asset.serial_number.ilike(serial_number),
            )
        )
        existing_asset = existing_result.scalar_one_or_none()

        if existing_asset is not None:
            raise HTTPException(
                status_code=409,
                detail=(
                    "An asset with this serial number is "
                    "already registered for this visit."
                ),
            )

    photo_url = asset_data.photo_url
    if not photo_url and asset_data.photo_data:
        from app.routers.public_registration import save_asset_photo
        photo_url = save_asset_photo(asset_data.photo_data)

    user_email = (
        current_user.email
        if current_user and getattr(current_user, "email", None)
        else "it-admin@company.com"
    )

    now = datetime.now(timezone.utc)
    is_cleared = bool(asset_data.is_cleared_for_exit)

    asset = Asset(
        visit_id=asset_data.visit_id,
        asset_type=asset_data.asset_type.strip(),
        brand_model=asset_data.brand_model.strip() if asset_data.brand_model else None,
        serial_number=serial_number,
        photo_url=photo_url,
        is_cleared_for_exit=is_cleared,
        cleared_by=user_email if is_cleared else None,
        cleared_at=now if is_cleared else None,
    )

    db.add(asset)

    # Audit log entry for tracking in-visit hardware additions
    audit_log = AuditLog(
        visit_id=asset_data.visit_id,
        action="ASSET_ADDED_DURING_VISIT",
        description=(
            f"Hardware asset '{asset.asset_type}' ({asset.brand_model or 'N/A'}, "
            f"SN: {serial_number or 'N/A'}) registered by {user_email}. "
            f"Exit clearance: {'Pre-cleared' if is_cleared else 'Pending inspection'}."
        ),
        performed_by=user_email,
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(asset)

    return asset


@router.put(
    "/{asset_id}",
    response_model=AssetResponse
)
async def update_asset(
    asset_id: UUID,
    update_data: AssetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    result = await db.execute(
        select(Asset).where(Asset.asset_id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    user_email = (
        current_user.email
        if current_user and getattr(current_user, "email", None)
        else "it-admin@company.com"
    )
    now = datetime.now(timezone.utc)
    changes = []

    if update_data.asset_type is not None and update_data.asset_type.strip():
        new_type = update_data.asset_type.strip()
        if asset.asset_type != new_type:
            changes.append(f"Type: '{asset.asset_type}' -> '{new_type}'")
            asset.asset_type = new_type

    if update_data.brand_model is not None:
        new_bm = update_data.brand_model.strip() or None
        if asset.brand_model != new_bm:
            changes.append(f"Model: '{asset.brand_model}' -> '{new_bm}'")
            asset.brand_model = new_bm

    if update_data.serial_number is not None:
        new_sn = update_data.serial_number.strip() or None
        if asset.serial_number != new_sn:
            # Check collision with other assets on this same visit
            if new_sn:
                collision_result = await db.execute(
                    select(Asset).where(
                        Asset.visit_id == asset.visit_id,
                        Asset.asset_id != asset.asset_id,
                        Asset.serial_number.ilike(new_sn),
                    )
                )
                if collision_result.scalar_one_or_none() is not None:
                    raise HTTPException(
                        status_code=409,
                        detail="Another asset with this serial number is already registered for this visit."
                    )
            changes.append(f"SN: '{asset.serial_number}' -> '{new_sn}'")
            asset.serial_number = new_sn

    if update_data.photo_data:
        from app.routers.public_registration import save_asset_photo
        new_photo_url = save_asset_photo(update_data.photo_data)
        asset.photo_url = new_photo_url
        changes.append("Updated physical photograph")
    elif update_data.photo_url is not None and update_data.photo_url != asset.photo_url:
        asset.photo_url = update_data.photo_url
        changes.append("Updated photo URL")

    if update_data.disposition:
        disp = update_data.disposition.upper()
        if disp == "RETAINED_ON_PREMISES":
            asset.is_cleared_for_exit = True
            note = (update_data.retention_note or "Installed / Kept in use on premises").strip()
            asset.cleared_by = f"RETAINED_ON_PREMISES: {note} ({user_email})"
            asset.cleared_at = now
            changes.append(f"Disposition: Retained on Premises - {note}")
        elif disp == "CARRIED_OUT":
            asset.is_cleared_for_exit = True
            asset.cleared_by = f"CARRIED_OUT: Cleared for departure exit ({user_email})"
            asset.cleared_at = now
            changes.append("Disposition: Carried Out (Departure Exit Cleared)")
        elif disp == "PENDING":
            asset.is_cleared_for_exit = False
            asset.cleared_by = None
            asset.cleared_at = None
            changes.append("Disposition: Reset to Pending Inspection")
    elif update_data.cleared_by is not None:
        asset.cleared_by = update_data.cleared_by
        if update_data.is_cleared_for_exit is not None:
            asset.is_cleared_for_exit = update_data.is_cleared_for_exit
        else:
            asset.is_cleared_for_exit = True
        asset.cleared_at = now
        changes.append(f"Clearance tag updated: {asset.cleared_by}")
    elif update_data.is_cleared_for_exit is not None:
        if asset.is_cleared_for_exit != update_data.is_cleared_for_exit:
            asset.is_cleared_for_exit = update_data.is_cleared_for_exit
            if update_data.is_cleared_for_exit:
                if not asset.cleared_by or "PENDING" in asset.cleared_by:
                    asset.cleared_by = f"CARRIED_OUT: Cleared by {user_email}"
                asset.cleared_at = now
                changes.append("Granted departure clearance")
            else:
                asset.cleared_by = None
                asset.cleared_at = None
                changes.append("Marked exit clearance pending")

    if changes:
        audit_log = AuditLog(
            visit_id=asset.visit_id,
            action="ASSET_UPDATED_DURING_VISIT",
            description=(
                f"Asset {asset.asset_id} updated by {user_email}: {'; '.join(changes)}"
            ),
            performed_by=user_email,
        )
        db.add(audit_log)

    await db.commit()
    await db.refresh(asset)
    return asset


@router.post("/batch-disposition")
async def batch_update_disposition(
    payload: BatchDispositionPayload,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    user_email = (
        current_user.email
        if current_user and getattr(current_user, "email", None)
        else "it-admin@company.com"
    )
    now = datetime.now(timezone.utc)
    updated_assets = []
    audit_notes = []

    for item in payload.dispositions:
        res = await db.execute(select(Asset).where(Asset.asset_id == item.asset_id, Asset.visit_id == payload.visit_id))
        asset = res.scalar_one_or_none()
        if not asset:
            continue
        disp = item.disposition.upper()
        if disp == "RETAINED_ON_PREMISES":
            asset.is_cleared_for_exit = True
            note = (item.retention_note or "Installed / Kept in use on premises").strip()
            asset.cleared_by = f"RETAINED_ON_PREMISES: {note} ({user_email})"
            asset.cleared_at = now
            audit_notes.append(f"{asset.asset_type} ({asset.brand_model or 'N/A'}): Retained ({note})")
        elif disp == "CARRIED_OUT":
            asset.is_cleared_for_exit = True
            asset.cleared_by = f"CARRIED_OUT: Cleared for departure exit ({user_email})"
            asset.cleared_at = now
            audit_notes.append(f"{asset.asset_type} ({asset.brand_model or 'N/A'}): Carried Out")
        elif disp == "PENDING":
            asset.is_cleared_for_exit = False
            asset.cleared_by = None
            asset.cleared_at = None
            audit_notes.append(f"{asset.asset_type} ({asset.brand_model or 'N/A'}): Pending Inspection")
        updated_assets.append(asset)

    if audit_notes:
        audit_log = AuditLog(
            visit_id=payload.visit_id,
            action="ASSETS_DISPOSITION_UPDATED",
            description=f"Hardware exit disposition updated by {user_email}: {'; '.join(audit_notes)}",
            performed_by=user_email,
        )
        db.add(audit_log)

    await db.commit()
    for a in updated_assets:
        await db.refresh(a)

    return {
        "success": True,
        "visit_id": str(payload.visit_id),
        "updated_count": len(updated_assets),
        "assets": [
            {
                "asset_id": str(a.asset_id),
                "asset_type": a.asset_type,
                "brand_model": a.brand_model,
                "serial_number": a.serial_number,
                "photo_url": a.photo_url,
                "is_cleared_for_exit": a.is_cleared_for_exit,
                "cleared_by": a.cleared_by,
                "cleared_at": a.cleared_at.isoformat() if a.cleared_at else None,
                "disposition": a.disposition,
            }
            for a in updated_assets
        ]
    }


@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    result = await db.execute(
        select(Asset).where(Asset.asset_id == asset_id)
    )
    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    user_email = (
        current_user.email
        if current_user and getattr(current_user, "email", None)
        else "it-admin@company.com"
    )
    visit_id = asset.visit_id
    asset_desc = f"{asset.asset_type} ({asset.brand_model or 'N/A'}, SN: {asset.serial_number or 'N/A'})"

    await db.delete(asset)

    audit_log = AuditLog(
        visit_id=visit_id,
        action="ASSET_REMOVED_FROM_VISIT",
        description=f"Asset {asset_desc} removed from visit by {user_email}.",
        performed_by=user_email,
    )
    db.add(audit_log)

    await db.commit()
    return {
        "success": True,
        "message": f"Asset {asset_desc} removed successfully",
        "asset_id": str(asset_id),
        "visit_id": str(visit_id),
    }


@router.post("/upload-photo")
async def upload_asset_photo(
    payload: AssetPhotoUpload,
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    from app.routers.public_registration import save_asset_photo
    photo_url = save_asset_photo(payload.photo_data)
    return {"photo_url": photo_url}


@router.get(
    "/",
    response_model=list[AssetResponse]
)
async def get_assets(
    visit_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    query = select(Asset)

    if visit_id is not None:
        query = query.where(Asset.visit_id == visit_id)

    query = query.order_by(Asset.asset_type)

    result = await db.execute(query)
    assets = result.scalars().all()

    return assets


@router.patch("/{asset_id}/clear")
@router.patch("/{asset_id}/clear-for-exit")
async def clear_asset_for_exit(
    asset_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    result = await db.execute(
        select(Asset).where(
            Asset.asset_id == asset_id
        )
    )

    asset = result.scalar_one_or_none()

    if asset is None:
        raise HTTPException(
            status_code=404,
            detail="Asset not found"
        )

    now = datetime.now(timezone.utc)
    audit_action = None
    user_email = current_user.email if (current_user and getattr(current_user, "email", None)) else "guard@vms.local"

    if not asset.is_cleared_for_exit:
        asset.is_cleared_for_exit = True
        asset.cleared_by = user_email
        asset.cleared_at = now
        audit_action = "ASSET_CLEARED"
    else:
        # this is the original clearance event.
        if asset.cleared_by is None:
            asset.cleared_by = user_email
        if asset.cleared_at is None:
            asset.cleared_at = now
        audit_action = "ASSET_CLEARANCE_AUDIT_VERIFIED"

    if audit_action is not None:
        audit_log = AuditLog(
            visit_id=asset.visit_id,
            action=audit_action,
            description=(
                f"{audit_action}. "
                f"Asset ID: {asset.asset_id}; "
                f"Type: {asset.asset_type}; "
                f"Brand/Model: {asset.brand_model}; "
                f"Serial Number: {asset.serial_number}; "
                f"Verified by: {user_email}; "
                f"Verified at: {now.isoformat()}"
            ),
            performed_by=user_email,
        )
        db.add(audit_log)

    await db.commit()
    await db.refresh(asset)

    return {
        "asset_id": str(asset.asset_id),
        "visit_id": str(asset.visit_id),
        "asset_type": asset.asset_type,
        "brand_model": asset.brand_model,
        "serial_number": asset.serial_number,
        "is_cleared_for_exit": asset.is_cleared_for_exit,
        "cleared_by": asset.cleared_by,
        "cleared_at": (
            asset.cleared_at.isoformat()
            if asset.cleared_at else None
        ),
        "audit_action": audit_action,
    }


# ============================================================
# IT DEPARTMENT: ASSET INVENTORY & RECOVERY API
# ============================================================

@router.get("/inventory")
async def get_asset_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(get_current_user),
):
    """
    Returns full IT department inventory with detailed origin trace,
    carrier/person collecting or delivering the asset, receiving IT host,
    and security clearance status.
    """
    query = (
        select(Visit, Visitor, Employee, Asset)
        .join(Visitor, Visit.visitor_id == Visitor.visitor_id)
        .outerjoin(Employee, Visit.host_employee_id == Employee.employee_id)
        .outerjoin(Asset, Asset.visit_id == Visit.visit_id)
        .where(
            (Visit.purpose.like("%[IT_VISIT]%"))
            | (Visit.purpose.like("%IT_VISIT%"))
            | (Visit.purpose.like("%IT Asset Recovery%"))
            | (Visit.purpose.like("%IT Department%"))
        )
        .order_by(Visit.check_in_time.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    records = []
    for visit, visitor, host, asset in rows:
        formatted_address = ", ".join(
            [part for part in [
                visitor.address_line1,
                visitor.address_line2,
                visitor.city,
                visitor.state,
                visitor.postal_code,
                visitor.country
            ] if part and part.strip()]
        ) or "Not recorded"

        # Determine recovery / return categorization
        purpose_lower = (visit.purpose or "").lower()
        is_recovery = any(
            keyword in purpose_lower
            for keyword in ["recovery", "recover", "return", "offboard", "repair", "service", "upgrade", "replace", "collect"]
        )

        if asset is not None:
            custody_status = (
                "CLEARED_EXIT"
                if asset.is_cleared_for_exit
                else ("ON_PREMISES" if visit.status == "ACTIVE" else "RETAINED_BY_IT")
            )

            records.append({
                "asset_id": str(asset.asset_id),
                "visit_id": str(visit.visit_id),
                "asset_type": asset.asset_type,
                "brand_model": asset.brand_model or "Standard Hardware",
                "serial_number": asset.serial_number or "N/A",
                "photo_url": asset.photo_url,
                "is_cleared_for_exit": asset.is_cleared_for_exit,
                "cleared_by": asset.cleared_by,
                "cleared_at": asset.cleared_at.isoformat() if asset.cleared_at else None,
                "custody_status": custody_status,
                "is_recovery": is_recovery,
                "visit": {
                    "visit_id": str(visit.visit_id),
                    "purpose": visit.purpose,
                    "status": visit.status,
                    "check_in_time": visit.check_in_time.isoformat() if visit.check_in_time else None,
                    "expected_out_time": visit.expected_out_time.isoformat() if visit.expected_out_time else None,
                    "check_out_time": visit.check_out_time.isoformat() if visit.check_out_time else None,
                },
                "carrier_visitor": {
                    "visitor_id": visitor.visitor_id,
                    "name": f"{visitor.first_name} {visitor.last_name}".strip(),
                    "first_name": visitor.first_name,
                    "last_name": visitor.last_name,
                    "phone": visitor.phone_number,
                    "email": visitor.email,
                    "company": visitor.company_name or "IT Vendor / Contractor",
                    "photo_url": visitor.photo_url,
                    "city": visitor.city,
                    "state": visitor.state,
                    "country": visitor.country,
                    "origin_address": formatted_address,
                },
                "receiver_host": {
                    "employee_id": host.employee_id if host else None,
                    "name": f"{host.first_name} {host.last_name}".strip() if host else "IT Support Team",
                    "department": host.department if host else "IT",
                    "email": host.email if host else "it-support@company.com",
                }
            })
        else:
            # IT visit without carried hardware (e.g. software or cloud diagnostics)
            custody_status = "ON_PREMISES" if visit.status == "ACTIVE" else "CLEARED_EXIT"
            records.append({
                "asset_id": f"NO-HW-{str(visit.visit_id)[:8]}",
                "visit_id": str(visit.visit_id),
                "asset_type": "Technical Contractor (No Hardware)",
                "brand_model": "Software / Diagnostics / Consultation",
                "serial_number": "N/A - Technical Scope Only",
                "photo_url": None,
                "is_cleared_for_exit": visit.status != "ACTIVE",
                "cleared_by": None,
                "cleared_at": None,
                "custody_status": custody_status,
                "is_recovery": False,
                "visit": {
                    "visit_id": str(visit.visit_id),
                    "purpose": visit.purpose,
                    "status": visit.status,
                    "check_in_time": visit.check_in_time.isoformat() if visit.check_in_time else None,
                    "expected_out_time": visit.expected_out_time.isoformat() if visit.expected_out_time else None,
                    "check_out_time": visit.check_out_time.isoformat() if visit.check_out_time else None,
                },
                "carrier_visitor": {
                    "visitor_id": visitor.visitor_id,
                    "name": f"{visitor.first_name} {visitor.last_name}".strip(),
                    "first_name": visitor.first_name,
                    "last_name": visitor.last_name,
                    "phone": visitor.phone_number,
                    "email": visitor.email,
                    "company": visitor.company_name or "IT Vendor / Contractor",
                    "photo_url": visitor.photo_url,
                    "city": visitor.city,
                    "state": visitor.state,
                    "country": visitor.country,
                    "origin_address": formatted_address,
                },
                "receiver_host": {
                    "employee_id": host.employee_id if host else None,
                    "name": f"{host.first_name} {host.last_name}".strip() if host else "IT Support Team",
                    "department": host.department if host else "IT",
                    "email": host.email if host else "it-support@company.com",
                }
            })

    total_assets = len(records)
    on_premises = sum(1 for r in records if r["custody_status"] == "ON_PREMISES")
    cleared_exit = sum(1 for r in records if r["is_cleared_for_exit"])
    retained_it = sum(1 for r in records if r["custody_status"] == "RETAINED_BY_IT")
    recoveries_count = sum(1 for r in records if r["is_recovery"])

    return {
        "statistics": {
            "total_assets": total_assets,
            "on_premises": on_premises,
            "cleared_exit": cleared_exit,
            "retained_it": retained_it,
            "recoveries_count": recoveries_count,
        },
        "assets": records,
    }


@router.post("/recovery")
async def register_asset_recovery(
    payload: AssetRecoveryPayload,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(get_current_user),
):
    """
    Directly registers an IT asset recovery handover.
    Can link an existing visitor or create carrier details on the fly.
    """
    # 1. Resolve or create visitor
    visitor = None
    if payload.visitor_id:
        result = await db.execute(select(Visitor).where(Visitor.visitor_id == payload.visitor_id))
        visitor = result.scalar_one_or_none()

    if visitor is None:
        if not payload.first_name or not payload.phone_number:
            raise HTTPException(status_code=400, detail="Carrier first name and phone number are required.")
        visitor = Visitor(
            first_name=payload.first_name.strip(),
            last_name=(payload.last_name or "").strip(),
            phone_number=payload.phone_number.strip(),
            email=payload.email.strip() if payload.email else None,
            company_name=payload.company_name.strip() if payload.company_name else None,
            address_line1=payload.address_line1.strip() if payload.address_line1 else None,
            city=payload.city.strip() if payload.city else None,
            state=payload.state.strip() if payload.state else None,
        )
        db.add(visitor)
        await db.flush()

    # 2. Create visit
    now = datetime.now()
    visit = Visit(
        visitor_id=visitor.visitor_id,
        host_employee_id=payload.host_employee_id,
        purpose=payload.recovery_reason.strip() or "Device Recovery / Handover",
        status="ACTIVE",
        check_in_time=now,
    )
    db.add(visit)
    await db.flush()

    # 3. Save photo if provided
    photo_url = None
    if payload.photo_data:
        from app.routers.public_registration import save_asset_photo
        photo_url = save_asset_photo(payload.photo_data)

    # 4. Create asset
    asset = Asset(
        visit_id=visit.visit_id,
        asset_type=payload.asset_type.strip(),
        brand_model=payload.brand_model.strip() if payload.brand_model else None,
        serial_number=payload.serial_number.strip() if payload.serial_number else None,
        photo_url=photo_url,
        is_cleared_for_exit=payload.is_cleared_for_exit,
        cleared_by=current_user.email if payload.is_cleared_for_exit else None,
        cleared_at=datetime.now(timezone.utc) if payload.is_cleared_for_exit else None,
    )
    db.add(asset)

    # 5. Add audit log
    audit_log = AuditLog(
        visit_id=visit.visit_id,
        action="IT_ASSET_RECOVERY_REGISTERED",
        description=(
            f"Asset {asset.asset_type} ({asset.brand_model or 'N/A'}, SN: {asset.serial_number or 'N/A'}) "
            f"registered by {current_user.email} for recovery/custody. Carrier: {visitor.first_name} {visitor.last_name}"
        ),
        performed_by=current_user.email,
    )
    db.add(audit_log)

    await db.commit()
    await db.refresh(asset)

    return {
        "success": True,
        "message": "Asset recovery registered successfully",
        "asset_id": str(asset.asset_id),
        "visit_id": str(visit.visit_id),
    }
