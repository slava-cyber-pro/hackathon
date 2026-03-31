import uuid

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User


INVESTMENTS_URL = "/api/v1/investments"

VALID_INVESTMENT = {
    "category": "stocks",
    "name": "AAPL Shares",
    "amount_invested": "5000.00",
    "current_value": "5500.00",
    "expected_return_pct": "10.00",
    "income_allocation_pct": "20.00",
}


async def test_create_investment(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "AAPL Shares"
    assert body["category"] == "stocks"
    assert float(body["amount_invested"]) == 5000.00
    assert float(body["current_value"]) == 5500.00
    assert "id" in body
    assert "user_id" in body
    assert "created_at" in body


async def test_create_investment_invalid_category(authenticated_client: AsyncClient) -> None:
    payload = {**VALID_INVESTMENT, "category": "magic_beans"}
    resp = await authenticated_client.post(INVESTMENTS_URL, json=payload)
    assert resp.status_code == 422


async def test_list_investments(authenticated_client: AsyncClient) -> None:
    await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    await authenticated_client.post(
        INVESTMENTS_URL, json={**VALID_INVESTMENT, "name": "BTC Holdings", "category": "crypto"}
    )
    resp = await authenticated_client.get(INVESTMENTS_URL)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 2


async def test_update_investment(authenticated_client: AsyncClient) -> None:
    create_resp = await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    inv_id = create_resp.json()["id"]
    resp = await authenticated_client.put(
        f"{INVESTMENTS_URL}/{inv_id}", json={"name": "Updated Name", "current_value": "6000.00"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["name"] == "Updated Name"
    assert float(body["current_value"]) == 6000.00


async def test_delete_investment(authenticated_client: AsyncClient) -> None:
    create_resp = await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    inv_id = create_resp.json()["id"]
    resp = await authenticated_client.delete(f"{INVESTMENTS_URL}/{inv_id}")
    assert resp.status_code == 204
    listing = await authenticated_client.get(INVESTMENTS_URL)
    assert len(listing.json()["items"]) == 0


async def test_investments_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(INVESTMENTS_URL)
    assert resp.status_code == 401


async def test_create_investment_zero_amount(authenticated_client: AsyncClient) -> None:
    payload = {**VALID_INVESTMENT, "amount_invested": "0.00"}
    resp = await authenticated_client.post(INVESTMENTS_URL, json=payload)
    assert resp.status_code == 422


async def test_create_investment_negative_amount(authenticated_client: AsyncClient) -> None:
    payload = {**VALID_INVESTMENT, "amount_invested": "-100.00"}
    resp = await authenticated_client.post(INVESTMENTS_URL, json=payload)
    assert resp.status_code == 422


async def test_update_investment_not_owner(
    db_session: AsyncSession, authenticated_client: AsyncClient, client: AsyncClient,
) -> None:
    create_resp = await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    inv_id = create_resp.json()["id"]
    user_b = User(email="b@example.com", hashed_password=hash_password("pass12345"), display_name="B")
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)
    token_b = create_access_token(str(user_b.id))
    resp = await client.put(
        f"{INVESTMENTS_URL}/{inv_id}",
        json={"name": "Hacked"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 404


async def test_delete_investment_not_owner(
    db_session: AsyncSession, authenticated_client: AsyncClient, client: AsyncClient,
) -> None:
    create_resp = await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    inv_id = create_resp.json()["id"]
    user_b = User(email="b@example.com", hashed_password=hash_password("pass12345"), display_name="B")
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)
    token_b = create_access_token(str(user_b.id))
    resp = await client.delete(
        f"{INVESTMENTS_URL}/{inv_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 404


async def test_delete_nonexistent_investment(authenticated_client: AsyncClient) -> None:
    fake_id = str(uuid.uuid4())
    resp = await authenticated_client.delete(f"{INVESTMENTS_URL}/{fake_id}")
    assert resp.status_code == 404


async def test_list_investments_only_own(
    db_session: AsyncSession, authenticated_client: AsyncClient, client: AsyncClient,
) -> None:
    await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    user_b = User(email="b@example.com", hashed_password=hash_password("pass12345"), display_name="B")
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)
    token_b = create_access_token(str(user_b.id))
    resp = await client.get(INVESTMENTS_URL, headers={"Authorization": f"Bearer {token_b}"})
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 0


async def test_update_investment_partial(authenticated_client: AsyncClient) -> None:
    create_resp = await authenticated_client.post(INVESTMENTS_URL, json=VALID_INVESTMENT)
    inv_id = create_resp.json()["id"]
    original = create_resp.json()
    resp = await authenticated_client.put(
        f"{INVESTMENTS_URL}/{inv_id}", json={"current_value": "9999.00"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert float(body["current_value"]) == 9999.00
    assert body["name"] == original["name"]
    assert float(body["amount_invested"]) == float(original["amount_invested"])
    assert float(body["expected_return_pct"]) == float(original["expected_return_pct"])
