import os
import uuid
from datetime import date
from decimal import Decimal

import redis.asyncio as aioredis
from sqlalchemy import or_, func, select
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from models import Budget, Category, TeamMember, Transaction, TransactionType, User

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql+asyncpg://postgres:postgres@localhost:5432/budgetsphere")
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, expire_on_commit=False)
redis = aioredis.from_url(REDIS_URL, decode_responses=True)


async def get_user_by_chat_id(chat_id: int) -> User | None:
    async with async_session() as session:
        result = await session.execute(select(User).where(User.telegram_chat_id == chat_id))
        return result.scalar_one_or_none()


async def link_account(token: str, chat_id: int) -> str | None:
    """Link Telegram chat to a BudgetSphere account via Redis token. Returns display_name or None."""
    key = f"tg_link:{token}"
    user_id_str = await redis.get(key)
    if not user_id_str:
        return None
    user_id = uuid.UUID(user_id_str)
    async with async_session() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            return None
        user.telegram_chat_id = chat_id
        session.add(user)
        await session.commit()
    await redis.delete(key)
    return user.display_name


async def match_category(user_id: uuid.UUID, text: str) -> Category:
    """Fuzzy-match a category by name. Falls back to Miscellaneous."""
    async with async_session() as session:
        result = await session.execute(
            select(Category).where(
                (Category.user_id == user_id) | (Category.is_default == True)  # noqa: E712
            )
        )
        categories = result.scalars().all()

    lower = text.lower()
    # 1) case-insensitive startswith
    for cat in categories:
        if cat.name.lower().startswith(lower):
            return cat
    # 2) case-insensitive contains
    for cat in categories:
        if lower in cat.name.lower():
            return cat
    # 3) fallback
    for cat in categories:
        if cat.name.lower() == "miscellaneous":
            return cat
    # absolute fallback: first category
    return categories[0] if categories else None  # type: ignore[return-value]


async def create_transaction(
    user_id: uuid.UUID,
    category_id: uuid.UUID,
    tx_type: str,
    amount: Decimal,
    description: str | None,
    tx_date: date,
) -> Transaction:
    tx = Transaction(
        user_id=user_id,
        category_id=category_id,
        type=TransactionType(tx_type),
        amount=amount,
        description=description,
        date=tx_date,
        is_recurring=False,
    )
    async with async_session() as session:
        session.add(tx)
        await session.commit()
        await session.refresh(tx)
    return tx


async def get_recent_transactions(user_id: uuid.UUID, limit: int = 5) -> list[dict]:
    async with async_session() as session:
        result = await session.execute(
            select(Transaction, Category.name)
            .join(Category, Transaction.category_id == Category.id)
            .where(Transaction.user_id == user_id)
            .order_by(Transaction.date.desc(), Transaction.created_at.desc())
            .limit(limit)
        )
        rows = result.all()
    return [
        {
            "date": tx.date,
            "type": tx.type.value if hasattr(tx.type, "value") else tx.type,
            "amount": tx.amount,
            "category": cat_name,
            "description": tx.description,
        }
        for tx, cat_name in rows
    ]


async def get_budgets_with_spent(user_id: uuid.UUID) -> list[dict]:
    today = date.today()
    async with async_session() as session:
        # Get team IDs the user belongs to
        tm_result = await session.execute(
            select(TeamMember.team_id).where(TeamMember.user_id == user_id)
        )
        my_team_ids = [row[0] for row in tm_result.all()]

        # Get all team member user IDs (for computing team budget spent)
        team_user_ids = [user_id]
        if my_team_ids:
            tu_result = await session.execute(
                select(TeamMember.user_id).where(TeamMember.team_id.in_(my_team_ids))
            )
            team_user_ids = list({row[0] for row in tu_result.all()})

        # Fetch personal budgets for all team members + team budgets
        conditions = [Budget.user_id.in_(team_user_ids)]
        if my_team_ids:
            conditions.append(Budget.team_id.in_(my_team_ids))

        result = await session.execute(
            select(Budget, Category.name, User.display_name)
            .outerjoin(Category, Budget.category_id == Category.id)
            .outerjoin(User, Budget.user_id == User.id)
            .where(
                or_(*conditions),
                Budget.period_start <= today,
                (Budget.period_end >= today) | (Budget.period_end == None),  # noqa: E711
            )
        )
        budgets = result.all()

        out: list[dict] = []
        for budget, cat_name, user_name in budgets:
            is_team = budget.team_id is not None
            # Team budgets: sum spent across all team members; personal: just this user
            spent_users = team_user_ids if is_team else [user_id]

            spent_q = select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.user_id.in_(spent_users),
                Transaction.type == TransactionType.EXPENSE,
                Transaction.date >= budget.period_start,
            )
            if budget.period_end:
                spent_q = spent_q.where(Transaction.date <= budget.period_end)
            if budget.category_id:
                spent_q = spent_q.where(Transaction.category_id == budget.category_id)
            spent_result = await session.execute(spent_q)
            spent = spent_result.scalar() or Decimal("0")

            prefix = "🏠 " if is_team else ""
            owner = f" ({user_name})" if user_name and budget.user_id != user_id else ""
            out.append({
                "category": f"{prefix}{cat_name or 'Overall'}{owner}",
                "period": budget.period,
                "limit": budget.amount_limit,
                "spent": spent,
            })
    return out
