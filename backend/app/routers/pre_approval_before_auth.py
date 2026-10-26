from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.pre_approval import PreApproval
from app.models.visit import Visit
from app.schemas.visit import (
    PreApprovalCreate,
    PreApprovalResponse,
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
    response_model=PreApprovalResponse,
)
async def create_pre_approval(
    data: PreApprovalCreate,
    db: AsyncSession = Depends(get_db),
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

    await db.commit()
    await db.refresh(pre_approval)

    return pre_approval


# =========================================
# GET ALL PRE-APPROVALS
# =========================================

@router.get(
    "/",
    response_model=list[PreApprovalResponse],
)
async def get_pre_approvals(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PreApproval).order_by(
            PreApproval.expected_in_time
        )
    )

    return result.scalars().all()


# =========================================
# APPROVE PRE-APPROVAL
# =========================================

@router.post(
    "/{pre_approval_id}/approve",
)
async def approve_pre_approval(
    pre_approval_id: UUID,
    db: AsyncSession = Depends(get_db),
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

    if pre_approval.status != "PENDING":
        raise HTTPException(
            status_code=409,
            detail=(
                "Only pending pre-approvals can be approved. "
                f"Current status: {pre_approval.status}"
            ),
        )

    pre_approval.status = "APPROVED"

    await db.commit()
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(
            pre_approval.pre_approval_id
        ),
        "status": pre_approval.status,
        "message": "Pre-approval approved successfully",
    }


# =========================================
# REJECT PRE-APPROVAL
# =========================================

@router.post(
    "/{pre_approval_id}/reject",
)
async def reject_pre_approval(
    pre_approval_id: UUID,
    db: AsyncSession = Depends(get_db),
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

    if pre_approval.status != "PENDING":
        raise HTTPException(
            status_code=409,
            detail=(
                "Only pending pre-approvals can be rejected. "
                f"Current status: {pre_approval.status}"
            ),
        )

    pre_approval.status = "REJECTED"

    await db.commit()
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(
            pre_approval.pre_approval_id
        ),
        "status": pre_approval.status,
        "message": "Pre-approval rejected successfully",
    }


# =========================================
# CHECK IN APPROVED VISITOR
# =========================================

@router.post(
    "/{pre_approval_id}/check-in",
)
async def check_in_pre_approved_visitor(
    pre_approval_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    # Lock the pre-approval row while checking its status.
    # PostgreSQL's FOR UPDATE lock helps prevent concurrent
    # check-in requests from creating duplicate visits.
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

    # =========================================
    # PREVENT EARLY CHECK-IN
    # =========================================
    current_time = datetime.now()
    expected_arrival = pre_approval.expected_in_time

    # Normalize timezone awareness if PostgreSQL returns a tz-aware datetime
    if expected_arrival.tzinfo is not None and current_time.tzinfo is None:
        current_time = datetime.now(expected_arrival.tzinfo)
    elif expected_arrival.tzinfo is None and current_time.tzinfo is not None:
        current_time = current_time.replace(tzinfo=None)

    if expected_arrival > current_time:
        raise HTTPException(
            status_code=409,
            detail=(
                "Check-in is not allowed before the scheduled "
                "arrival time. Expected arrival: "
                f"{expected_arrival.strftime('%d %b %Y, %I:%M %p')}"
            ),
        )

    # Create the actual visit only when the visitor arrives.
    visit = Visit(
        visitor_id=pre_approval.visitor_id,
        host_employee_id=pre_approval.host_employee_id,
        purpose=pre_approval.purpose,
        expected_out_time=pre_approval.expected_out_time,
        status="ACTIVE",
    )

    db.add(visit)

    # Generate the visit UUID before building the response.
    await db.flush()

    # Mark this pre-approval as already checked in.
    pre_approval.status = "CHECKED_IN"

    await db.commit()
    await db.refresh(visit)
    await db.refresh(pre_approval)

    return {
        "pre_approval_id": str(
            pre_approval.pre_approval_id
        ),
        "pre_approval_status": pre_approval.status,
        "visit_id": str(visit.visit_id),
        "visit_status": visit.status,
        "message": "Visitor checked in successfully",
    }