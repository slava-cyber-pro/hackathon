import datetime as dt
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.models.transaction import TransactionType


class CategoryBrief(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    name: str
    icon: Optional[str]


class TransactionCreate(BaseModel):
    category_id: UUID
    type: TransactionType
    amount: Decimal = Field(gt=0)
    description: Optional[str] = None
    date: dt.date
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None


class TransactionUpdate(BaseModel):
    category_id: Optional[UUID] = None
    type: Optional[TransactionType] = None
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    date: Optional[dt.date] = None


class TransactionResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    user_id: UUID
    user_name: str = ""
    team_id: Optional[UUID]
    category_id: UUID
    category: Optional[CategoryBrief] = None
    type: TransactionType
    amount: Decimal
    description: Optional[str]
    date: dt.date
    is_recurring: bool
    created_at: dt.datetime


class TransactionFilters(BaseModel):
    type: Optional[TransactionType] = None
    category_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    search: Optional[str] = None
    date_from: Optional[dt.date] = None
    date_to: Optional[dt.date] = None
    page: int = 1
    size: int = 20


class PaginatedTransactions(BaseModel):
    items: list[TransactionResponse]
    total: int
    page: int
    size: int
    pages: int
