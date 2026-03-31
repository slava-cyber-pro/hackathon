from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.api.v1 import router as v1_router
from app.api.v1.auth import limiter
from app.core.config import settings
from app.core.database import async_session_factory
from app.core.redis import redis_client
from app.services.category_service import seed_default_categories
from app.utils.exceptions import register_exception_handlers

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(_app: FastAPI) -> AsyncGenerator[None, None]:
    logger.info("Starting BudgetSphere API", env=settings.app_env)
    async with async_session_factory() as session:
        await seed_default_categories(session)
    logger.info("Default categories seeded")
    yield
    await redis_client.close()
    logger.info("Shutting down BudgetSphere API")


def create_app() -> FastAPI:
    application = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.backend_cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type"],
    )

    application.state.limiter = limiter
    application.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    register_exception_handlers(application)
    application.include_router(v1_router)

    Instrumentator(
        should_group_status_codes=False,
        excluded_handlers=["/health", "/metrics"],
    ).instrument(application).expose(application, endpoint="/metrics", include_in_schema=False)

    @application.get("/health", tags=["system"])
    async def health_check() -> dict:
        return {"status": "healthy", "service": settings.app_name}

    return application


app = create_app()
