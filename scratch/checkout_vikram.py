import asyncio
import os
import sys
from datetime import datetime, timedelta

backend_dir = r"Z:\vms-project\backend"
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from dotenv import load_dotenv
load_dotenv(os.path.join(backend_dir, ".env"))

from app.db.database import AsyncSessionLocal
from app.models.visit import Visit
from app.models.asset import Asset
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def checkout_vikram():
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Visit)
            .options(selectinload(Visit.assets), selectinload(Visit.visitor))
            .where(Visit.visit_id == 'a86db253-5dca-495e-90e3-76699a30c2f9')
        )
        visit = res.scalar_one_or_none()
        if visit:
            now = datetime.utcnow()
            visit.status = "CHECKED_OUT"
            visit.check_out_time = now
            for asset in visit.assets:
                asset.is_cleared_for_exit = True
                asset.cleared_by = "Security Officer (Main Gate)"
                asset.cleared_at = now - timedelta(minutes=5)
            await db.commit()
            print("Successfully checked out Vikram Nair visit #a86db253-5dca-495e-90e3-76699a30c2f9")
        else:
            print("Visit not found")

if __name__ == "__main__":
    asyncio.run(checkout_vikram())
