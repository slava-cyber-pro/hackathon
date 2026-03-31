from decimal import Decimal
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.sql import func

from app.models.budget import Budget
from app.models.category import Category
from app.models.team import TeamMember, TeamRole
from app.models.transaction import Transaction, TransactionType
from app.models.user import User
from app.schemas.budget import BudgetCreate, BudgetUpdate
from app.services.team_service import get_team_user_ids
from app.utils.exceptions import NotFoundError, PermissionDeniedError


async def _compute_spent(
    db: AsyncSession, user_ids: list[UUID], category_id: UUID | None, period_start, period_end,
) -> Decimal:
    query = (
        select(func.coalesce(func.sum(Transaction.amount), Decimal("0")))
        .where(Transaction.user_id.in_(user_ids), Transaction.type == TransactionType.EXPENSE)
        .where(Transaction.date >= period_start)
    )
    if period_end is not None:
        query = query.where(Transaction.date <= period_end)
    if category_id is not None:
        query = query.where(Transaction.category_id == category_id)
    result = await db.execute(query)
    return result.scalar_one()


async def get_budgets(db: AsyncSession, user_id: UUID) -> list[dict]:
    team_user_ids = await get_team_user_ids(db, user_id)

    # Fetch personal budgets for all team members + team budgets where user is a member
    team_ids_result = await db.execute(
        select(TeamMember.team_id).where(TeamMember.user_id == user_id)
    )
    my_team_ids = [row[0] for row in team_ids_result.all()]

    conditions = [Budget.user_id.in_(team_user_ids)]
    if my_team_ids:
        conditions.append(Budget.team_id.in_(my_team_ids))

    budgets_result = await db.execute(
        select(Budget).where(or_(*conditions)).order_by(Budget.created_at.desc())
    )
    budgets = list(budgets_result.scalars().all())

    # Load categories in one query
    cat_ids = [b.category_id for b in budgets if b.category_id]
    cat_map: dict[UUID, Category] = {}
    if cat_ids:
        cats_result = await db.execute(select(Category).where(Category.id.in_(cat_ids)))
        for cat in cats_result.scalars().all():
            cat_map[cat.id] = cat

    # Load user display names in one query
    budget_user_ids = {b.user_id for b in budgets if b.user_id}
    name_map: dict[UUID, str] = {}
    if budget_user_ids:
        users_result = await db.execute(
            select(User.id, User.display_name).where(User.id.in_(budget_user_ids))
        )
        name_map = {uid: name for uid, name in users_result.all()}

    result = []
    for budget in budgets:
        is_team_budget = budget.team_id is not None
        # For team budgets, compute spent across all team members; for personal, just that user
        if is_team_budget:
            spent_user_ids = team_user_ids
        else:
            spent_user_ids = [budget.user_id] if budget.user_id else [user_id]
        spent = await _compute_spent(
            db, spent_user_ids, budget.category_id, budget.period_start, budget.period_end,
        )
        cat = cat_map.get(budget.category_id) if budget.category_id else None
        result.append({
            "id": budget.id,
            "user_id": budget.user_id,
            "user_name": name_map.get(budget.user_id, "") if budget.user_id else "",
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
        })
    return result


async def create_budget(db: AsyncSession, user_id: UUID, data: BudgetCreate) -> Budget:
    team_id = data.team_id
    if team_id is not None:
        # Verify user is owner or admin of the team
        result = await db.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id, TeamMember.user_id == user_id
            )
        )
        member = result.scalar_one_or_none()
        if not member or member.role != TeamRole.OWNER:
            raise PermissionDeniedError("Only the team owner can set team budget limits")

    budget = Budget(
        user_id=user_id,
        team_id=team_id,
        category_id=data.category_id,
        amount_limit=data.amount_limit,
        period=data.period,
        period_start=data.period_start,
        period_end=data.period_end,
    )
    db.add(budget)
    await db.flush()
    return budget


async def update_budget(db: AsyncSession, user_id: UUID, budget_id: UUID, data: BudgetUpdate) -> Budget:
    budget = await db.get(Budget, budget_id)
    if not budget or budget.user_id != user_id:
        raise NotFoundError("Budget")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)

    await db.flush()
    return budget
