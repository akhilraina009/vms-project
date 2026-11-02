import asyncio
import os, sys
sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))
from app.db.database import AsyncSessionLocal
from sqlalchemy import text

async def seed():
    async with AsyncSessionLocal() as session:
        updates = [
            ("UPDATE employees SET phone_number = '+91 98765 01234', designation = 'Lead Systems Architect & IT Administrator', office_location = 'Building A, 4th Floor - Room 402 (IT Operations)', notes = 'Primary contact for enterprise cloud infrastructure and security gate terminal access.' WHERE employee_id = 1"),
            ("UPDATE employees SET phone_number = '+91 98765 43210', designation = 'Senior IT Technical Support Engineer', office_location = 'Building B, Ground Floor - IT Hardware Staging Lab', notes = 'Handles technical contractor clearances and server blade deployments.' WHERE employee_id = 2"),
            ("UPDATE employees SET phone_number = '+91 98111 22334', designation = 'Head of Human Resources & People Experience', office_location = 'HQ Corporate Wing, 3rd Floor - Suite 305', notes = 'Authorized host for corporate interviews, partner meetings, and executive guests.' WHERE employee_id = 5"),
            ("UPDATE employees SET phone_number = '+91 98222 33445', designation = 'Senior People Operations & Talent Specialist', office_location = 'HQ Corporate Wing, 3rd Floor - HR Bay 12', notes = 'Manages candidate visitor reception and general vendor arrivals.' WHERE employee_id = 6")
        ]
        for sql in updates:
            await session.execute(text(sql))
        await session.commit()
        print("Done seeding employee details!")

        res = await session.execute(text("""
            SELECT employee_id, first_name, last_name, phone_number, designation, department, office_location 
            FROM employees 
            ORDER BY employee_id
        """))
        for row in res.fetchall():
            print(f"EMP-{row[0]}: {row[1]} {row[2]} | {row[3]} | {row[4]} | {row[5]} | {row[6]}")

asyncio.run(seed())
