
import asyncio
import getpass

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.security_user import SecurityUser
from app.services.auth_service import hash_password


async def main():
    email = input("Test user email: ").strip().lower()
    password = getpass.getpass("Test user password: ")

    if not email or len(password) < 12:
        print("Email is required and password must be at least 12 characters.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SecurityUser).where(SecurityUser.email == email)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print("That email already exists. No changes made.")
            return

        user = SecurityUser(
            email=email,
            password_hash=hash_password(password),
            role="EMPLOYEE",
            is_active=True,
        )
        db.add(user)
        await db.commit()

        print("EMPLOYEE test account created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
