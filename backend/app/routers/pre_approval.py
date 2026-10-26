from datetime import datetime
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.security_user import SecurityUser
from app.services.auth_dependencies import get_current_user, require_roles
from app.models.pre_approval import PreApproval
from app.models.visit import Visit
from app.models.audit_log import AuditLog
from app.schemas.visit import (
    PreApprovalCreate,
)


router = APIRouter(
    prefix="/pre-approvals",
    tags=["Pre-Approvals"],
)


# =========================================
# CREATE PRE-APPROVAL
# =========================================

@router.post(
    "/",
)
async def create_pre_approval(
    data: PreApprovalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN")),
):
    pre_approval = PreApproval(
        visitor_id=data.visitor_id,
        host_employee_id=data.host_employee_id,
        purpose=data.purpose,
        expected_in_time=data.expected_in_time,
        expected_out_time=data.expected_out_time,
        status="PENDING",
    )

    db.add(pre_approval)

    # Also create matching Visit record in PENDING status for Gate Desk tracking
    visit = Visit(
        visitor_id=data.visitor_id,
        host_employee_id=data.host_employee_id,
        purpose=data.purpose,
        expected_out_time=data.expected_out_time,
        check_in_time=None,
        status="PENDING",
    )
    db.add(visit)

    await db.commit()
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(pre_approval.pre_approval_id),
        "visitor_id": pre_approval.visitor_id,
        "host_employee_id": pre_approval.host_employee_id,
        "purpose": pre_approval.purpose,
        "expected_in_time": pre_approval.expected_in_time,
        "expected_out_time": pre_approval.expected_out_time,
        "status": pre_approval.status,
        "created_at": pre_approval.created_at,
        "visit_id": str(visit.visit_id),
    }


# =========================================
# GET ALL PRE-APPROVALS WITH FULL DETAILS
# =========================================

@router.get(
    "/",
)
async def get_pre_approvals(
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(get_current_user),
):
    result = await db.execute(
        select(PreApproval)
        .options(
            selectinload(PreApproval.visitor),
            selectinload(PreApproval.host_employee),
        )
        .order_by(
            PreApproval.created_at.desc(),
            PreApproval.expected_in_time.desc(),
        )
    )

    approvals = result.scalars().all()
    if not approvals:
        return []

    # Efficient batch load matching visits & assets
    visitor_ids = [a.visitor_id for a in approvals]
    visits_res = await db.execute(
        select(Visit)
        .options(selectinload(Visit.assets))
        .where(Visit.visitor_id.in_(visitor_ids))
        .order_by(Visit.visit_id.desc())
    )
    all_visits = visits_res.scalars().all()
    visits_by_visitor = {}
    for v in all_visits:
        if v.visitor_id not in visits_by_visitor:
            visits_by_visitor[v.visitor_id] = v

    response_list = []
    for a in approvals:
        v = visits_by_visitor.get(a.visitor_id)
        assets_list = []
        if v and v.assets:
            assets_list = [
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
                }
                for asset in v.assets
            ]

        visitor_dict = None
        if a.visitor:
            visitor_dict = {
                "visitor_id": a.visitor.visitor_id,
                "first_name": a.visitor.first_name,
                "last_name": a.visitor.last_name,
                "phone_number": a.visitor.phone_number,
                "email": a.visitor.email,
                "company_name": a.visitor.company_name,
                "photo_url": (
                    f"/uploads/visitor_photos/{Path(a.visitor.photo_url).name}"
                    if a.visitor.photo_url
                    else None
                ),
                "address_line1": a.visitor.address_line1,
                "address_line2": a.visitor.address_line2,
                "city": a.visitor.city,
                "state": a.visitor.state,
                "postal_code": a.visitor.postal_code,
                "country": a.visitor.country,
            }

        host_dict = None
        if a.host_employee:
            host_dict = {
                "employee_id": a.host_employee.employee_id,
                "first_name": a.host_employee.first_name,
                "last_name": a.host_employee.last_name,
                "email": a.host_employee.email,
                "department": a.host_employee.department,
                "status": a.host_employee.status,
            }

        response_list.append({
            "pre_approval_id": str(a.pre_approval_id),
            "visitor_id": a.visitor_id,
            "host_employee_id": a.host_employee_id,
            "purpose": a.purpose,
            "expected_in_time": a.expected_in_time,
            "expected_out_time": a.expected_out_time,
            "status": a.status,
            "created_at": a.created_at,
            "visitor": visitor_dict,
            "host_employee": host_dict,
            "visit_id": str(v.visit_id) if v else None,
            "assets": assets_list,
        })

    return response_list


