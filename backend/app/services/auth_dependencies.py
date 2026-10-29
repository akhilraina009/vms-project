import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.security_user import SecurityUser
from app.services.auth_service import decode_access_token


bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> SecurityUser:
    """Return the active user associated with a valid bearer token."""

    unauthorized = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or missing authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise unauthorized

    try:
        payload = decode_access_token(credentials.credentials)
        subject = payload.get("sub")

        if not subject:
            raise unauthorized

        user_id = int(subject)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise unauthorized

    result = await db.execute(
        select(SecurityUser).where(SecurityUser.user_id == user_id)
    )
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise unauthorized

    return user


async def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> SecurityUser | None:
    """Return active user if valid bearer token is provided; otherwise return None without raising 401."""
    if credentials is None:
        return None

    try:
        payload = decode_access_token(credentials.credentials)
        subject = payload.get("sub")
        if not subject:
            return None
        user_id = int(subject)
    except (jwt.InvalidTokenError, ValueError, TypeError):
        return None

    result = await db.execute(
        select(SecurityUser).where(SecurityUser.user_id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        return None

    return user


def require_roles(*allowed_roles: str):
    """Allow access only to users whose current database role is permitted."""
    normalized_roles = {
        role.strip().upper() for role in allowed_roles
    }

    async def role_checker(
        current_user: SecurityUser = Depends(get_current_user),
    ) -> SecurityUser:
        user_role = current_user.role.strip().upper()

        if user_role != "ADMIN" and user_role not in normalized_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to perform this action",
            )

        return current_user

    return role_checker
