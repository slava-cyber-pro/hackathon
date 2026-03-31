from datetime import date
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Query

from app.api.deps import DB, CurrentUser
from app.services import analytics_service
from app.services.team_service import get_team_user_ids

router = APIRouter(prefix="/analytics", tags=["analytics"])


async def _resolve_team_ids(db, user: "CurrentUser", user_id: UUID | None) -> list[UUID] | None:
    """Return team_user_ids list for analytics filtering.

    If a specific user_id is given, verify the caller has access, then return None
    (single-user filter in service).
    Otherwise, return all team member IDs so analytics aggregate across the team.
    """
    if user_id is not None:
        if user_id == user.id:
            return None  # Self — no team filter needed
        # Verify user_id is a teammate
        team_ids = await get_team_user_ids(db, user.id)
        if user_id not in team_ids:
            from app.utils.exceptions import PermissionDeniedError

            raise PermissionDeniedError("Cannot view this user's data")
        return None  # Specific user filter, no team aggregation
    team_ids = await get_team_user_ids(db, user.id)
    # Only pass team list if user is actually in a team (more than just themselves)
    return team_ids if len(team_ids) > 1 else None


@router.get("/spending")
async def spending_by_category(
    db: DB,
    user: CurrentUser,
    date_from: date = Query(...),
    date_to: date = Query(...),
    user_id: Optional[UUID] = Query(default=None),
) -> list[dict]:
    team_user_ids = await _resolve_team_ids(db, user, user_id)
    target_user_id = user_id or user.id
    return await analytics_service.get_spending_by_category(
        db, target_user_id, date_from, date_to, team_user_ids=team_user_ids,
    )


@router.get("/income")
async def income_vs_expenses(
    db: DB,
    user: CurrentUser,
    date_from: date = Query(...),
    date_to: date = Query(...),
    user_id: Optional[UUID] = Query(default=None),
) -> list[dict]:
    team_user_ids = await _resolve_team_ids(db, user, user_id)
    target_user_id = user_id or user.id
    return await analytics_service.get_income_vs_expenses(
        db, target_user_id, date_from, date_to, team_user_ids=team_user_ids,
    )


@router.get("/balance")
async def balance_over_time(
    db: DB,
    user: CurrentUser,
    date_from: date = Query(...),
    date_to: date = Query(...),
    user_id: Optional[UUID] = Query(default=None),
) -> list[dict]:
    team_user_ids = await _resolve_team_ids(db, user, user_id)
    target_user_id = user_id or user.id
    return await analytics_service.get_balance_over_time(
        db, target_user_id, date_from, date_to, team_user_ids=team_user_ids,
    )


@router.get("/investments")
async def investment_summary(
    db: DB,
    user: CurrentUser,
    user_id: Optional[UUID] = Query(default=None),
) -> dict:
    team_user_ids = await _resolve_team_ids(db, user, user_id)
    target_user_id = user_id or user.id
    return await analytics_service.get_investment_summary(
        db, target_user_id, team_user_ids=team_user_ids,
    )
