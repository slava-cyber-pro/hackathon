from dataclasses import dataclass

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

MAX_PAGE_SIZE = 100


@dataclass
class Page[T]:
    items: list[T]
    total: int
    page: int
    size: int

    @property
    def pages(self) -> int:
        return (self.total + self.size - 1) // self.size if self.size > 0 else 0


async def paginate(session: AsyncSession, query: Select, page: int = 1, size: int = 20) -> Page:
    page = max(1, page)
    size = max(1, min(size, MAX_PAGE_SIZE))

    count_query = select(func.count()).select_from(query.subquery())
    total = (await session.execute(count_query)).scalar_one()

    offset = (page - 1) * size
    result = await session.execute(query.offset(offset).limit(size))
    items = list(result.scalars().all())

    return Page(items=items, total=total, page=page, size=size)
