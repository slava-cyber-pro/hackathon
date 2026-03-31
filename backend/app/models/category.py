import uuid

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Category(Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    icon: Mapped[str | None] = mapped_column(String(50), nullable=True)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    user: Mapped["User | None"] = relationship(back_populates="categories")  # noqa: F821
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="category")  # noqa: F821

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name={self.name})>"
