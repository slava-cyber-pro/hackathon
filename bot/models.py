import uuid
from datetime import UTC, datetime

import enum

from sqlalchemy import BigInteger, Boolean, Column, Date, DateTime, Enum, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PgUUID
from sqlalchemy.orm import DeclarativeBase


class TransactionType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"


def generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"
    id = Column(PgUUID(as_uuid=True), primary_key=True, default=generate_uuid)
    email = Column(String(255))
    display_name = Column(String(100))
    telegram_chat_id = Column(BigInteger, unique=True, nullable=True)


class Category(Base):
    __tablename__ = "categories"
    id = Column(PgUUID(as_uuid=True), primary_key=True, default=generate_uuid)
    name = Column(String(100))
    icon = Column(String(50), nullable=True)
    is_default = Column(Boolean, default=False)
    user_id = Column(PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(PgUUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id = Column(PgUUID(as_uuid=True), ForeignKey("users.id"))
    category_id = Column(PgUUID(as_uuid=True), ForeignKey("categories.id"))
    type = Column(Enum(TransactionType, name="transactiontype", create_type=False))
    amount = Column(Numeric(12, 2))
    description = Column(String(500), nullable=True)
    date = Column(Date)
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))


class TeamMember(Base):
    __tablename__ = "team_members"
    id = Column(PgUUID(as_uuid=True), primary_key=True, default=generate_uuid)
    team_id = Column(PgUUID(as_uuid=True), nullable=False)
    user_id = Column(PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(10))


class Budget(Base):
    __tablename__ = "budgets"
    id = Column(PgUUID(as_uuid=True), primary_key=True, default=generate_uuid)
    user_id = Column(PgUUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    team_id = Column(PgUUID(as_uuid=True), nullable=True)
    category_id = Column(PgUUID(as_uuid=True), ForeignKey("categories.id"), nullable=True)
    amount_limit = Column(Numeric(12, 2))
    period = Column(String(20))
    period_start = Column(Date)
    period_end = Column(Date, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))
