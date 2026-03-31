"""Market data API routes — search assets, get quotes, price history."""

from fastapi import APIRouter, HTTPException, Query, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import DB, CurrentUser
from app.services import market_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/market", tags=["market"])


@router.get("/search")
@limiter.limit("10/minute")
async def search_assets(
    request: Request,
    user: CurrentUser,
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    category: str | None = Query(default=None, description="Filter by category: stocks, etfs, crypto, bonds"),
):
    """Search for investable assets across stocks, ETFs, and crypto."""
    results = await market_service.search_assets(q, category)
    return {"results": results}


@router.get("/quote/{ticker}")
async def get_quote(
    ticker: str,
    user: CurrentUser,
    category: str = Query(default="stocks", description="Asset category: stocks, etfs, crypto, bonds"),
):
    """Get the current price quote for a ticker."""
    quote = await market_service.get_quote(ticker, category)
    return quote


@router.get("/history/{ticker}")
async def get_price_history(
    ticker: str,
    user: CurrentUser,
    category: str = Query(default="stocks", description="Asset category: stocks, etfs, crypto, bonds"),
    period: str = Query(default="3mo", description="History period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, max"),
):
    """Get OHLCV price history for a ticker."""
    history = await market_service.get_price_history(ticker, category, period)
    return {"ticker": ticker, "category": category, "period": period, "data": history}


@router.get("/browse/{category}")
async def browse_market(
    category: str,
    user: CurrentUser,
):
    """Return a list of popular assets for browsing in the given category."""
    valid_categories = ("crypto", "stocks", "etfs", "commodities", "indices", "forex", "bonds")
    if category not in valid_categories:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid category '{category}'. Must be one of: {', '.join(valid_categories)}",
        )
    assets = await market_service.get_market_list(category)
    return {"category": category, "assets": assets}


@router.get("/detail/{ticker}")
async def get_asset_detail(
    ticker: str,
    user: CurrentUser,
    category: str = Query(default="stocks", description="Asset category: stocks, etfs, crypto, commodities, indices, forex, bonds"),
):
    """Get detailed info about a single asset."""
    detail = await market_service.get_asset_detail(ticker, category)
    return detail


@router.post("/refresh-prices")
async def refresh_prices(
    db: DB,
    user: CurrentUser,
):
    """Batch-update current prices for all investments that have a ticker."""
    count = await market_service.update_investment_prices(db)
    return {"updated": count}
