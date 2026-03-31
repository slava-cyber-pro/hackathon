from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User


BUDGETS_URL = "/api/v1/budgets"
CATEGORIES_URL = "/api/v1/categories"
TRANSACTIONS_URL = "/api/v1/transactions"


async def _get_first_category_id(client: AsyncClient) -> str:
    resp = await client.get(CATEGORIES_URL)
    return resp.json()[0]["id"]


async def test_create_budget(authenticated_client: AsyncClient) -> None:
    category_id = await _get_first_category_id(authenticated_client)
    payload = {
        "category_id": category_id,
        "amount_limit": "1000.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    }
    resp = await authenticated_client.post(BUDGETS_URL, json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["category_id"] == category_id
    assert float(body["amount_limit"]) == 1000.00
    assert body["period"] == "monthly"
    assert float(body["spent"]) == 0


async def test_list_budgets_with_spent(authenticated_client: AsyncClient) -> None:
    category_id = await _get_first_category_id(authenticated_client)

    # Create a budget for this category
    await authenticated_client.post(BUDGETS_URL, json={
        "category_id": category_id,
        "amount_limit": "500.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    })

    # Create an expense transaction with the same category
    await authenticated_client.post(TRANSACTIONS_URL, json={
        "category_id": category_id,
        "type": "expense",
        "amount": "150.00",
        "description": "Test expense",
        "date": "2026-03-15",
    })

    resp = await authenticated_client.get(BUDGETS_URL)
    assert resp.status_code == 200
    budgets = resp.json()
    assert len(budgets) == 1
    assert float(budgets[0]["spent"]) > 0
    assert float(budgets[0]["spent"]) == 150.00


async def test_update_budget(authenticated_client: AsyncClient) -> None:
    category_id = await _get_first_category_id(authenticated_client)
    create_resp = await authenticated_client.post(BUDGETS_URL, json={
        "category_id": category_id,
        "amount_limit": "800.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    })
    budget_id = create_resp.json()["id"]

    resp = await authenticated_client.put(
        f"{BUDGETS_URL}/{budget_id}", json={"amount_limit": "1200.00"}
    )
    assert resp.status_code == 200
    assert float(resp.json()["amount_limit"]) == 1200.00


async def test_budgets_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(BUDGETS_URL)
    assert resp.status_code == 401


async def test_create_budget_zero_limit(authenticated_client: AsyncClient) -> None:
    category_id = await _get_first_category_id(authenticated_client)
    payload = {
        "category_id": category_id,
        "amount_limit": "0.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    }
    resp = await authenticated_client.post(BUDGETS_URL, json=payload)
    assert resp.status_code == 422


async def test_create_budget_without_category(authenticated_client: AsyncClient) -> None:
    payload = {
        "category_id": None,
        "amount_limit": "2000.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    }
    resp = await authenticated_client.post(BUDGETS_URL, json=payload)
    assert resp.status_code == 201
    body = resp.json()
    assert body["category_id"] is None
    assert float(body["amount_limit"]) == 2000.00


async def test_update_budget_not_owner(
    db_session: AsyncSession, authenticated_client: AsyncClient, client: AsyncClient,
) -> None:
    category_id = await _get_first_category_id(authenticated_client)
    create_resp = await authenticated_client.post(BUDGETS_URL, json={
        "category_id": category_id,
        "amount_limit": "500.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    })
    budget_id = create_resp.json()["id"]
    user_b = User(email="b@example.com", hashed_password=hash_password("pass12345"), display_name="B")
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)
    token_b = create_access_token(str(user_b.id))
    resp = await client.put(
        f"{BUDGETS_URL}/{budget_id}",
        json={"amount_limit": "9999.00"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 404


async def test_list_budgets_only_own(
    db_session: AsyncSession, authenticated_client: AsyncClient, client: AsyncClient,
) -> None:
    category_id = await _get_first_category_id(authenticated_client)
    await authenticated_client.post(BUDGETS_URL, json={
        "category_id": category_id,
        "amount_limit": "500.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    })
    user_b = User(email="b@example.com", hashed_password=hash_password("pass12345"), display_name="B")
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)
    token_b = create_access_token(str(user_b.id))
    resp = await client.get(BUDGETS_URL, headers={"Authorization": f"Bearer {token_b}"})
    assert resp.status_code == 200
    assert len(resp.json()) == 0


async def test_budget_spent_matches_expenses_only(authenticated_client: AsyncClient) -> None:
    category_id = await _get_first_category_id(authenticated_client)
    await authenticated_client.post(BUDGETS_URL, json={
        "category_id": category_id,
        "amount_limit": "1000.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    })
    await authenticated_client.post(TRANSACTIONS_URL, json={
        "category_id": category_id,
        "type": "income",
        "amount": "500.00",
        "description": "Salary",
        "date": "2026-03-10",
    })
    await authenticated_client.post(TRANSACTIONS_URL, json={
        "category_id": category_id,
        "type": "expense",
        "amount": "200.00",
        "description": "Groceries",
        "date": "2026-03-15",
    })
    resp = await authenticated_client.get(BUDGETS_URL)
    budgets = resp.json()
    assert len(budgets) == 1
    assert float(budgets[0]["spent"]) == 200.00


async def test_budget_spent_zero_when_no_transactions(authenticated_client: AsyncClient) -> None:
    category_id = await _get_first_category_id(authenticated_client)
    await authenticated_client.post(BUDGETS_URL, json={
        "category_id": category_id,
        "amount_limit": "1000.00",
        "period": "monthly",
        "period_start": "2026-03-01",
    })
    resp = await authenticated_client.get(BUDGETS_URL)
    budgets = resp.json()
    assert len(budgets) == 1
    assert float(budgets[0]["spent"]) == 0
