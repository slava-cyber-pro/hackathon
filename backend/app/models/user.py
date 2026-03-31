from datetime import datetime

from sqlalchemy import BigInteger, DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    token_issued_after: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    telegram_chat_id: Mapped[int | None] = mapped_column(BigInteger, unique=True, nullable=True)

    categories: Mapped[list["Category"]] = relationship(back_populates="user")  # noqa: F821
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")  # noqa: F821
    investments: Mapped[list["Investment"]] = relationship(back_populates="user")  # noqa: F821
    team_memberships: Mapped[list["TeamMember"]] = relationship(back_populates="user")  # noqa: F821

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
