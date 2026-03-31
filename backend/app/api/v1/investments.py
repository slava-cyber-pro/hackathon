from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Query
from sqlalchemy import select

from app.api.deps import DB, CurrentUser
from app.models.user import User
from app.schemas.investment import (
    InvestmentCreate,
    InvestmentResponse,
    InvestmentUpdate,
    PaginatedInvestments,
)
from app.services import investment_service

router = APIRouter(prefix="/investments", tags=["investments"])


@router.get("", response_model=PaginatedInvestments)
async def list_investments(
    db: DB,
    user: CurrentUser,
    page: int = Query(default=1, ge=1),
    size: int = Query(default=20, ge=1, le=100),
    date_from: Optional[date] = Query(default=None),
    date_to: Optional[date] = Query(default=None),
) -> PaginatedInvestments:
    result = await investment_service.get_investments(
        db, user.id, page=page, size=size, date_from=date_from, date_to=date_to,
    )

    # Enrich with user display names
    user_ids = {i.user_id for i in result.items}
    name_map: dict[UUID, str] = {}
    if user_ids:
        users = await db.execute(select(User.id, User.display_name).where(User.id.in_(user_ids)))
        name_map = {uid: name for uid, name in users.all()}

    items = []
    for i in result.items:
        resp = InvestmentResponse.model_validate(i)
        resp.user_name = name_map.get(i.user_id, "")
        items.append(resp)

    return PaginatedInvestments(items=items, total=result.total, page=result.page, size=result.size, pages=result.pages)


@router.post("", response_model=InvestmentResponse, status_code=201)
async def create_investment(body: InvestmentCreate, db: DB, user: CurrentUser) -> InvestmentResponse:
    return await investment_service.create_investment(db, user.id, body)


@router.put("/{investment_id}", response_model=InvestmentResponse)
async def update_investment(
    investment_id: UUID, body: InvestmentUpdate, db: DB, user: CurrentUser,
) -> InvestmentResponse:
    return await investment_service.update_investment(db, user.id, investment_id, body)


@router.delete("/{investment_id}", status_code=204)
async def delete_investment(investment_id: UUID, db: DB, user: CurrentUser) -> None:
    await investment_service.delete_investment(db, user.id, investment_id)
