
from app.db.database import Base, engine

from app.models.employee import Employee
from app.models.visitor import Visitor
from app.models.visit import Visit
from app.models.asset import Asset
from app.models.pre_approval import PreApproval
from app.models.audit_log import AuditLog


async def init_db():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
