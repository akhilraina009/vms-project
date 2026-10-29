from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.database import get_db
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.asset import Asset
from app.models.employee import Employee
from app.models.security_user import SecurityUser
from app.schemas.visitor import VisitorCreate, VisitorResponse
from app.services.auth_dependencies import get_current_user, get_optional_current_user


router = APIRouter(
    prefix="/visitors",
    tags=["Visitors"]
)


# ============================================================
# 1. CREATE VISITOR
# ============================================================

@router.post(
    "/",
    response_model=VisitorResponse
)
async def create_visitor(
    visitor_data: VisitorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    visitor = Visitor(
        first_name=visitor_data.first_name,
        last_name=visitor_data.last_name,
        phone_number=visitor_data.phone_number,
        email=visitor_data.email,
        company_name=visitor_data.company_name,
        photo_url=visitor_data.photo_url,
        address_line1=visitor_data.address_line1,
        address_line2=visitor_data.address_line2,
        city=visitor_data.city,
        state=visitor_data.state,
        postal_code=visitor_data.postal_code,
        country=visitor_data.country,
    )

    db.add(visitor)

    await db.commit()
    await db.refresh(visitor)

    return visitor


# ============================================================
# 2. GET ALL VISITORS (EXCLUDES IT VISITORS BY DEFAULT)
# ============================================================

@router.get(
    "/",
    response_model=list[VisitorResponse]
)
async def get_visitors(
    include_it: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    """
    Get all visitors. By default (include_it=False), excludes IT Department visitors 
    who registered via the IT Visit form ([IT_VISIT]), reserving this directory 
    strictly for general/corporate visitors.
    """
    query = select(Visitor).order_by(Visitor.visitor_id.desc())
    if not include_it:
        it_visitor_ids_subquery = (
            select(Visit.visitor_id)
            .where(
                Visit.purpose.like("%[IT_VISIT]%"),
                Visit.visitor_id.is_not(None),
            )
            .distinct()
        )
        query = query.where(Visitor.visitor_id.not_in(it_visitor_ids_subquery))

    result = await db.execute(query)
    visitors = result.scalars().all()

    return visitors

# ============================================================
# 3. GET IT VISITORS DIRECTORY
# ============================================================

@router.get(
    "/it",
)
async def get_it_visitors(
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    """Return all unique visitors associated with IT technical visits, hardware assets, or IT hosts."""
    stmt = (
        select(Visit)
        .options(
            selectinload(Visit.visitor),
            selectinload(Visit.host_employee),
            selectinload(Visit.assets),
        )
        .order_by(Visit.check_in_time.desc().nullslast(), Visit.visit_id.desc())
    )
    res = await db.execute(stmt)
    all_visits = res.scalars().all()

    # Strictly filter to only visits submitted through the IT Visit form ([IT_VISIT])
    it_visits = [
        v
        for v in all_visits
        if v.purpose and "[IT_VISIT]" in v.purpose
    ]

    grouped = {}
    for v in it_visits:
        if not v.visitor:
            continue
        vid = v.visitor.visitor_id
        if vid not in grouped:
            grouped[vid] = {
                "visitor_id": vid,
                "first_name": v.visitor.first_name,
                "last_name": v.visitor.last_name,
                "phone_number": v.visitor.phone_number,
                "email": v.visitor.email,
                "company_name": v.visitor.company_name,
                "photo_url": v.visitor.photo_url,
                "address_line1": v.visitor.address_line1,
                "address_line2": v.visitor.address_line2,
                "city": v.visitor.city,
                "state": v.visitor.state,
                "postal_code": v.visitor.postal_code,
                "country": v.visitor.country,
                "is_inside": False,
                "total_assets": 0,
                "latest_visit": None,
                "active_visit": None,
                "pending_visit": None,
                "visits": [],
            }
        v_data = {
            "visit_id": str(v.visit_id),
            "purpose": v.purpose,
            "status": v.status,
            "check_in_time": v.check_in_time.isoformat() if v.check_in_time else None,
            "check_out_time": v.check_out_time.isoformat() if v.check_out_time else None,
            "expected_out_time": v.expected_out_time.isoformat() if v.expected_out_time else None,
            "host_employee": {
                "employee_id": v.host_employee.employee_id,
                "first_name": v.host_employee.first_name,
                "last_name": v.host_employee.last_name,
                "email": v.host_employee.email,
                "department": v.host_employee.department,
            }
            if v.host_employee
            else None,
            "assets": [
                {
                    "asset_id": a.asset_id,
                    "asset_type": a.asset_type,
                    "brand_model": a.brand_model,
                    "serial_number": a.serial_number,
                    "photo_url": a.photo_url,
                    "is_cleared_for_exit": a.is_cleared_for_exit,
                    "cleared_by": a.cleared_by,
                    "cleared_at": a.cleared_at.isoformat() if a.cleared_at else None,
                }
                for a in (v.assets or [])
            ],
        }
        grouped[vid]["visits"].append(v_data)
        if v.status == "ACTIVE":
            grouped[vid]["is_inside"] = True
            if grouped[vid].get("active_visit") is None:
                grouped[vid]["active_visit"] = v_data
        elif v.status in ["PENDING", "APPROVED"] and grouped[vid].get("pending_visit") is None:
            grouped[vid]["pending_visit"] = v_data

        grouped[vid]["total_assets"] += len(v.assets or [])
        if grouped[vid]["latest_visit"] is None:
            grouped[vid]["latest_visit"] = v_data

    visitors_list = list(grouped.values())
    visitors_list.sort(key=lambda x: (not x["is_inside"], -x["visitor_id"]))

    companies = set(
        x["company_name"].strip()
        for x in visitors_list
        if x.get("company_name") and x["company_name"].strip().lower() != "n/a"
    )

    return {
        "visitors": visitors_list,
        "summary": {
            "total_it_visitors": len(visitors_list),
            "currently_inside": sum(1 for x in visitors_list if x["is_inside"]),
            "total_assets": sum(x["total_assets"] for x in visitors_list),
            "total_companies": len(companies),
        },
    }


# ============================================================
# 4. GET SINGLE VISITOR COMPLETE DETAILS & VISITS
# ============================================================

@router.get("/{visitor_id}")
async def get_visitor_details(
    visitor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    stmt = select(Visitor).where(Visitor.visitor_id == visitor_id)
    res = await db.execute(stmt)
    visitor = res.scalar_one_or_none()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    visits_stmt = (
        select(Visit)
        .options(
            selectinload(Visit.host_employee),
            selectinload(Visit.assets),
        )
        .where(Visit.visitor_id == visitor_id)
        .order_by(Visit.visit_id.desc())
    )
    visits_res = await db.execute(visits_stmt)
    visits = visits_res.scalars().all()

    active_visit = next((v for v in visits if v.status == "ACTIVE"), None)
    target_visit = active_visit or (visits[0] if visits else None)

    # Use target visit's assets if present; otherwise resolve from visitor's declared assets across visits
    if target_visit and target_visit.assets:
        source_assets = target_visit.assets
    else:
        source_assets = []
        seen_keys = set()
        for v in visits:
            for a in (v.assets or []):
                key = (a.asset_type, a.serial_number or a.brand_model)
                if key not in seen_keys:
                    seen_keys.add(key)
                    source_assets.append(a)

    declared_assets = [
        {
            "asset_id": str(a.asset_id),
            "asset_type": a.asset_type,
            "brand_model": a.brand_model,
            "serial_number": a.serial_number,
            "photo_url": (
                f"/uploads/asset_photos/{Path(a.photo_url).name}"
                if a.photo_url
                else None
            ),
            "is_cleared_for_exit": a.is_cleared_for_exit,
            "cleared_by": a.cleared_by,
            "cleared_at": a.cleared_at.isoformat() if a.cleared_at else None,
            "disposition": a.disposition,
        }
        for a in source_assets
    ]

    visitor_profile = {
        "visitor_id": visitor.visitor_id,
        "first_name": visitor.first_name,
        "last_name": visitor.last_name,
        "phone_number": visitor.phone_number,
        "email": visitor.email,
        "company_name": visitor.company_name,
        "photo_url": (
            f"/uploads/visitor_photos/{Path(visitor.photo_url).name}"
            if visitor.photo_url
            else None
        ),
        "address_line1": visitor.address_line1,
        "address_line2": visitor.address_line2,
        "city": visitor.city,
        "state": visitor.state,
        "postal_code": visitor.postal_code,
        "country": visitor.country,
    }

    visits_data = [
        {
            "visit_id": str(v.visit_id),
            "status": v.status,
            "purpose": v.purpose,
            "check_in_time": v.check_in_time.isoformat() if v.check_in_time else None,
            "check_out_time": v.check_out_time.isoformat() if v.check_out_time else None,
            "expected_out_time": v.expected_out_time.isoformat() if v.expected_out_time else None,
            "host_name": (
                f"{v.host_employee.first_name} {v.host_employee.last_name}"
                if v.host_employee
                else "Unknown"
            ),
            "host_department": v.host_employee.department if v.host_employee else "General",
            "assets_count": len(v.assets or []),
        }
        for v in visits
    ]

    return {
        **visitor_profile,
        "visitor": visitor_profile,
        "assets": declared_assets,
        "declared_assets": declared_assets,
        "is_inside": active_visit is not None,
        "active_visit": {
            "visit_id": str(active_visit.visit_id),
            "status": active_visit.status,
            "purpose": active_visit.purpose,
            "check_in_time": active_visit.check_in_time.isoformat() if active_visit.check_in_time else None,
            "expected_out_time": active_visit.expected_out_time.isoformat() if active_visit.expected_out_time else None,
            "host_employee": {
                "employee_id": active_visit.host_employee.employee_id,
                "first_name": active_visit.host_employee.first_name,
                "last_name": active_visit.host_employee.last_name,
                "department": active_visit.host_employee.department,
                "email": active_visit.host_employee.email,
            } if active_visit.host_employee else None,
            "assets": [
                {
                    "asset_id": str(a.asset_id),
                    "asset_type": a.asset_type,
                    "brand_model": a.brand_model,
                    "serial_number": a.serial_number,
                    "photo_url": (
                        f"/uploads/asset_photos/{Path(a.photo_url).name}"
                        if a.photo_url
                        else None
                    ),
                    "is_cleared_for_exit": a.is_cleared_for_exit,
                    "cleared_by": a.cleared_by,
                    "cleared_at": a.cleared_at.isoformat() if a.cleared_at else None,
                    "disposition": a.disposition,
                }
                for a in (active_visit.assets or [])
            ]
        } if active_visit else None,
        "visits": visits_data,
        "history": visits_data,
    }


class VisitorPhotoPayload(BaseModel):
    photo_data: str


@router.patch("/{visitor_id}/photo")
async def update_visitor_photo_endpoint(
    visitor_id: int,
    payload: VisitorPhotoPayload,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser | None = Depends(get_optional_current_user),
):
    from app.routers.public_registration import save_visitor_photo
    stmt = select(Visitor).where(Visitor.visitor_id == visitor_id)
    res = await db.execute(stmt)
    visitor = res.scalar_one_or_none()
    if not visitor:
        raise HTTPException(status_code=404, detail="Visitor not found")

    new_path = save_visitor_photo(payload.photo_data)
    visitor.photo_url = new_path
    await db.commit()
    await db.refresh(visitor)
    return {
        "visitor_id": visitor.visitor_id,
        "photo_url": f"/uploads/visitor_photos/{Path(visitor.photo_url).name}" if visitor.photo_url else None,
        "message": "Visitor photograph updated successfully."
    }
