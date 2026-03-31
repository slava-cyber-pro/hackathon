from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.models.user import User
from app.schemas.transaction import (
    PaginatedTransactions,
    TransactionCreate,
    TransactionFilters,
    TransactionResponse,
    TransactionUpdate,
)
from app.services import transaction_service

router = APIRouter(prefix="/transactions", tags=["transactions"])


@router.get("", response_model=PaginatedTransactions)
async def list_transactions(
    db: DB,
    user: CurrentUser,
    filters: TransactionFilters = Depends(),
) -> PaginatedTransactions:
    page = await transaction_service.get_transactions(db, user.id, filters)

    # Enrich with user display names
    user_ids = {t.user_id for t in page.items}
    name_map: dict[UUID, str] = {}
    if user_ids:
        users = await db.execute(select(User.id, User.display_name).where(User.id.in_(user_ids)))
        name_map = {uid: name for uid, name in users.all()}

    items = []
    for t in page.items:
        resp = TransactionResponse.model_validate(t)
        resp.user_name = name_map.get(t.user_id, "")
        items.append(resp)

    return PaginatedTransactions(items=items, total=page.total, page=page.page, size=page.size, pages=page.pages)


@router.post("", response_model=TransactionResponse, status_code=201)
async def create_transaction(body: TransactionCreate, db: DB, user: CurrentUser) -> TransactionResponse:
    tx = await transaction_service.create_transaction(db, user.id, body)
    return TransactionResponse.model_validate(tx)


@router.put("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: UUID, body: TransactionUpdate, db: DB, user: CurrentUser,
) -> TransactionResponse:
    return await transaction_service.update_transaction(db, user.id, transaction_id, body)


@router.delete("/{transaction_id}", status_code=204)
async def delete_transaction(transaction_id: UUID, db: DB, user: CurrentUser) -> None:
    await transaction_service.delete_transaction(db, user.id, transaction_id)
