from uuid import UUID

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import DB, CurrentUser
from app.models.budget import Budget
from app.models.category import Category
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from app.services import budget_service
from app.services.team_service import get_team_user_ids

router = APIRouter(prefix="/budgets", tags=["budgets"])


async def _build_budget_response(
    db: AsyncSession, budget: Budget, user_name: str,
) -> dict:
    """Build a full BudgetResponse dict with real category data and spent amount."""
    cat: Category | None = None
    if budget.category_id:
        result = await db.execute(select(Category).where(Category.id == budget.category_id))
        cat = result.scalar_one_or_none()

    is_team_budget = budget.team_id is not None
    if is_team_budget:
        spent_user_ids = await get_team_user_ids(db, budget.user_id)
    else:
        spent_user_ids = [budget.user_id]

    spent = await budget_service.compute_spent(
        db, spent_user_ids, budget.category_id, budget.period_start, budget.period_end,
    )

    return {
        "id": budget.id,
        "user_id": budget.user_id,
        "user_name": user_name,
        "team_id": budget.team_id,
        "is_team_budget": is_team_budget,
        "category_id": budget.category_id,
        "category_name": cat.name if cat else "General",
        "category_icon": cat.icon if cat else None,
        "amount_limit": budget.amount_limit,
        "period": budget.period,
        "period_start": budget.period_start,
        "period_end": budget.period_end,
        "spent": spent,
        "created_at": budget.created_at,
    }


@router.get("", response_model=list[BudgetResponse])
async def list_budgets(db: DB, user: CurrentUser) -> list[dict]:
    return await budget_service.get_budgets(db, user.id)


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_budget(body: BudgetCreate, db: DB, user: CurrentUser) -> dict:
    budget = await budget_service.create_budget(db, user.id, body)
    return await _build_budget_response(db, budget, user.display_name)


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: UUID, body: BudgetUpdate, db: DB, user: CurrentUser) -> dict:
    budget = await budget_service.update_budget(db, user.id, budget_id, body)
    return await _build_budget_response(db, budget, user.display_name)
