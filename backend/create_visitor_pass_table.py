
import asyncio

from sqlalchemy import inspect

from app.db.database import Base, engine
from app.models import VisitorPassToken


async def main():
    table_name = VisitorPassToken.__tablename__

    async with engine.begin() as connection:
        exists = await connection.run_sync(
            lambda sync_connection: inspect(
                sync_connection
            ).has_table(table_name)
        )

        if exists:
            print(f"Table '{table_name}' already exists. No changes made.")
        else:
            await connection.run_sync(
                lambda sync_connection: VisitorPassToken.__table__.create(
                    sync_connection
                )
            )
            print(f"Table '{table_name}' created successfully.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
