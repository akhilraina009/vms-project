from pathlib import Path

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.db.database import engine
from app.models.security_user import SecurityUser
from app.routers.asset import router as asset_router
from app.routers.audit_log import router as audit_log_router
from app.routers.auth import router as auth_router
from app.routers.employee import router as employee_router
from app.routers.pre_approval import router as pre_approval_router
from app.routers.public_registration import router as public_registration_router
from app.routers.visit import router as visit_router
from app.routers.visitor import router as visitor_router
from app.services.auth_dependencies import get_current_user
from app.services.redis_client import redis_client


app = FastAPI(
    title="Visitor Management System API",
    description="Backend API for Visitor Management System",
    version="1.0.0",
)


# =========================
# PUBLIC VISITOR PHOTOS
# =========================

BACKEND_DIR = Path(__file__).resolve().parent.parent
PHOTO_DIR = (BACKEND_DIR / "uploads" / "visitor_photos").resolve()
PHOTO_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads/visitor_photos",
    StaticFiles(directory=str(PHOTO_DIR)),
    name="visitor-photos",
)

ASSET_PHOTO_DIR = (BACKEND_DIR / "uploads" / "asset_photos").resolve()
ASSET_PHOTO_DIR.mkdir(parents=True, exist_ok=True)

app.mount(
    "/uploads/asset_photos",
    StaticFiles(directory=str(ASSET_PHOTO_DIR)),
    name="asset-photos",
)

VMS_PROFILE_DIR = (BACKEND_DIR.parent / "frontend" / "public" / "profile" / "vms-os").resolve()
VMS_PROFILE_DIR.mkdir(parents=True, exist_ok=True)
app.mount(
    "/profile/vms-os",
    StaticFiles(directory=str(VMS_PROFILE_DIR), html=True),
    name="vms-os-profile",
)


# =========================
# CORS CONFIGURATION
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.20.182:5173",
        "https://localhost:5173",
        "https://127.0.0.1:5173",
        "https://192.168.20.182:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://192.168.20.182:5174",
        "https://localhost:5174",
        "https://127.0.0.1:5174",
        "https://192.168.20.182:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
        "http://192.168.20.182:5175",
        "https://localhost:5175",
        "https://127.0.0.1:5175",
        "https://192.168.20.182:5175",
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
app.include_router(public_registration_router)


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
async def database_test(current_user: SecurityUser = Depends(get_current_user)):
    async with engine.connect() as connection:
        result = await connection.execute(text("SELECT 1"))
        return {
            "database": result.scalar()
        }


@app.get("/redis-test")
async def redis_test(current_user: SecurityUser = Depends(get_current_user)):
    await redis_client.set("vms_test", "Redis is working")
    value = await redis_client.get("vms_test")
    return {
        "redis": value
    }