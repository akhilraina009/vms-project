import asyncio
import os, sys
sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))
from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def migrate():
    async with AsyncSessionLocal() as session:
        print("Adding columns to employees table if not exists...")
        await session.execute(text("""
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS phone_number VARCHAR(50),
            ADD COLUMN IF NOT EXISTS designation VARCHAR(150),
            ADD COLUMN IF NOT EXISTS office_location VARCHAR(150),
            ADD COLUMN IF NOT EXISTS notes VARCHAR(500),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        """))
        await session.commit()
        print("Migration committed!")

        # Verify
        res = await session.execute(text("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'employees'
            ORDER BY ordinal_position
        """))
        print("\nUpdated Employees columns:")
        for row in res.fetchall():
            print(f"  {row[0]}: {row[1]}")

asyncio.run(migrate())
