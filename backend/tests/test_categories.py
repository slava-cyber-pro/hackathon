from httpx import AsyncClient


CATEGORIES_URL = "/api/v1/categories"


async def test_list_categories_returns_defaults(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.get(CATEGORIES_URL)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 15
    assert all(c["is_default"] is True for c in data)


async def test_create_custom_category(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(CATEGORIES_URL, json={"name": "Gaming", "icon": "🎮"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Gaming"
    assert body["icon"] == "🎮"
    assert body["is_default"] is False

    listing = await authenticated_client.get(CATEGORIES_URL)
    names = [c["name"] for c in listing.json()]
    assert "Gaming" in names


async def test_delete_custom_category(authenticated_client: AsyncClient) -> None:
    create_resp = await authenticated_client.post(CATEGORIES_URL, json={"name": "Temp"})
    cat_id = create_resp.json()["id"]

    del_resp = await authenticated_client.delete(f"{CATEGORIES_URL}/{cat_id}")
    assert del_resp.status_code == 204

    listing = await authenticated_client.get(CATEGORIES_URL)
    ids = [c["id"] for c in listing.json()]
    assert cat_id not in ids


async def test_delete_default_category_forbidden(authenticated_client: AsyncClient) -> None:
    listing = await authenticated_client.get(CATEGORIES_URL)
    default_id = next(c["id"] for c in listing.json() if c["is_default"])

    resp = await authenticated_client.delete(f"{CATEGORIES_URL}/{default_id}")
    assert resp.status_code == 403


async def test_list_categories_unauthenticated(client: AsyncClient) -> None:
    resp = await client.get(CATEGORIES_URL)
    assert resp.status_code == 401


async def test_create_category_empty_name(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(CATEGORIES_URL, json={"name": ""})
    assert resp.status_code == 422


async def test_create_category_name_too_long(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(CATEGORIES_URL, json={"name": "A" * 101})
    assert resp.status_code == 422


async def test_create_category_duplicate_name(authenticated_client: AsyncClient) -> None:
    resp1 = await authenticated_client.post(CATEGORIES_URL, json={"name": "Duplicate"})
    resp2 = await authenticated_client.post(CATEGORIES_URL, json={"name": "Duplicate"})
    assert resp1.status_code == 201
    assert resp2.status_code == 201
    assert resp1.json()["id"] != resp2.json()["id"]


async def test_delete_nonexistent_category(authenticated_client: AsyncClient) -> None:
    import uuid
    fake_id = str(uuid.uuid4())
    resp = await authenticated_client.delete(f"{CATEGORIES_URL}/{fake_id}")
    assert resp.status_code == 404


async def test_delete_other_users_category(
    authenticated_client: AsyncClient, db_session,
) -> None:
    from app.core.security import create_access_token, hash_password
    from app.models.user import User

    # User A creates a category
    resp = await authenticated_client.post(CATEGORIES_URL, json={"name": "Private"})
    assert resp.status_code == 201
    cat_id = resp.json()["id"]

    # Create user B directly in DB
    user_b = User(
        email="userb@example.com",
        hashed_password=hash_password("password123"),
        display_name="User B",
    )
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)

    # Switch to user B's token and try to delete user A's category
    token_b = create_access_token(str(user_b.id))
    authenticated_client.headers["Authorization"] = f"Bearer {token_b}"
    resp = await authenticated_client.delete(f"{CATEGORIES_URL}/{cat_id}")
    assert resp.status_code == 404


async def test_create_category_with_icon(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(CATEGORIES_URL, json={"name": "Music", "icon": "notes"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["icon"] == "notes"

    listing = await authenticated_client.get(CATEGORIES_URL)
    match = next(c for c in listing.json() if c["id"] == body["id"])
    assert match["icon"] == "notes"
