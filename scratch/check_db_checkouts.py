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
from app.models.visitor import Visitor
from sqlalchemy import select
from sqlalchemy.orm import selectinload

async def check():
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Visit)
            .options(selectinload(Visit.visitor), selectinload(Visit.assets))
            .where(Visit.status == 'CHECKED_OUT')
        )
        visits = res.scalars().all()
        print('Total checked out visits in DB:', len(visits))
        
        it_visits = [v for v in visits if v.purpose and '[IT_VISIT]' in v.purpose]
        print('IT checked out visits in DB:', len(it_visits))
        for v in it_visits:
            visitor_name = f"{v.visitor.first_name} {v.visitor.last_name}" if v.visitor else "Unknown"
            print(f"  Visit #{v.visit_id}: {visitor_name} - {v.purpose} (Assets: {len(v.assets)}) - Out: {v.check_out_time}")
            
        gen_visits = [v for v in visits if not (v.purpose and '[IT_VISIT]' in v.purpose)]
        print('General checked out visits in DB:', len(gen_visits))
        for v in gen_visits[:5]:
            visitor_name = f"{v.visitor.first_name} {v.visitor.last_name}" if v.visitor else "Unknown"
            print(f"  Visit #{v.visit_id}: {visitor_name} - {v.purpose} - Out: {v.check_out_time}")

if __name__ == "__main__":
    asyncio.run(check())
