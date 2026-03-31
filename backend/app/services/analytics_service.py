from datetime import date
from decimal import Decimal
from uuid import UUID

from sqlalchemy import case, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from app.models.investment import Investment
from app.models.transaction import Transaction, TransactionType


def _user_filter(column, user_id: UUID, team_user_ids: list[UUID] | None = None):
    """Return an .in_() filter if team_user_ids provided, otherwise == user_id."""
    if team_user_ids:
        return column.in_(team_user_ids)
    return column == user_id


async def get_spending_by_category(
    db: AsyncSession, user_id: UUID, date_from: date, date_to: date,
    team_user_ids: list[UUID] | None = None,
) -> list[dict]:
    query = (
        select(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
        )
        .where(
            _user_filter(Transaction.user_id, user_id, team_user_ids),
            Transaction.type == TransactionType.EXPENSE,
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
        .group_by(Transaction.category_id)
    )
    result = await db.execute(query)
    return [
        {"category_id": str(row.category_id), "total": row.total}
        for row in result.all()
    ]


async def get_income_vs_expenses(
    db: AsyncSession, user_id: UUID, date_from: date, date_to: date,
    team_user_ids: list[UUID] | None = None,
) -> list[dict]:
    month = func.date_trunc("month", Transaction.date).label("month")
    query = (
        select(
            month,
            func.sum(
                case(
                    (Transaction.type == TransactionType.INCOME, Transaction.amount),
                    else_=Decimal("0"),
                )
            ).label("income"),
            func.sum(
                case(
                    (Transaction.type == TransactionType.EXPENSE, Transaction.amount),
                    else_=Decimal("0"),
                )
            ).label("expenses"),
        )
        .where(
            _user_filter(Transaction.user_id, user_id, team_user_ids),
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
        .group_by(month)
        .order_by(month)
    )
    result = await db.execute(query)
    return [
        {
            "month": str(row.month.date()) if row.month else None,
            "income": row.income,
            "expenses": row.expenses,
        }
        for row in result.all()
    ]


async def get_balance_over_time(
    db: AsyncSession, user_id: UUID, date_from: date, date_to: date,
    team_user_ids: list[UUID] | None = None,
) -> list[dict]:
    month = func.date_trunc("month", Transaction.date).label("month")
    net = func.sum(
        case(
            (Transaction.type == TransactionType.INCOME, Transaction.amount),
            else_=-Transaction.amount,
        )
    ).label("net")

    query = (
        select(month, net)
        .where(
            _user_filter(Transaction.user_id, user_id, team_user_ids),
            Transaction.date >= date_from,
            Transaction.date <= date_to,
        )
        .group_by(month)
        .order_by(month)
    )
    result = await db.execute(query)
    rows = result.all()

    cumulative = Decimal("0")
    data: list[dict] = []
    for row in rows:
        cumulative += row.net
        data.append({
            "month": str(row.month.date()) if row.month else None,
            "balance": cumulative,
        })
    return data


async def get_investment_summary(
    db: AsyncSession, user_id: UUID, team_user_ids: list[UUID] | None = None,
) -> dict:
    query = select(
        func.coalesce(func.sum(Investment.amount_invested), Decimal("0")).label("total_invested"),
        func.coalesce(func.sum(Investment.current_value), Decimal("0")).label("total_current_value"),
    ).where(_user_filter(Investment.user_id, user_id, team_user_ids))

    result = (await db.execute(query)).one()
    total_invested = result.total_invested
    total_current_value = result.total_current_value

    if total_invested > 0:
        total_return_pct = ((total_current_value - total_invested) / total_invested * 100).quantize(Decimal("0.01"))
    else:
        total_return_pct = Decimal("0")

    return {
        "total_invested": total_invested,
        "total_current_value": total_current_value,
        "total_return_pct": total_return_pct,
    }
