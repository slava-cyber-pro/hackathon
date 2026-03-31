import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.schemas.user import UserUpdate
from app.utils.exceptions import ConflictError, NotFoundError


async def get_user(db: AsyncSession, user_id: uuid.UUID) -> User:
    user = await db.get(User, user_id)
    if not user:
        raise NotFoundError("User")
    return user


async def update_user(db: AsyncSession, user: User, data: UserUpdate) -> User:
    if data.email is not None and data.email != user.email:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            raise ConflictError("A user with this email already exists")
        user.email = data.email

    if data.display_name is not None:
        user.display_name = data.display_name

    db.add(user)
    await db.flush()
    return user
