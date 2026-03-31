from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.api.v1.auth import limiter
from app.core.database import get_async_session
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models.base import Base
from app.models.user import User
from app.services.category_service import seed_default_categories

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
test_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with test_session_factory() as session:
        await seed_default_categories(session)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    limiter.reset()


@pytest.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with test_session_factory() as session:
        yield session


@pytest.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    async def override_get_session() -> AsyncGenerator[AsyncSession, None]:
        yield db_session

    app.dependency_overrides[get_async_session] = override_get_session

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest.fixture
async def sample_user(db_session: AsyncSession) -> User:
    user = User(
        email="test@example.com",
        hashed_password=hash_password("password123"),
        display_name="Test User",
    )
    db_session.add(user)
    await db_session.commit()
    await db_session.refresh(user)
    return user


@pytest.fixture
async def auth_headers(sample_user: User) -> dict[str, str]:
    token = create_access_token(str(sample_user.id))
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def authenticated_client(
    client: AsyncClient, auth_headers: dict[str, str]
) -> AsyncClient:
    client.headers.update(auth_headers)
    return client
