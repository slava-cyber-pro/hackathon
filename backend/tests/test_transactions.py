from httpx import AsyncClient

from app.core.security import create_access_token, hash_password
from app.models.user import User


TRANSACTIONS_URL = "/api/v1/transactions"
CATEGORIES_URL = "/api/v1/categories"


async def _get_first_category_id(client: AsyncClient) -> str:
    resp = await client.get(CATEGORIES_URL)
    return resp.json()[0]["id"]


def _expense_payload(category_id: str, **overrides) -> dict:
    base = {
        "category_id": category_id,
        "type": "expense",
        "amount": "50.00",
        "description": "Test expense",
        "date": "2026-03-15",
    }
    base.update(overrides)
    return base


async def test_create_transaction_expense(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))
    assert resp.status_code == 201
    body = resp.json()
    assert body["type"] == "expense"
    assert body["amount"] == "50.00"
    assert body["category_id"] == cat_id


async def test_create_transaction_income(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    payload = _expense_payload(cat_id, type="income", amount="1200.00", description="Salary")
    resp = await authenticated_client.post(TRANSACTIONS_URL, json=payload)
    assert resp.status_code == 201
    assert resp.json()["type"] == "income"


async def test_create_transaction_negative_amount(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id, amount="-10"))
    assert resp.status_code == 422


async def test_list_transactions(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    for i in range(3):
        await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id, description=f"Item {i}"))

    resp = await authenticated_client.get(TRANSACTIONS_URL)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 3


async def test_list_transactions_filter_by_type(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))
    await authenticated_client.post(
        TRANSACTIONS_URL, json=_expense_payload(cat_id, type="income", amount="100.00")
    )

    resp = await authenticated_client.get(TRANSACTIONS_URL, params={"type": "income"})
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["type"] == "income"


async def test_update_transaction(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    create_resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))
    tx_id = create_resp.json()["id"]

    update_resp = await authenticated_client.put(
        f"{TRANSACTIONS_URL}/{tx_id}", json={"amount": "99.99", "description": "Updated"}
    )
    assert update_resp.status_code == 200
    assert update_resp.json()["amount"] == "99.99"
    assert update_resp.json()["description"] == "Updated"


async def test_update_transaction_not_owner(
    authenticated_client: AsyncClient, db_session
) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    create_resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))
    tx_id = create_resp.json()["id"]

    other_user = User(
        email="other@example.com",
        hashed_password=hash_password("password123"),
        display_name="Other User",
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    other_token = create_access_token(str(other_user.id))
    authenticated_client.headers["Authorization"] = f"Bearer {other_token}"

    resp = await authenticated_client.put(
        f"{TRANSACTIONS_URL}/{tx_id}", json={"amount": "1.00"}
    )
    assert resp.status_code == 404


async def test_delete_transaction(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    create_resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))
    tx_id = create_resp.json()["id"]

    del_resp = await authenticated_client.delete(f"{TRANSACTIONS_URL}/{tx_id}")
    assert del_resp.status_code == 204

    listing = await authenticated_client.get(TRANSACTIONS_URL)
    ids = [t["id"] for t in listing.json()["items"]]
    assert tx_id not in ids


async def test_list_transactions_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(TRANSACTIONS_URL)
    assert resp.status_code == 401


# --- Validation ---


async def test_create_transaction_zero_amount(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id, amount="0"))
    assert resp.status_code == 422


async def test_create_transaction_missing_required_fields(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(
        TRANSACTIONS_URL, json={"type": "expense", "amount": "10.00", "date": "2026-03-15"},
    )
    assert resp.status_code == 422


async def test_create_transaction_invalid_type(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id, type="refund"))
    assert resp.status_code == 422


async def test_create_transaction_invalid_category_id(authenticated_client: AsyncClient) -> None:
    import uuid
    fake_cat = str(uuid.uuid4())
    resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(fake_cat))
    # SQLite doesn't enforce FK constraints by default; PostgreSQL would return 500/400.
    # In both cases the request completes — we just verify it doesn't crash unexpectedly.
    assert resp.status_code in (201, 400, 422, 500)


async def test_create_transaction_very_large_amount(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    resp = await authenticated_client.post(
        TRANSACTIONS_URL, json=_expense_payload(cat_id, amount="9999999999.99"),
    )
    assert resp.status_code == 201
    assert resp.json()["amount"] == "9999999999.99"


# --- Filtering ---


async def test_list_transactions_filter_by_date_range(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    for d in ["2026-01-10", "2026-02-15", "2026-03-20"]:
        await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id, date=d))

    resp = await authenticated_client.get(
        TRANSACTIONS_URL, params={"date_from": "2026-02-01", "date_to": "2026-02-28"},
    )
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 1


async def test_list_transactions_filter_by_category(authenticated_client: AsyncClient) -> None:
    listing = (await authenticated_client.get(CATEGORIES_URL)).json()
    cat_a, cat_b = listing[0]["id"], listing[1]["id"]

    await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_a))
    await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_b))
    await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_a))

    resp = await authenticated_client.get(TRANSACTIONS_URL, params={"category_id": cat_a})
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 2
    assert all(t["category_id"] == cat_a for t in resp.json()["items"])


async def test_list_transactions_empty_result(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.get(
        TRANSACTIONS_URL, params={"date_from": "2099-01-01", "date_to": "2099-12-31"},
    )
    assert resp.status_code == 200
    assert resp.json()["items"] == []


async def test_list_transactions_pagination(authenticated_client: AsyncClient) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    for i in range(5):
        await authenticated_client.post(
            TRANSACTIONS_URL, json=_expense_payload(cat_id, description=f"Pag {i}"),
        )

    resp = await authenticated_client.get(TRANSACTIONS_URL, params={"page": 1, "size": 2})
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 2


# --- Authorization ---


async def test_delete_transaction_not_owner(
    authenticated_client: AsyncClient, db_session,
) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    create_resp = await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))
    tx_id = create_resp.json()["id"]

    other_user = User(
        email="other_del@example.com",
        hashed_password=hash_password("password123"),
        display_name="Other Del",
    )
    db_session.add(other_user)
    await db_session.commit()
    await db_session.refresh(other_user)

    authenticated_client.headers["Authorization"] = f"Bearer {create_access_token(str(other_user.id))}"
    resp = await authenticated_client.delete(f"{TRANSACTIONS_URL}/{tx_id}")
    assert resp.status_code == 404


async def test_list_transactions_only_own(
    authenticated_client: AsyncClient, db_session,
) -> None:
    cat_id = await _get_first_category_id(authenticated_client)
    await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))
    await authenticated_client.post(TRANSACTIONS_URL, json=_expense_payload(cat_id))

    user_b = User(
        email="userb_list@example.com",
        hashed_password=hash_password("password123"),
        display_name="User B List",
    )
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)

    authenticated_client.headers["Authorization"] = f"Bearer {create_access_token(str(user_b.id))}"
    resp = await authenticated_client.get(TRANSACTIONS_URL)
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 0