# =========================================
# APPROVE PRE-APPROVAL (ADMIN ONLY)
# =========================================

@router.post(
    "/{pre_approval_id}/approve",
)
async def approve_pre_approval(
    pre_approval_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN")),
):
    result = await db.execute(
        select(PreApproval).where(
            PreApproval.pre_approval_id == pre_approval_id
        )
    )

    pre_approval = result.scalar_one_or_none()

    if pre_approval is None:
        raise HTTPException(
            status_code=404,
            detail="Pre-approval not found",
        )

    if pre_approval.status not in ["PENDING", "WAITING"]:
        raise HTTPException(
            status_code=409,
            detail=(
                "Only pending or waiting requests can be approved. "
                f"Current status: {pre_approval.status}"
            ),
        )

    pre_approval.status = "APPROVED"

    # Synchronize matching Visit record
    visit_result = await db.execute(
        select(Visit).where(
            Visit.visitor_id == pre_approval.visitor_id,
            Visit.status.in_(["PENDING", "WAITING"]),
        )
    )
    matching_visit = visit_result.scalars().first()
    if matching_visit:
        matching_visit.status = "APPROVED"

    db.add(
        AuditLog(
            visit_id=matching_visit.visit_id if matching_visit else None,
            action="PRE_APPROVAL_APPROVED",
            description=f"Visit request approved by {current_user.email}. Ready for gate security check-in.",
            performed_by=f"{current_user.email} ({current_user.role})",
            created_at=datetime.utcnow(),
        )
    )

    await db.commit()
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(pre_approval.pre_approval_id),
        "status": pre_approval.status,
        "message": "Pre-approval approved successfully. Visitor ready for gate check-in.",
    }


# =========================================
# ASK TO WAIT (HOST BUSY / ON HOLD - ADMIN ONLY)
# =========================================

@router.post(
    "/{pre_approval_id}/wait",
)
async def ask_to_wait_pre_approval(
    pre_approval_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN")),
):
    result = await db.execute(
        select(PreApproval).where(
            PreApproval.pre_approval_id == pre_approval_id
        )
    )

    pre_approval = result.scalar_one_or_none()

    if pre_approval is None:
        raise HTTPException(
            status_code=404,
            detail="Pre-approval not found",
        )

    if pre_approval.status not in ["PENDING", "WAITING"]:
        raise HTTPException(
            status_code=409,
            detail=(
                "Only pending pre-approvals can be put on hold. "
                f"Current status: {pre_approval.status}"
            ),
        )

    pre_approval.status = "WAITING"

    visit_result = await db.execute(
        select(Visit).where(
            Visit.visitor_id == pre_approval.visitor_id,
            Visit.status.in_(["PENDING", "WAITING"]),
        )
    )
    matching_visit = visit_result.scalars().first()
    if matching_visit:
        matching_visit.status = "WAITING"

    db.add(
        AuditLog(
            visit_id=matching_visit.visit_id if matching_visit else None,
            action="VISIT_REQUEST_ON_HOLD",
            description=f"Host is busy. Visitor requested to wait in reception lobby by {current_user.email}.",
            performed_by=f"{current_user.email} ({current_user.role})",
            created_at=datetime.utcnow(),
        )
    )

    await db.commit()
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(pre_approval.pre_approval_id),
        "status": pre_approval.status,
        "message": "Host is currently busy. Visitor asked to wait in reception lobby.",
    }


