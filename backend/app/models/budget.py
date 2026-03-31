import enum
import uuid
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, Enum, ForeignKey, Index, Numeric
from sqlalchemy.orm import Mapped, mapped_column

from app.models.base import Base


class BudgetPeriod(str, enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class Budget(Base):
    __tablename__ = "budgets"
    __table_args__ = (
        Index("ix_budgets_user_period", "user_id", "period"),
        Index("ix_budgets_team_period", "team_id", "period"),
    )

    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    team_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("teams.id"), nullable=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("categories.id"), nullable=True)
    amount_limit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    period: Mapped[BudgetPeriod] = mapped_column(Enum(BudgetPeriod), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date | None] = mapped_column(Date, nullable=True)

    def __repr__(self) -> str:
        return f"<Budget(id={self.id}, limit={self.amount_limit}, period={self.period})>"
