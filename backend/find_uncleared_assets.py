
import asyncio
from sqlalchemy import select

from app.db.database import AsyncSessionLocal
from app.models.asset import Asset


async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Asset).where(
                Asset.is_cleared_for_exit.is_(False)
            )
        )

        assets = result.scalars().all()

        if not assets:
            print("No uncleared assets found.")
            return

        for asset in assets:
            print(f"Asset ID: {asset.asset_id}")
            print(f"Visit ID: {asset.visit_id}")
            print(f"Type: {asset.asset_type}")
            print(f"Serial: {asset.serial_number}")
            print("-" * 40)


if __name__ == "__main__":
    asyncio.run(main())
