
import asyncio
import getpass

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.security_user import SecurityUser
from app.services.auth_service import hash_password


async def main():
    email = "vms.employee.test01@gmail.com"
    password = getpass.getpass("Enter new test password (hidden): ")

    if len(password) < 12:
        print("Password must be at least 12 characters.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SecurityUser).where(SecurityUser.email == email)
        )
        user = result.scalar_one_or_none()

        if user is None:
            print("Test account not found. No changes made.")
            return

        user.password_hash = hash_password(password)
        user.role = "EMPLOYEE"
        user.is_active = True
        await db.commit()

        print("Test account password reset. Role: EMPLOYEE.")


if __name__ == "__main__":
    asyncio.run(main())
