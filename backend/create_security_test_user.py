import asyncio
from getpass import getpass

from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.security_user import SecurityUser
from app.services.auth_service import hash_password


async def main():
    email = "vms.security.test01@gmail.com"

    password = getpass("Enter a new test SECURITY password: ")
    confirm = getpass("Confirm the password: ")

    if password != confirm:
        print("Passwords do not match. No account created.")
        return

    if len(password) < 12 or len(password) > 128:
        print("Password must be between 12 and 128 characters.")
        return

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(SecurityUser).where(SecurityUser.email == email)
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print("Test account already exists. No changes made.")
            return

        user = SecurityUser(
            email=email,
            password_hash=hash_password(password),
            role="SECURITY",
            is_active=True,
        )

        db.add(user)
        await db.commit()
        print("Temporary SECURITY test account created successfully.")


if __name__ == "__main__":
    asyncio.run(main())
