from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.db.database import engine
from app.services.redis_client import redis_client
from app.models.security_user import SecurityUser
from app.routers.employee import router as employee_router
from app.routers.visitor import router as visitor_router
from app.routers.visit import router as visit_router
from app.routers.asset import router as asset_router
from app.routers.pre_approval import router as pre_approval_router
from app.routers.audit_log import router as audit_log_router
from app.routers.auth import router as auth_router


app = FastAPI(
    title="Visitor Management System API",
    description="Backend API for Visitor Management System",
    version="1.0.0",
)


# =========================
# CORS CONFIGURATION
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROUTERS
# =========================

app.include_router(employee_router)
app.include_router(visitor_router)
app.include_router(visit_router)
app.include_router(asset_router)
app.include_router(pre_approval_router)
app.include_router(audit_log_router)
app.include_router(auth_router)


# =========================
# BASIC ENDPOINTS
# =========================

@app.get("/")
async def root():
    return {
        "message": "VMS Backend is running"
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy"
    }


@app.get("/database-test")
async def database_test():
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))
        return {
            "database": result.scalar()
        }


@app.get("/redis-test")
async def redis_test():
    await redis_client.set("vms_test", "Redis is working")
    value = await redis_client.get("vms_test")
    return {
        "redis": value
    }