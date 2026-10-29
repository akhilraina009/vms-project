from fastapi import APIRouter, Depends, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.audit_log import AuditLog
from app.models.security_user import SecurityUser
from app.services.auth_dependencies import get_current_user


router = APIRouter(
    prefix="/audit-logs",
    tags=["Audit Logs"],
)


@router.get("/")
async def get_audit_logs(
    limit: int = Query(default=100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: SecurityUser = Depends(get_current_user),
):
    result = await db.execute(
        select(AuditLog)
        .order_by(desc(AuditLog.created_at))
        .limit(limit)
    )

    logs = result.scalars().all()

    return [
        {
            "audit_id": str(log.audit_id),
            "visit_id": str(log.visit_id) if log.visit_id else None,
            "action": log.action,
            "description": log.description,
            "performed_by": log.performed_by,
            "created_at": (
                (log.created_at.isoformat() + "Z")
                if log.created_at and not str(log.created_at.isoformat()).endswith("Z")
                else (log.created_at.isoformat() if log.created_at else None)
            ),
        }
        for log in logs
    ]
