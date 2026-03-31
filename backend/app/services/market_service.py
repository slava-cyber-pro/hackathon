"""Market data service — fetches live prices for stocks, ETFs, crypto, and bonds.

Uses yfinance (sync, wrapped in asyncio.to_thread) for stocks/ETFs/bonds and
the free CoinGecko REST API for crypto.  Results are cached in Redis.
"""

from __future__ import annotations

import asyncio
import json
import logging
from datetime import UTC, datetime
from decimal import Decimal

import httpx
import yfinance as yf
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.redis import redis_client
from app.models.investment import Investment

logger = logging.getLogger(__name__)

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# ---------------------------------------------------------------------------
# Redis caching helper
# ---------------------------------------------------------------------------

async def _cached(key: str, ttl: int, fetcher):
    """Return cached value or call *fetcher*, cache and return the result."""
    try:
        cached = await redis_client.get(key)
        if cached:
            return json.loads(cached)
    except Exception:
        logger.warning("Redis read failed for key %s", key)

    data = await fetcher()

    try:
        await redis_client.setex(key, ttl, json.dumps(data, default=str))
    except Exception:
        logger.warning("Redis write failed for key %s", key)

    return data


# ---------------------------------------------------------------------------
# Internal helpers — yfinance (sync, run in thread)
# ---------------------------------------------------------------------------

def _yf_validate_ticker(symbol: str) -> dict | None:
    """Return basic info dict if *symbol* resolves to a real yfinance ticker."""
    try:
        ticker = yf.Ticker(symbol)
        info = ticker.info
        if info and info.get("regularMarketPrice") is not None:
            return info
        # Some tickers only have shortName but no live price yet are valid
        if info and info.get("shortName"):
            return info
    except Exception:
        pass
    return None


def _yf_search(query: str) -> list[dict]:
    """Try the raw query and a few common suffixes to find matching tickers."""
    results: list[dict] = []
    seen: set[str] = set()
    candidates = [query.upper()]
    # Common exchange suffixes people may omit
    for suffix in ("", ".L", ".TO", ".AX", ".NS"):
        candidate = query.upper() + suffix
        if candidate not in candidates:
            candidates.append(candidate)

    for symbol in candidates:
        info = _yf_validate_ticker(symbol)
        if info and symbol not in seen:
            seen.add(symbol)
            quote_type = (info.get("quoteType") or "").lower()
            category = "etfs" if quote_type == "etf" else "stocks"
            results.append(
                {
                    "symbol": info.get("symbol", symbol),
                    "name": info.get("shortName") or info.get("longName") or symbol,
                    "category": category,
                    "exchange": info.get("exchange", ""),
                }
            )
    return results


def _yf_quote(ticker: str) -> dict:
    """Get a quick quote via yfinance fast_info."""
    t = yf.Ticker(ticker)
    fi = t.fast_info
    info = t.info
    price = fi.get("lastPrice") if hasattr(fi, "get") else getattr(fi, "last_price", None)
    prev_close = fi.get("previousClose") if hasattr(fi, "get") else getattr(fi, "previous_close", None)
    change_pct = None
    if price is not None and prev_close:
        change_pct = round((price - prev_close) / prev_close * 100, 2)
    return {
        "price": price,
        "change_24h_pct": change_pct,
        "currency": (info.get("currency") or "USD"),
        "name": info.get("shortName") or info.get("longName") or ticker,
    }


def _yf_history(ticker: str, period: str) -> list[dict]:
    """Fetch OHLCV history from yfinance."""
    t = yf.Ticker(ticker)
    df = t.history(period=period)
    rows: list[dict] = []
    for dt, row in df.iterrows():
        rows.append(
            {
                "date": str(dt.date()) if hasattr(dt, "date") else str(dt),
                "open": round(float(row.get("Open", 0)), 4),
                "high": round(float(row.get("High", 0)), 4),
                "low": round(float(row.get("Low", 0)), 4),
                "close": round(float(row.get("Close", 0)), 4),
                "volume": int(row.get("Volume", 0)),
            }
        )
    return rows


# ---------------------------------------------------------------------------
# Internal helpers — CoinGecko (async via httpx)
# ---------------------------------------------------------------------------

