import asyncio
import os, sys
sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))
from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def check():
    async with AsyncSessionLocal() as session:
        res = await session.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        """))
        print("Employees columns:")
        for row in res.fetchall():
            print(f"  {row[0]}: {row[1]}")

asyncio.run(check())
