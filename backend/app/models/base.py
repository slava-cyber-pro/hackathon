import uuid
from datetime import UTC, datetime

from sqlalchemy import DateTime
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def generate_uuid() -> uuid.UUID:
    return uuid.uuid4()


class Base(DeclarativeBase):
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=generate_uuid)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    def __repr__(self) -> str:
        return f"<{self.__class__.__name__}(id={self.id})>"
