from httpx import AsyncClient

from app.models.user import User


ME_URL = "/api/v1/users/me"


# ── GET /users/me ────────────────────────────────────────────


async def test_get_me(authenticated_client: AsyncClient, sample_user: User) -> None:
    resp = await authenticated_client.get(ME_URL)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == sample_user.email
    assert body["display_name"] == sample_user.display_name
    assert body["id"] == str(sample_user.id)


# ── PATCH /users/me ──────────────────────────────────────────


async def test_update_display_name(
    authenticated_client: AsyncClient, sample_user: User
) -> None:
    resp = await authenticated_client.patch(ME_URL, json={"display_name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["display_name"] == "New Name"


async def test_update_email(
    authenticated_client: AsyncClient, sample_user: User
) -> None:
    resp = await authenticated_client.patch(ME_URL, json={"email": "updated@example.com"})
    assert resp.status_code == 200
    assert resp.json()["email"] == "updated@example.com"


async def test_update_email_duplicate(
    authenticated_client: AsyncClient, sample_user: User, db_session
) -> None:
    from app.core.security import hash_password

    other = User(
        email="taken@example.com",
        hashed_password=hash_password("password123"),
        display_name="Other User",
    )
    db_session.add(other)
    await db_session.commit()

    resp = await authenticated_client.patch(ME_URL, json={"email": "taken@example.com"})
    assert resp.status_code == 409


# ── Edge cases & negative scenarios ─────────────────────────


async def test_get_me_unauthenticated(client) -> None:
    resp = await client.get(ME_URL)
    assert resp.status_code == 401


async def test_update_with_empty_body(
    authenticated_client: AsyncClient, sample_user: User
) -> None:
    resp = await authenticated_client.patch(ME_URL, json={})
    assert resp.status_code == 200
    assert resp.json()["display_name"] == sample_user.display_name
    assert resp.json()["email"] == sample_user.email


async def test_update_email_invalid_format(
    authenticated_client: AsyncClient, sample_user: User
) -> None:
    resp = await authenticated_client.patch(ME_URL, json={"email": "not-an-email"})
    assert resp.status_code == 422


async def test_update_display_name_too_long(
    authenticated_client: AsyncClient, sample_user: User
) -> None:
    resp = await authenticated_client.patch(ME_URL, json={"display_name": "A" * 201})
    assert resp.status_code == 422


async def test_update_ignores_extra_fields(
    authenticated_client: AsyncClient, sample_user: User
) -> None:
    resp = await authenticated_client.patch(
        ME_URL, json={"display_name": "Legit", "id": "00000000-0000-0000-0000-000000000000", "hashed_password": "pwned"}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["display_name"] == "Legit"
    assert body["id"] == str(sample_user.id)  # id was not overwritten