async def _cg_search(query: str) -> list[dict]:
    """Search CoinGecko for crypto coins matching *query*."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{COINGECKO_BASE}/search", params={"query": query})
            resp.raise_for_status()
            data = resp.json()
        results: list[dict] = []
        for coin in (data.get("coins") or [])[:10]:
            results.append(
                {
                    "symbol": coin.get("id", ""),
                    "name": coin.get("name", ""),
                    "category": "crypto",
                    "exchange": "CoinGecko",
                }
            )
        return results
    except Exception:
        logger.exception("CoinGecko search failed for query=%s", query)
        return []


async def _cg_quote(coin_id: str) -> dict:
    """Get a simple price quote from CoinGecko."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/simple/price",
                params={"ids": coin_id, "vs_currencies": "usd", "include_24hr_change": "true"},
            )
            resp.raise_for_status()
            data = resp.json()
        coin_data = data.get(coin_id, {})
        return {
            "price": coin_data.get("usd"),
            "change_24h_pct": round(coin_data.get("usd_24h_change", 0), 2) if coin_data.get("usd_24h_change") else None,
            "currency": "USD",
            "name": coin_id,
        }
    except Exception:
        logger.exception("CoinGecko quote failed for coin_id=%s", coin_id)
        return {"price": None, "change_24h_pct": None, "currency": "USD", "name": coin_id}


