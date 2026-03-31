import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.core.metrics import logins_total, users_registered_total
from app.models.user import User
from app.utils.exceptions import AuthenticationError, ConflictError


async def register(db: AsyncSession, email: str, password: str, display_name: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    if result.scalar_one_or_none():
        raise ConflictError("A user with this email already exists")

    user = User(
        email=email,
        hashed_password=hash_password(password),
        display_name=display_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    users_registered_total.inc()
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> User:
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(password, user.hashed_password):
        logins_total.labels(status="failure").inc()
        raise AuthenticationError("Invalid email or password")

    logins_total.labels(status="success").inc()
    return user


async def refresh_tokens(db: AsyncSession, refresh_token: str) -> tuple[str, str]:
    try:
        payload = decode_token(refresh_token)
    except ValueError as e:
        raise AuthenticationError(str(e)) from e

    if payload.get("type") != "refresh":
        raise AuthenticationError("Invalid token type")

    sub = payload.get("sub")
    if not sub:
        raise AuthenticationError("Invalid token payload")

    try:
        user_id = uuid.UUID(sub)
    except ValueError:
        raise AuthenticationError("Invalid token payload")

    user = await db.get(User, user_id)
    if not user:
        raise AuthenticationError("User not found")

    iat = payload.get("iat")
    if user.token_issued_after and iat is not None:
        issued_at = datetime.fromtimestamp(iat, tz=UTC)
        if issued_at < user.token_issued_after:
            raise AuthenticationError("Token has been revoked")

    return create_access_token(str(user.id)), create_refresh_token(str(user.id))
