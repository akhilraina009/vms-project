import asyncio
from sqlalchemy import select, desc

from app.db.database import AsyncSessionLocal
from app.models.audit_log import AuditLog


async def check_audit_logs():
    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(AuditLog).order_by(desc(AuditLog.created_at))
        )

        logs = result.scalars().all()

        if not logs:
            print("No audit log records found.")
            return

        for log in logs:
            print("-" * 60)
            print(f"Audit ID: {log.audit_id}")
            print(f"Visit ID: {log.visit_id}")
            print(f"Action: {log.action}")
            print(f"Description: {log.description}")
            print(f"Performed by: {log.performed_by}")
            print(f"Created at: {log.created_at}")

        print("-" * 60)
        print(f"Total audit log records: {len(logs)}")


if __name__ == "__main__":
    asyncio.run(check_audit_logs())