async def _cg_history(coin_id: str, days: int = 90) -> list[dict]:
    """Get market chart history from CoinGecko."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/coins/{coin_id}/market_chart",
                params={"vs_currency": "usd", "days": days},
            )
            resp.raise_for_status()
            data = resp.json()
        prices = data.get("prices", [])
        volumes = data.get("total_volumes", [])
        volume_map = {int(v[0]): v[1] for v in volumes}
        rows: list[dict] = []
        for ts, price in prices:
            dt = datetime.fromtimestamp(ts / 1000, tz=UTC).strftime("%Y-%m-%d")
            rows.append(
                {
                    "date": dt,
                    "open": round(price, 4),
                    "high": round(price, 4),
                    "low": round(price, 4),
                    "close": round(price, 4),
                    "volume": int(volume_map.get(int(ts), 0)),
                }
            )
        return rows
    except Exception:
        logger.exception("CoinGecko history failed for coin_id=%s", coin_id)
        return []


# ---------------------------------------------------------------------------
# Period string → CoinGecko days mapping
# ---------------------------------------------------------------------------

_PERIOD_TO_DAYS = {
    "1d": 1,
    "5d": 5,
    "1mo": 30,
    "3mo": 90,
    "6mo": 180,
    "1y": 365,
    "2y": 730,
    "5y": 1825,
    "max": 3650,
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def search_assets(query: str, category: str | None = None) -> list[dict]:
    """Search for assets across stocks, ETFs, and crypto."""
    cache_key = f"market:search:{query.lower()}:{category or 'all'}"

    async def _fetch():
        results: list[dict] = []

        if category in (None, "stocks", "etfs", "bonds"):
            yf_results = await asyncio.to_thread(_yf_search, query)
            results.extend(yf_results)

        if category in (None, "crypto"):
            cg_results = await _cg_search(query)
            results.extend(cg_results)

        return results

    return await _cached(cache_key, ttl=3600, fetcher=_fetch)


async def get_quote(ticker: str, category: str) -> dict:
    """Get the current price quote for a single ticker."""
    cache_key = f"market:quote:{ticker}:{category}"

    async def _fetch():
        if category == "crypto":
            return await _cg_quote(ticker)
        return await asyncio.to_thread(_yf_quote, ticker)

    return await _cached(cache_key, ttl=300, fetcher=_fetch)


async def get_price_history(ticker: str, category: str, period: str = "3mo") -> list[dict]:
    """Get OHLCV price history for a ticker."""
    cache_key = f"market:history:{ticker}:{category}:{period}"

    async def _fetch():
        if category == "crypto":
            days = _PERIOD_TO_DAYS.get(period, 90)
            return await _cg_history(ticker, days)
        return await asyncio.to_thread(_yf_history, ticker, period)

    return await _cached(cache_key, ttl=1800, fetcher=_fetch)


# ---------------------------------------------------------------------------
# Popular assets for market browsing
# ---------------------------------------------------------------------------

POPULAR_ASSETS = {
    "crypto": None,  # Use CoinGecko trending
    "stocks": ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "JPM", "V", "WMT", "JNJ", "PG", "MA", "HD", "DIS", "NFLX", "PYPL", "INTC", "AMD", "CRM"],
    "etfs": ["SPY", "QQQ", "VTI", "VOO", "IWM", "EFA", "AGG", "GLD", "SLV", "VNQ", "XLF", "XLK", "XLE", "ARKK", "BND"],
    "commodities": ["GC=F", "SI=F", "CL=F", "NG=F", "HG=F", "PL=F", "ZC=F", "ZW=F", "ZS=F", "KC=F"],
    "indices": ["^GSPC", "^IXIC", "^DJI", "^RUT", "^VIX", "^FTSE", "^N225", "^GDAXI", "^HSI"],
    "forex": ["EURUSD=X", "GBPUSD=X", "USDJPY=X", "AUDUSD=X", "USDCAD=X", "USDCHF=X", "NZDUSD=X", "EURGBP=X"],
    "bonds": ["^TNX", "^FVX", "^IRX", "TLT", "IEF", "SHY", "BND", "AGG"],
}

COMMODITY_NAMES = {
    "GC=F": "Gold", "SI=F": "Silver", "CL=F": "Crude Oil", "NG=F": "Natural Gas",
    "HG=F": "Copper", "PL=F": "Platinum", "ZC=F": "Corn", "ZW=F": "Wheat",
    "ZS=F": "Soybeans", "KC=F": "Coffee",
}

INDEX_NAMES = {
    "^GSPC": "S&P 500", "^IXIC": "NASDAQ", "^DJI": "Dow Jones",
    "^RUT": "Russell 2000", "^VIX": "VIX", "^FTSE": "FTSE 100",
    "^N225": "Nikkei 225", "^GDAXI": "DAX", "^HSI": "Hang Seng",
}

FOREX_NAMES = {
    "EURUSD=X": "EUR/USD", "GBPUSD=X": "GBP/USD", "USDJPY=X": "USD/JPY",
    "AUDUSD=X": "AUD/USD", "USDCAD=X": "USD/CAD", "USDCHF=X": "USD/CHF",
    "NZDUSD=X": "NZD/USD", "EURGBP=X": "EUR/GBP",
}

# Friendly name lookup for categories that use special ticker symbols
_SPECIAL_NAMES: dict[str, dict[str, str]] = {
    "commodities": COMMODITY_NAMES,
    "indices": INDEX_NAMES,
    "forex": FOREX_NAMES,
}


def _yf_browse_quote(ticker: str, category: str) -> dict | None:
    """Fetch a single browse-list quote via yfinance. Returns None on error."""
    try:
        t = yf.Ticker(ticker)
        fi = t.fast_info
        price = fi.get("lastPrice") if hasattr(fi, "get") else getattr(fi, "last_price", None)
        prev_close = fi.get("previousClose") if hasattr(fi, "get") else getattr(fi, "previous_close", None)
        change_pct = None
        if price is not None and prev_close:
            change_pct = round((price - prev_close) / prev_close * 100, 2)
        # Resolve a friendly name
        name = _SPECIAL_NAMES.get(category, {}).get(ticker)
        if not name:
            info = t.info
            name = info.get("shortName") or info.get("longName") or ticker
        return {
            "symbol": ticker,
            "name": name,
            "price": price,
            "change_24h_pct": change_pct,
            "category": category,
        }
    except Exception:
        logger.warning("yfinance browse quote failed for %s", ticker)
        return None


def _yf_asset_detail(ticker: str, category: str) -> dict | None:
    """Fetch detailed info for a single asset via yfinance. Returns None on error."""
    try:
        t = yf.Ticker(ticker)
        info = t.info
        fi = t.fast_info

        price = fi.get("lastPrice") if hasattr(fi, "get") else getattr(fi, "last_price", None)
        prev_close = fi.get("previousClose") if hasattr(fi, "get") else getattr(fi, "previous_close", None)
        change_pct = None
        if price is not None and prev_close:
            change_pct = round((price - prev_close) / prev_close * 100, 2)

        name = _SPECIAL_NAMES.get(category, {}).get(ticker)
        if not name:
            name = info.get("shortName") or info.get("longName") or ticker

        return {
            "symbol": ticker,
            "name": name,
            "category": category,
            "price": price,
            "change_24h_pct": change_pct,
            "market_cap": info.get("marketCap"),
            "volume": info.get("volume") or info.get("regularMarketVolume"),
            "high_52w": info.get("fiftyTwoWeekHigh"),
            "low_52w": info.get("fiftyTwoWeekLow"),
            "description": info.get("longBusinessSummary"),
        }
    except Exception:
        logger.warning("yfinance asset detail failed for %s", ticker)
        return None


async def _fetch_yf_market_list(tickers: list[str], category: str) -> list[dict]:
    """Fetch browse quotes for many tickers in parallel using asyncio.gather."""

    async def _safe_fetch(sym: str) -> dict | None:
        try:
            return await asyncio.wait_for(
                asyncio.to_thread(_yf_browse_quote, sym, category),
                timeout=15,
            )
        except Exception:
            logger.warning("Timeout or error fetching browse quote for %s", sym)
            return None

    results = await asyncio.gather(*[_safe_fetch(sym) for sym in tickers])
    return [r for r in results if r is not None]


async def _fetch_crypto_market_list() -> list[dict]:
    """Fetch trending crypto coins from CoinGecko and return browse list."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            # 1. Get trending coins
            resp = await client.get(f"{COINGECKO_BASE}/search/trending")
            resp.raise_for_status()
            trending = resp.json()

        coins = trending.get("coins", [])
        if not coins:
            return []

        # Build id list and name map
        coin_ids: list[str] = []
        name_map: dict[str, str] = {}
        for entry in coins[:20]:
            item = entry.get("item", {})
            cid = item.get("id")
            if cid:
                coin_ids.append(cid)
                name_map[cid] = item.get("name", cid)

        if not coin_ids:
            return []

        # 2. Fetch prices in batch
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/simple/price",
                params={
                    "ids": ",".join(coin_ids),
                    "vs_currencies": "usd",
                    "include_24hr_change": "true",
                },
            )
            resp.raise_for_status()
            prices = resp.json()

        items: list[dict] = []
        for cid in coin_ids:
            coin_data = prices.get(cid, {})
            price = coin_data.get("usd")
            change = coin_data.get("usd_24h_change")
            items.append({
                "symbol": cid,
                "name": name_map.get(cid, cid),
                "price": price,
                "change_24h_pct": round(change, 2) if change is not None else None,
                "category": "crypto",
            })
        return items

    except Exception:
        logger.exception("CoinGecko trending fetch failed")
        return []


