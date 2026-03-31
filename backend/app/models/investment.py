import enum
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class InvestmentCategory(str, enum.Enum):
    STOCKS = "stocks"
    BONDS = "bonds"
    CRYPTO = "crypto"
    REAL_ESTATE = "real_estate"
    MUTUAL_FUNDS = "mutual_funds"
    ETFS = "etfs"
    CUSTOM = "custom"


class Investment(Base):
    __tablename__ = "investments"
    __table_args__ = (Index("ix_investments_user", "user_id"),)

    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    team_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("teams.id"), nullable=True)
    category: Mapped[InvestmentCategory] = mapped_column(Enum(InvestmentCategory), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    ticker: Mapped[str | None] = mapped_column(String(20), nullable=True, index=True)
    quantity: Mapped[Decimal] = mapped_column(Numeric(14, 6), nullable=False, default=Decimal("0"))
    purchase_price: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False, default=Decimal("0"))
    amount_invested: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    current_value: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    expected_return_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0"))
    income_allocation_pct: Mapped[Decimal] = mapped_column(Numeric(5, 2), nullable=False, default=Decimal("0"))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(UTC), onupdate=lambda: datetime.now(UTC)
    )

    user: Mapped["User"] = relationship(back_populates="investments")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Investment(id={self.id}, name={self.name}, category={self.category})>"
