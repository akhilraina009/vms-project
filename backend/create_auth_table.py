
import asyncio

from app.db.database import Base, engine
from app.models.security_user import SecurityUser


async def main():
    async with engine.begin() as connection:
        await connection.run_sync(
            lambda sync_connection: SecurityUser.__table__.create(
                sync_connection,
                checkfirst=True,
            )
        )

    print("security_users table created or already exists.")


if __name__ == "__main__":
    asyncio.run(main())
