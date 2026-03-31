from datetime import date
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.core.metrics import investments_created_total
from app.models.investment import Investment
from app.schemas.investment import InvestmentCreate, InvestmentUpdate
from app.services.team_service import get_team_user_ids
from app.utils.exceptions import NotFoundError
from app.utils.pagination import Page, paginate


async def get_investments(
    db: AsyncSession,
    user_id: UUID,
    page: int = 1,
    size: int = 20,
    date_from: date | None = None,
    date_to: date | None = None,
) -> Page:
    team_user_ids = await get_team_user_ids(db, user_id)
    query = select(Investment).where(Investment.user_id.in_(team_user_ids))
    if date_from is not None:
        query = query.where(func.date(Investment.created_at) >= date_from)
    if date_to is not None:
        query = query.where(func.date(Investment.created_at) <= date_to)
    query = query.order_by(Investment.created_at.desc())
    return await paginate(db, query, page=page, size=size)


async def create_investment(db: AsyncSession, user_id: UUID, data: InvestmentCreate) -> Investment:
    investment = Investment(
        user_id=user_id,
        category=data.category,
        name=data.name,
        amount_invested=data.amount_invested,
        current_value=data.current_value,
        expected_return_pct=data.expected_return_pct,
        income_allocation_pct=data.income_allocation_pct,
    )
    db.add(investment)
    await db.flush()
    investments_created_total.labels(category=data.category.value).inc()
    return investment


async def update_investment(
    db: AsyncSession, user_id: UUID, investment_id: UUID, data: InvestmentUpdate
) -> Investment:
    investment = await db.get(Investment, investment_id)
    if not investment or investment.user_id != user_id:
        raise NotFoundError("Investment")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(investment, field, value)

    await db.flush()
    return investment


async def delete_investment(db: AsyncSession, user_id: UUID, investment_id: UUID) -> None:
    investment = await db.get(Investment, investment_id)
    if not investment or investment.user_id != user_id:
        raise NotFoundError("Investment")
    await db.delete(investment)
