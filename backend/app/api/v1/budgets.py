from uuid import UUID

from fastapi import APIRouter

from app.api.deps import DB, CurrentUser
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from app.services import budget_service

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(db: DB, user: CurrentUser) -> list[dict]:
    return await budget_service.get_budgets(db, user.id)


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(body: BudgetCreate, db: DB, user: CurrentUser) -> dict:
    budget = await budget_service.create_budget(db, user.id, body)
    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "user_name": user.display_name,
        "team_id": budget.team_id,
        "is_team_budget": budget.team_id is not None,
        "category_id": budget.category_id,
        "category_name": "General",
        "category_icon": None,
        "amount_limit": budget.amount_limit,
        "period": budget.period,
        "period_start": budget.period_start,
        "period_end": budget.period_end,
        "spent": 0,
        "created_at": budget.created_at,
    }


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: UUID, body: BudgetUpdate, db: DB, user: CurrentUser) -> dict:
    budget = await budget_service.update_budget(db, user.id, budget_id, body)
    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "user_name": user.display_name,
        "team_id": budget.team_id,
        "is_team_budget": budget.team_id is not None,
        "category_id": budget.category_id,
        "category_name": "General",
        "category_icon": None,
        "amount_limit": budget.amount_limit,
        "period": budget.period,
        "period_start": budget.period_start,
        "period_end": budget.period_end,
        "spent": 0,
        "created_at": budget.created_at,
    }
