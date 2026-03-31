from datetime import UTC, datetime, timedelta

from httpx import AsyncClient
from jose import jwt

from app.core.config import settings


REGISTER_URL = "/api/v1/auth/register"
LOGIN_URL = "/api/v1/auth/login"
REFRESH_URL = "/api/v1/auth/refresh"
ME_URL = "/api/v1/users/me"

VALID_USER = {
    "email": "new@example.com",
    "password": "strongpass1",
    "display_name": "New User",
}


async def _register(client: AsyncClient, **overrides) -> dict:
    payload = {**VALID_USER, **overrides}
    return (await client.post(REGISTER_URL, json=payload)).json()


# ── Registration ─────────────────────────────────────────────


async def test_register_success(client: AsyncClient) -> None:
    resp = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp.status_code == 201
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body
    assert body["token_type"] == "bearer"


async def test_register_duplicate_email(client: AsyncClient) -> None:
    await client.post(REGISTER_URL, json=VALID_USER)
    resp = await client.post(REGISTER_URL, json=VALID_USER)
    assert resp.status_code == 409


async def test_register_invalid_email(client: AsyncClient) -> None:
    resp = await client.post(
        REGISTER_URL, json={**VALID_USER, "email": "not-an-email"}
    )
    assert resp.status_code == 422


async def test_register_short_password(client: AsyncClient) -> None:
    resp = await client.post(
        REGISTER_URL, json={**VALID_USER, "password": "short"}
    )
    assert resp.status_code == 422


# ── Login ────────────────────────────────────────────────────


async def test_login_success(client: AsyncClient) -> None:
    await client.post(REGISTER_URL, json=VALID_USER)
    resp = await client.post(
        LOGIN_URL, json={"email": VALID_USER["email"], "password": VALID_USER["password"]}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


async def test_login_wrong_password(client: AsyncClient, sample_user) -> None:
    resp = await client.post(
        LOGIN_URL, json={"email": "test@example.com", "password": "wrongpassword"}
    )
    assert resp.status_code == 401


async def test_login_nonexistent_email(client: AsyncClient) -> None:
    resp = await client.post(
        LOGIN_URL, json={"email": "nobody@example.com", "password": "irrelevant1"}
    )
    assert resp.status_code == 401


# ── Refresh ──────────────────────────────────────────────────


async def test_refresh_success(client: AsyncClient) -> None:
    tokens = await _register(client)
    resp = await client.post(
        REFRESH_URL, json={"refresh_token": tokens["refresh_token"]}
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "access_token" in body
    assert "refresh_token" in body


async def test_refresh_invalid_token(client: AsyncClient) -> None:
    resp = await client.post(
        REFRESH_URL, json={"refresh_token": "totally.invalid.token"}
    )
    assert resp.status_code == 401


# ── Protected route access ───────────────────────────────────


async def test_access_protected_route_no_token(client: AsyncClient) -> None:
    resp = await client.get(ME_URL)
    assert resp.status_code == 401


async def test_access_protected_route_invalid_token(client: AsyncClient) -> None:
    resp = await client.get(ME_URL, headers={"Authorization": "Bearer bogus.jwt.token"})
    assert resp.status_code == 401


# ── Boundary / edge cases ───────────────────────────────────


async def test_register_password_exactly_8_chars(client: AsyncClient) -> None:
    resp = await client.post(
        REGISTER_URL, json={**VALID_USER, "password": "exactly8"}
    )
    assert resp.status_code == 201


async def test_register_empty_display_name(client: AsyncClient) -> None:
    resp = await client.post(
        REGISTER_URL, json={**VALID_USER, "display_name": ""}
    )
    assert resp.status_code == 422


async def test_register_very_long_email(client: AsyncClient) -> None:
    long_email = "a" * 250 + "@example.com"
    resp = await client.post(
        REGISTER_URL, json={**VALID_USER, "email": long_email}
    )
    assert resp.status_code == 422


async def test_register_sql_injection_email(client: AsyncClient) -> None:
    resp = await client.post(
        REGISTER_URL, json={**VALID_USER, "email": "' OR 1=1 --"}
    )
    assert resp.status_code == 422


async def test_register_xss_in_display_name(client: AsyncClient) -> None:
    xss_name = "<script>alert(1)</script>"
    resp = await client.post(
        REGISTER_URL, json={**VALID_USER, "display_name": xss_name}
    )
    assert resp.status_code == 201
    body = resp.json()
    # Verify we can fetch the user and the name is stored as-is
    me = await client.get(ME_URL, headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.json()["display_name"] == xss_name


# ── Token edge cases ────────────────────────────────────────


async def test_access_with_expired_token(client: AsyncClient, sample_user) -> None:
    payload = {
        "sub": str(sample_user.id),
        "exp": datetime.now(UTC) - timedelta(hours=1),
        "iat": datetime.now(UTC) - timedelta(hours=2),
        "type": "access",
    }
    expired_token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    resp = await client.get(ME_URL, headers={"Authorization": f"Bearer {expired_token}"})
    assert resp.status_code == 401


async def test_access_with_refresh_token_as_access(client: AsyncClient, sample_user) -> None:
    payload = {
        "sub": str(sample_user.id),
        "exp": datetime.now(UTC) + timedelta(days=7),
        "iat": datetime.now(UTC),
        "type": "refresh",
    }
    refresh_token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    resp = await client.get(ME_URL, headers={"Authorization": f"Bearer {refresh_token}"})
    assert resp.status_code == 401


async def test_refresh_with_access_token(client: AsyncClient, sample_user) -> None:
    payload = {
        "sub": str(sample_user.id),
        "exp": datetime.now(UTC) + timedelta(minutes=15),
        "iat": datetime.now(UTC),
        "type": "access",
    }
    access_token = jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
    resp = await client.post(REFRESH_URL, json={"refresh_token": access_token})
    assert resp.status_code == 401


# ── Authorization bypass attempts ───────────────────────────


async def test_register_with_extra_fields(client: AsyncClient) -> None:
    payload = {**VALID_USER, "id": "00000000-0000-0000-0000-000000000000", "is_admin": True}
    resp = await client.post(REGISTER_URL, json=payload)
    assert resp.status_code == 201
    body = resp.json()
    # Verify extra fields were ignored — fetch user to check
    me = await client.get(ME_URL, headers={"Authorization": f"Bearer {body['access_token']}"})
    assert me.status_code == 200
    assert me.json()["id"] != "00000000-0000-0000-0000-000000000000"
