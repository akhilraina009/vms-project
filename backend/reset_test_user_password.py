
import asyncio
import getpass

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.security_user import SecurityUser
from app.services.auth_service import hash_password


EMAIL = "vms.employee.test01@gmail.com"


async def main():
    password = getpass.getpass("New employee password (minimum 12 characters): ")

    if len(password) < 12:
        print("Password must be at least 12 characters. No changes made.")
        return

    confirm = getpass.getpass("Confirm new password: ")

    if password != confirm:
        print("Passwords do not match. No changes made.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SecurityUser).where(SecurityUser.email == EMAIL)
        )
        user = result.scalar_one_or_none()

        if user is None:
            print("Employee account not found. No changes made.")
            return

        user.password_hash = hash_password(password)
        await db.commit()

        print("Employee password reset successfully.")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")
        print(f"Active: {user.is_active}")


if __name__ == "__main__":
    asyncio.run(main())
