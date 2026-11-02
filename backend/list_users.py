import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.security_user import SecurityUser

async def main():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(SecurityUser))
        users = res.scalars().all()
        for u in users:
            print(f"ID: {u.id} | Email: {u.email} | Role: {u.role} | Active: {u.is_active}")

if __name__ == "__main__":
    asyncio.run(main())
