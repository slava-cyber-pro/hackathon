from fastapi import APIRouter

from app.api.v1.analytics import router as analytics_router
from app.api.v1.auth import router as auth_router
from app.api.v1.budgets import router as budgets_router
from app.api.v1.categories import router as categories_router
from app.api.v1.investments import router as investments_router
from app.api.v1.market import router as market_router
from app.api.v1.teams import router as teams_router
from app.api.v1.telegram import router as telegram_router
from app.api.v1.transactions import router as transactions_router
from app.api.v1.users import router as users_router

router = APIRouter(prefix="/api/v1")
router.include_router(auth_router)
router.include_router(users_router)
router.include_router(categories_router)
router.include_router(transactions_router)
router.include_router(investments_router)
router.include_router(market_router)
router.include_router(budgets_router)
router.include_router(teams_router)
router.include_router(analytics_router)
router.include_router(telegram_router)
