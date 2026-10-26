import asyncio
from sqlalchemy import select
from app.db.database import AsyncSessionLocal
from app.models.visitor_pass_token import VisitorPassToken

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(VisitorPassToken).where(
                VisitorPassToken.visit_id == "30f80dbd-8d10-4a89-9df9-9dfd80657318"
            )
        )
        token = result.scalar_one_or_none()
        if token:
            print("Token record: FOUND")
            print("Visit ID:", token.visit_id)
            print("Token hash stored:", bool(token.token_hash))
            print("Expires at:", token.expires_at)
            print("Revoked:", token.revoked)
        else:
            print("Token record: NOT FOUND")

asyncio.run(main())
