
import asyncio
import getpass

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.security_user import SecurityUser
from app.services.auth_service import hash_password


async def main():
    email = input("Administrator email: ").strip().lower()

    if not email or "@" not in email:
        print("Please enter a valid email address.")
        return

    password = getpass.getpass("Administrator password: ")
    confirm_password = getpass.getpass("Confirm password: ")

    if len(password) < 12:
        print("Password must be at least 12 characters.")
        return

    if password != confirm_password:
        print("Passwords do not match.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SecurityUser).where(SecurityUser.email == email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("An account with this email already exists. No changes made.")
            return

        admin = SecurityUser(
            email=email,
            password_hash=hash_password(password),
            role="ADMIN",
            is_active=True,
        )

        db.add(admin)
        await db.commit()

        print("Administrator account created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
