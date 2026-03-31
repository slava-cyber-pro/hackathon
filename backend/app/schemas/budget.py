import datetime as dt
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.budget import BudgetPeriod


class BudgetCreate(BaseModel):
    category_id: Optional[UUID] = None
    team_id: Optional[UUID] = None
    amount_limit: Decimal = Field(gt=0)
    period: BudgetPeriod
    period_start: dt.date
    period_end: Optional[dt.date] = None


class BudgetUpdate(BaseModel):
    amount_limit: Optional[Decimal] = Field(default=None, gt=0)
    period_end: Optional[dt.date] = None


class BudgetResponse(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    user_name: str = ""
    team_id: Optional[UUID]
    is_team_budget: bool = False
    category_id: Optional[UUID]
    category_name: str
    category_icon: Optional[str]
    amount_limit: Decimal
    period: BudgetPeriod
    period_start: dt.date
    period_end: Optional[dt.date]
    spent: Decimal
    created_at: dt.datetime