# =========================================
# REJECT PRE-APPROVAL (ADMIN ONLY)
# =========================================

@router.post(
    "/{pre_approval_id}/reject",
)
async def reject_pre_approval(
    pre_approval_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN")),
):
    result = await db.execute(
        select(PreApproval).where(
            PreApproval.pre_approval_id == pre_approval_id
        )
    )

    pre_approval = result.scalar_one_or_none()

    if pre_approval is None:
        raise HTTPException(
            status_code=404,
            detail="Pre-approval not found",
        )

    if pre_approval.status not in ["PENDING", "WAITING"]:
        raise HTTPException(
            status_code=409,
            detail=(
                "Only pending or waiting requests can be rejected. "
                f"Current status: {pre_approval.status}"
            ),
        )

    pre_approval.status = "REJECTED"

    visit_result = await db.execute(
        select(Visit).where(
            Visit.visitor_id == pre_approval.visitor_id,
            Visit.status.in_(["PENDING", "WAITING", "APPROVED"]),
        )
    )
    matching_visit = visit_result.scalars().first()
    if matching_visit:
        matching_visit.status = "REJECTED"

    db.add(
        AuditLog(
            visit_id=matching_visit.visit_id if matching_visit else None,
            action="PRE_APPROVAL_REJECTED",
            description=f"Visit request rejected by {current_user.email}. Entry denied.",
            performed_by=f"{current_user.email} ({current_user.role})",
            created_at=datetime.utcnow(),
        )
    )

    await db.commit()
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(pre_approval.pre_approval_id),
        "status": pre_approval.status,
        "message": "Pre-approval rejected successfully. Entry denied.",
    }


# =========================================
# CHECK IN APPROVED VISITOR (GATE SECURITY & ADMIN)
# =========================================

@router.post(
    "/{pre_approval_id}/check-in",
)
async def check_in_pre_approved_visitor(
    pre_approval_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(require_roles("ADMIN", "SECURITY")),
):
    result = await db.execute(
        select(PreApproval)
        .where(
            PreApproval.pre_approval_id == pre_approval_id
        )
        .with_for_update()
    )

    pre_approval = result.scalar_one_or_none()

    if pre_approval is None:
        raise HTTPException(
            status_code=404,
            detail="Pre-approval not found",
        )

    if pre_approval.status != "APPROVED":
        raise HTTPException(
            status_code=409,
            detail=(
                "Only approved pre-approvals can be checked in. "
                f"Current status: {pre_approval.status}"
            ),
        )

    visit_result = await db.execute(
        select(Visit).where(
            Visit.visitor_id == pre_approval.visitor_id,
            Visit.status.in_(["APPROVED", "PENDING", "WAITING"]),
        )
    )
    visit = visit_result.scalars().first()

    if visit:
        visit.status = "ACTIVE"
        visit.check_in_time = datetime.utcnow()
    else:
        visit = Visit(
            visitor_id=pre_approval.visitor_id,
            host_employee_id=pre_approval.host_employee_id,
            purpose=pre_approval.purpose,
            expected_out_time=pre_approval.expected_out_time,
            check_in_time=datetime.utcnow(),
            status="ACTIVE",
        )
        db.add(visit)

    await db.flush()

    pre_approval.status = "CHECKED_IN"

    performer = f"{current_user.email} ({current_user.role})"

    db.add(
        AuditLog(
            visit_id=visit.visit_id,
            action="VISITOR_CHECKED_IN",
            description=(
                f"Visitor checked in successfully by {current_user.role} ({current_user.email}). "
                "Approved visit is now active on premises."
            ),
            performed_by=performer,
            created_at=datetime.utcnow(),
        )
    )

    await db.commit()
    await db.refresh(visit)
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(pre_approval.pre_approval_id),
        "pre_approval_status": pre_approval.status,
        "visit_id": str(visit.visit_id),
        "visit_status": visit.status,
        "message": "Visitor checked in successfully by Gate Security.",
    }
