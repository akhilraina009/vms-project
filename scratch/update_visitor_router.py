path = r'z:\vms-project\backend\app\routers\visitor.py'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update imports
target_import = "from fastapi import APIRouter, Depends\n"
repl_import = "from pathlib import Path\nfrom fastapi import APIRouter, Depends, HTTPException\nfrom pydantic import BaseModel\n"

if target_import in text:
    text = text.replace(target_import, repl_import, 1)

# 2. Add endpoints at the bottom
extra_endpoints = """

# ============================================================
# 4. GET SINGLE VISITOR COMPLETE DETAILS & VISITS
# ============================================================

@router.get("/{visitor_id}")
async def get_visitor_details(
    visitor_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(get_current_user),
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

    return {
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
                }
                for a in (active_visit.assets or [])
            ]
        } if active_visit else None,
        "visits": [
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
    }


class VisitorPhotoPayload(BaseModel):
    photo_data: str


@router.patch("/{visitor_id}/photo")
async def update_visitor_photo_endpoint(
    visitor_id: int,
    payload: VisitorPhotoPayload,
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(get_current_user),
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
"""

text += extra_endpoints

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)

print("SUCCESS updated visitor.py with detail & photo patch endpoints")
