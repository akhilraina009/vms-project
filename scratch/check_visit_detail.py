import asyncio
import os
import sys

backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.db.database import AsyncSessionLocal
from app.models.visit import Visit
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Visit)
            .options(selectinload(Visit.visitor), selectinload(Visit.host_employee), selectinload(Visit.assets))
            .where(Visit.visit_id == '8dac2177-ebb4-4d42-a587-4c6e926e0d61')
        )
        v = res.scalar_one_or_none()
        if v:
            print(f"Visit: {v.visit_id}, Status: {v.status}, In: {v.check_in_time}, Out: {v.check_out_time}")
            print(f"Purpose: {v.purpose}")
            if v.visitor:
                print(f"Visitor: {v.visitor.first_name} {v.visitor.last_name}, Company: {v.visitor.company_name}, Phone: {v.visitor.phone_number}, Email: {v.visitor.email}")
                print(f"Address: {v.visitor.address_line1}, {v.visitor.city}, {v.visitor.state}, {v.visitor.postal_code}")
                print(f"Photo: {v.visitor.photo_url}")
            if v.host_employee:
                print(f"Host: {v.host_employee.first_name} {v.host_employee.last_name}, Dept: {v.host_employee.department}")
            for a in v.assets:
                print(f"Asset: {a.asset_id}, Type: {a.asset_type}, Brand/Model: {a.brand_model}, SN: {a.serial_number}, Cleared: {a.is_cleared_for_exit}")

if __name__ == "__main__":
    asyncio.run(check())