async def get_market_list(category: str) -> list[dict]:
    """Return a list of popular assets for browsing in the given category."""
    cache_key = f"market:browse:{category}"

    async def _fetch() -> list[dict]:
        if category == "crypto":
            return await _fetch_crypto_market_list()

        tickers = POPULAR_ASSETS.get(category)
        if tickers is None:
            return []

        return await _fetch_yf_market_list(tickers, category)

    return await _cached(cache_key, ttl=600, fetcher=_fetch)


async def get_asset_detail(ticker: str, category: str) -> dict:
    """Get detailed info about a single asset."""
    cache_key = f"market:detail:{ticker}:{category}"

    async def _fetch() -> dict:
        if category == "crypto":
            return await _fetch_crypto_detail(ticker)

        result = await asyncio.wait_for(
            asyncio.to_thread(_yf_asset_detail, ticker, category),
            timeout=15,
        )
        if result is None:
            return {
                "symbol": ticker,
                "name": ticker,
                "category": category,
                "price": None,
                "change_24h_pct": None,
                "market_cap": None,
                "volume": None,
                "high_52w": None,
                "low_52w": None,
                "description": None,
            }
        return result

    return await _cached(cache_key, ttl=600, fetcher=_fetch)


async def _fetch_crypto_detail(coin_id: str) -> dict:
    """Fetch detailed info for a crypto coin from CoinGecko."""
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{COINGECKO_BASE}/coins/{coin_id}",
                params={
                    "localization": "false",
                    "tickers": "false",
                    "community_data": "false",
                    "developer_data": "false",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        market = data.get("market_data", {})
        price = (market.get("current_price") or {}).get("usd")
        change = market.get("price_change_percentage_24h")
        market_cap = (market.get("market_cap") or {}).get("usd")
        volume = (market.get("total_volume") or {}).get("usd")
        high_52w = (market.get("high_24h") or {}).get("usd")  # CoinGecko doesn't have 52w directly; use ATH as proxy
        low_52w = (market.get("low_24h") or {}).get("usd")
        # Try to get ath/atl as better 52w proxies
        ath = (market.get("ath") or {}).get("usd")
        atl = (market.get("atl") or {}).get("usd")

        desc_data = data.get("description") or {}
        description = desc_data.get("en", "")
        # Strip HTML tags from CoinGecko descriptions
        if description:
            import re
            description = re.sub(r"<[^>]+>", "", description)

        return {
            "symbol": coin_id,
            "name": data.get("name", coin_id),
            "category": "crypto",
            "price": price,
            "change_24h_pct": round(change, 2) if change is not None else None,
            "market_cap": market_cap,
            "volume": volume,
            "high_52w": ath,
            "low_52w": atl,
            "description": description or None,
        }
    except Exception:
        logger.exception("CoinGecko detail failed for coin_id=%s", coin_id)
        return {
            "symbol": coin_id,
            "name": coin_id,
            "category": "crypto",
            "price": None,
            "change_24h_pct": None,
            "market_cap": None,
            "volume": None,
            "high_52w": None,
            "low_52w": None,
            "description": None,
        }


async def update_investment_prices(db: AsyncSession) -> int:
    """Batch-update current_value for all investments that have a ticker."""
    stmt = select(Investment).where(Investment.ticker.isnot(None), Investment.ticker != "")
    result = await db.execute(stmt)
    investments = result.scalars().all()

    updated = 0
    for inv in investments:
        try:
            quote = await get_quote(inv.ticker, inv.category.value)
            price = quote.get("price")
            if price is not None:
                inv.current_value = Decimal(str(price)) * inv.quantity
                updated += 1
        except Exception:
            logger.warning("Failed to update price for investment %s (ticker=%s)", inv.id, inv.ticker)

    if updated:
        await db.flush()

    return updated
