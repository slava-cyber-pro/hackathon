import uuid

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.category import Category
from app.utils.exceptions import NotFoundError, PermissionDeniedError

DEFAULT_CATEGORIES: list[tuple[str, str]] = [
    ("Groceries", "\U0001f6d2"),
    ("Rent/Mortgage", "\U0001f3e0"),
    ("Utilities", "\u26a1"),
    ("Transportation", "\U0001f697"),
    ("Dining Out", "\U0001f37d\ufe0f"),
    ("Entertainment", "\U0001f3ac"),
    ("Healthcare", "\U0001f3e5"),
    ("Education", "\U0001f4da"),
    ("Clothing", "\U0001f454"),
    ("Subscriptions", "\U0001f4f1"),
    ("Insurance", "\U0001f6e1\ufe0f"),
    ("Gifts", "\U0001f381"),
    ("Travel", "\u2708\ufe0f"),
    ("Personal Care", "\U0001f487"),
    ("Miscellaneous", "\U0001f4e6"),
]


async def get_categories(db: AsyncSession, user_id: uuid.UUID) -> list[Category]:
    query = select(Category).where(
        or_(Category.is_default.is_(True), Category.user_id == user_id)
    ).order_by(Category.name)
    result = await db.execute(query)
    return list(result.scalars().all())


async def create_category(db: AsyncSession, user_id: uuid.UUID, name: str, icon: str | None) -> Category:
    category = Category(name=name, icon=icon, is_default=False, user_id=user_id)
    db.add(category)
    await db.flush()
    return category


async def delete_category(db: AsyncSession, user_id: uuid.UUID, category_id: uuid.UUID) -> None:
    category = await db.get(Category, category_id)
    if not category:
        raise NotFoundError("Category")
    if category.is_default:
        raise PermissionDeniedError("Cannot delete default categories")
    if category.user_id != user_id:
        raise NotFoundError("Category")
    await db.delete(category)


async def seed_default_categories(db: AsyncSession) -> None:
    result = await db.execute(select(Category).where(Category.is_default.is_(True)).limit(1))
    if result.scalar_one_or_none():
        return
    for name, icon in DEFAULT_CATEGORIES:
        db.add(Category(name=name, icon=icon, is_default=True, user_id=None))
    await db.commit()
