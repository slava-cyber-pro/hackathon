from httpx import AsyncClient


SPENDING_URL = "/api/v1/analytics/spending"
INCOME_URL = "/api/v1/analytics/income"
BALANCE_URL = "/api/v1/analytics/balance"
INVESTMENTS_URL = "/api/v1/analytics/investments"
TRANSACTIONS_URL = "/api/v1/transactions"
INVEST_URL = "/api/v1/investments"
CATEGORIES_URL = "/api/v1/categories"


async def _get_first_category_id(client: AsyncClient) -> str:
    resp = await client.get(CATEGORIES_URL)
    return resp.json()[0]["id"]


async def _create_expense(client: AsyncClient, cat_id: str, amount: str, date: str) -> None:
    await client.post(TRANSACTIONS_URL, json={
        "category_id": cat_id, "type": "expense", "amount": amount, "description": "test", "date": date,
    })


async def _create_income(client: AsyncClient, cat_id: str, amount: str, date: str) -> None:
    await client.post(TRANSACTIONS_URL, json={
        "category_id": cat_id, "type": "income", "amount": amount, "description": "test", "date": date,
    })


# ── Spending by Category ──────────────────────────────────────


async def test_spending_by_category_happy_path(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    await _create_expense(authenticated_client, cat_id, "50.00", "2026-03-15")
    await _create_expense(authenticated_client, cat_id, "30.00", "2026-03-20")

    resp = await authenticated_client.get(SPENDING_URL, params={"date_from": "2026-03-01", "date_to": "2026-03-31"})
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 1
    assert data[0]["category_id"] == cat_id
    assert float(data[0]["total"]) == 80.0


async def test_spending_by_category_empty(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.get(SPENDING_URL, params={"date_from": "2025-01-01", "date_to": "2025-01-31"})
    assert resp.status_code == 200
    assert resp.json() == []


async def test_spending_excludes_income(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    await _create_income(authenticated_client, cat_id, "5000.00", "2026-03-15")
    await _create_expense(authenticated_client, cat_id, "100.00", "2026-03-15")

    resp = await authenticated_client.get(SPENDING_URL, params={"date_from": "2026-03-01", "date_to": "2026-03-31"})
    data = resp.json()
    assert len(data) == 1
    assert float(data[0]["total"]) == 100.0


async def test_spending_by_category_date_filtering(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    await _create_expense(authenticated_client, cat_id, "100.00", "2026-02-15")
    await _create_expense(authenticated_client, cat_id, "200.00", "2026-03-15")

    resp = await authenticated_client.get(SPENDING_URL, params={"date_from": "2026-03-01", "date_to": "2026-03-31"})
    data = resp.json()
    assert len(data) == 1
    assert float(data[0]["total"]) == 200.0


async def test_spending_multiple_categories(authenticated_client: AsyncClient) -> None:
    cats = (await authenticated_client.get(CATEGORIES_URL)).json()
    cat1, cat2 = cats[0]["id"], cats[1]["id"]
    await _create_expense(authenticated_client, cat1, "50.00", "2026-03-10")
    await _create_expense(authenticated_client, cat2, "75.00", "2026-03-10")

    resp = await authenticated_client.get(SPENDING_URL, params={"date_from": "2026-03-01", "date_to": "2026-03-31"})
    data = resp.json()
    assert len(data) == 2
    totals = {d["category_id"]: float(d["total"]) for d in data}
    assert totals[cat1] == 50.0
    assert totals[cat2] == 75.0


async def test_spending_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(SPENDING_URL, params={"date_from": "2026-03-01", "date_to": "2026-03-31"})
    assert resp.status_code == 401


async def test_spending_missing_date_params(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.get(SPENDING_URL)
    assert resp.status_code == 422


# ── Investment Summary ─────────────────────────────────────────


async def test_investment_summary_happy_path(authenticated_client: AsyncClient) -> None:
    await authenticated_client.post(INVEST_URL, json={
        "category": "stocks", "name": "AAPL", "amount_invested": 1000, "current_value": 1200,
        "expected_return_pct": 20, "income_allocation_pct": 10,
    })
    await authenticated_client.post(INVEST_URL, json={
        "category": "crypto", "name": "BTC", "amount_invested": 500, "current_value": 400,
        "expected_return_pct": -20, "income_allocation_pct": 5,
    })

    resp = await authenticated_client.get(INVESTMENTS_URL)
    assert resp.status_code == 200
    data = resp.json()
    assert float(data["total_invested"]) == 1500.0
    assert float(data["total_current_value"]) == 1600.0
    assert float(data["total_return_pct"]) > 0


async def test_investment_summary_empty(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.get(INVESTMENTS_URL)
    assert resp.status_code == 200
    data = resp.json()
    assert float(data["total_invested"]) == 0
    assert float(data["total_current_value"]) == 0
    assert float(data["total_return_pct"]) == 0


async def test_investment_summary_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(INVESTMENTS_URL)
    assert resp.status_code == 401


# ── Income vs Expenses / Balance (PostgreSQL-specific) ─────────
# These use date_trunc which is not available in SQLite.
# They'll work in the Docker test environment with PostgreSQL.


async def test_income_endpoint_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(INCOME_URL, params={"date_from": "2026-03-01", "date_to": "2026-03-31"})
    assert resp.status_code == 401


async def test_income_missing_date_params(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.get(INCOME_URL)
    assert resp.status_code == 422


async def test_balance_endpoint_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(BALANCE_URL, params={"date_from": "2026-03-01", "date_to": "2026-03-31"})
    assert resp.status_code == 401


async def test_balance_missing_date_params(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.get(BALANCE_URL)
    assert resp.status_code == 422
