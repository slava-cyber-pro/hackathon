from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.metrics import transactions_created_total
from app.models.transaction import Transaction
from app.schemas.transaction import TransactionCreate, TransactionFilters, TransactionUpdate
from app.services.team_service import get_team_user_ids
from app.utils.exceptions import NotFoundError
from app.utils.pagination import Page, paginate


async def get_transactions(db: AsyncSession, user_id: UUID, filters: TransactionFilters) -> Page:
    team_user_ids = await get_team_user_ids(db, user_id)
    query = select(Transaction).options(selectinload(Transaction.category)).where(
        Transaction.user_id.in_(team_user_ids)
    )

    if filters.user_id is not None:
        query = query.where(Transaction.user_id == filters.user_id)
    if filters.type is not None:
        query = query.where(Transaction.type == filters.type)
    if filters.category_id is not None:
        query = query.where(Transaction.category_id == filters.category_id)
    if filters.search:
        query = query.where(Transaction.description.ilike(f"%{filters.search}%"))
    if filters.date_from is not None:
        query = query.where(Transaction.date >= filters.date_from)
    if filters.date_to is not None:
        query = query.where(Transaction.date <= filters.date_to)

    query = query.order_by(Transaction.date.desc())
    return await paginate(db, query, page=filters.page, size=filters.size)


async def create_transaction(db: AsyncSession, user_id: UUID, data: TransactionCreate) -> Transaction:
    transaction = Transaction(
        user_id=user_id,
        category_id=data.category_id,
        type=data.type,
        amount=data.amount,
        description=data.description,
        date=data.date,
        is_recurring=data.is_recurring,
        recurrence_rule=data.recurrence_rule,
    )
    db.add(transaction)
    await db.flush()
    await db.refresh(transaction, ["category"])
    transactions_created_total.labels(type=data.type.value).inc()
    return transaction


async def update_transaction(
    db: AsyncSession, user_id: UUID, transaction_id: UUID, data: TransactionUpdate
) -> Transaction:
    transaction = await db.get(Transaction, transaction_id)
    if not transaction or transaction.user_id != user_id:
        raise NotFoundError("Transaction")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(transaction, field, value)

    await db.flush()
    await db.refresh(transaction, ["category"])
    return transaction


async def delete_transaction(db: AsyncSession, user_id: UUID, transaction_id: UUID) -> None:
    transaction = await db.get(Transaction, transaction_id)
    if not transaction or transaction.user_id != user_id:
        raise NotFoundError("Transaction")
    await db.delete(transaction)
