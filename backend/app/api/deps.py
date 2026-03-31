import uuid
from datetime import UTC, datetime
from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.core.security import decode_token
from app.models.user import User
from app.utils.exceptions import AuthenticationError

DB = Annotated[AsyncSession, Depends(get_async_session)]


async def get_current_user(
    db: DB,
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise AuthenticationError("Missing or invalid authorization header")

    token = authorization.removeprefix("Bearer ")

    try:
        payload = decode_token(token)
    except ValueError:
        raise AuthenticationError("Invalid or expired token")

    if payload.get("type") != "access":
        raise AuthenticationError("Invalid token type")

    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationError("Invalid token payload")

    try:
        uid = uuid.UUID(user_id)
    except ValueError:
        raise AuthenticationError("Invalid token payload")

    user = await db.get(User, uid)
    if not user:
        raise AuthenticationError("User not found")

    iat = payload.get("iat")
    if user.token_issued_after and iat is not None:
        issued_at = datetime.fromtimestamp(iat, tz=UTC)
        if issued_at < user.token_issued_after:
            raise AuthenticationError("Token has been revoked")

    return user


CurrentUser = Annotated[User, Depends(get_current_user)]
