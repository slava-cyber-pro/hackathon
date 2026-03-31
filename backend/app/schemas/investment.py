from datetime import datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.investment import InvestmentCategory


class InvestmentCreate(BaseModel):
    category: InvestmentCategory
    name: str
    ticker: Optional[str] = None
    quantity: Decimal = Decimal("0")
    purchase_price: Decimal = Decimal("0")
    amount_invested: Decimal = Field(gt=0)
    current_value: Decimal = Field(gt=0)
    expected_return_pct: Decimal = Decimal("0")
    income_allocation_pct: Decimal = Decimal("0")


class InvestmentUpdate(BaseModel):
    name: Optional[str] = None
    ticker: Optional[str] = None
    quantity: Optional[Decimal] = None
    current_value: Optional[Decimal] = None
    expected_return_pct: Optional[Decimal] = None
    income_allocation_pct: Optional[Decimal] = None


class InvestmentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    user_id: UUID
    user_name: str = ""
    team_id: Optional[UUID]
    category: InvestmentCategory
    name: str
    ticker: Optional[str]
    quantity: Decimal
    purchase_price: Decimal
    amount_invested: Decimal
    current_value: Decimal
    expected_return_pct: Decimal
    income_allocation_pct: Decimal
    created_at: datetime
    updated_at: datetime


class PaginatedInvestments(BaseModel):
    items: list[InvestmentResponse]
    total: int
    page: int
    size: int
    pages: int
