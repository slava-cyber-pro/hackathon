from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, hash_password
from app.models.user import User

TEAMS_URL = "/api/v1/teams"


async def test_create_team(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(TEAMS_URL, json={"name": "Finance Team"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["name"] == "Finance Team"
    assert "id" in body


async def test_get_team(authenticated_client: AsyncClient) -> None:
    create_resp = await authenticated_client.post(TEAMS_URL, json={"name": "Dev Team"})
    team_id = create_resp.json()["id"]
    resp = await authenticated_client.get(f"{TEAMS_URL}/{team_id}")
    assert resp.status_code == 200
    assert resp.json()["name"] == "Dev Team"


async def test_team_creator_is_owner(authenticated_client: AsyncClient) -> None:
    create_resp = await authenticated_client.post(TEAMS_URL, json={"name": "Owner Test"})
    team_id = create_resp.json()["id"]
    resp = await authenticated_client.get(f"{TEAMS_URL}/{team_id}/members")
    assert resp.status_code == 200
    members = resp.json()
    assert len(members) == 1
    assert members[0]["role"] == "owner"


async def test_invite_member(
    db_session: AsyncSession, authenticated_client: AsyncClient
) -> None:
    # Create second user directly in DB (avoids rate limiter)
    user2 = User(email="second@example.com", hashed_password=hash_password("pass12345"), display_name="Second")
    db_session.add(user2)
    await db_session.commit()

    # Create team and invite
    create_resp = await authenticated_client.post(TEAMS_URL, json={"name": "Collab Team"})
    team_id = create_resp.json()["id"]

    invite_resp = await authenticated_client.post(
        f"{TEAMS_URL}/{team_id}/invite",
        json={"email": "second@example.com", "role": "member"},
    )
    assert invite_resp.status_code == 201

    members_resp = await authenticated_client.get(f"{TEAMS_URL}/{team_id}/members")
    assert len(members_resp.json()) == 2


async def test_teams_unauthenticated(client: AsyncClient) -> None:
    resp = await client.post(TEAMS_URL, json={"name": "Should Fail"})
    assert resp.status_code == 401


async def test_create_team_empty_name(authenticated_client: AsyncClient) -> None:
    resp = await authenticated_client.post(TEAMS_URL, json={"name": ""})
    assert resp.status_code == 422


async def test_get_team_not_member(
    db_session: AsyncSession, authenticated_client: AsyncClient, client: AsyncClient,
) -> None:
    create_resp = await authenticated_client.post(TEAMS_URL, json={"name": "Private Team"})
    team_id = create_resp.json()["id"]
    user_b = User(email="b@example.com", hashed_password=hash_password("pass12345"), display_name="B")
    db_session.add(user_b)
    await db_session.commit()
    await db_session.refresh(user_b)
    token_b = create_access_token(str(user_b.id))
    resp = await client.get(
        f"{TEAMS_URL}/{team_id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 403


async def test_invite_nonexistent_email(
    authenticated_client: AsyncClient,
) -> None:
    create_resp = await authenticated_client.post(TEAMS_URL, json={"name": "Ghost Team"})
    team_id = create_resp.json()["id"]
    resp = await authenticated_client.post(
        f"{TEAMS_URL}/{team_id}/invite",
        json={"email": "nobody@nowhere.com", "role": "member"},
    )
    assert resp.status_code == 404


async def test_invite_duplicate_member(
    db_session: AsyncSession, authenticated_client: AsyncClient,
) -> None:
    user_b = User(email="dup@example.com", hashed_password=hash_password("pass12345"), display_name="Dup")
    db_session.add(user_b)
    await db_session.commit()
    create_resp = await authenticated_client.post(TEAMS_URL, json={"name": "Dup Team"})
    team_id = create_resp.json()["id"]
    await authenticated_client.post(
        f"{TEAMS_URL}/{team_id}/invite",
        json={"email": "dup@example.com", "role": "member"},
    )
    resp = await authenticated_client.post(
        f"{TEAMS_URL}/{team_id}/invite",
        json={"email": "dup@example.com", "role": "member"},
    )
    assert resp.status_code == 409


async def test_invite_as_non_admin(
    db_session: AsyncSession, authenticated_client: AsyncClient, client: AsyncClient,
) -> None:
    user_b = User(email="member@example.com", hashed_password=hash_password("pass12345"), display_name="Member")
    user_c = User(email="target@example.com", hashed_password=hash_password("pass12345"), display_name="Target")
    db_session.add_all([user_b, user_c])
    await db_session.commit()
    await db_session.refresh(user_b)
    create_resp = await authenticated_client.post(TEAMS_URL, json={"name": "Admin Team"})
    team_id = create_resp.json()["id"]
    await authenticated_client.post(
        f"{TEAMS_URL}/{team_id}/invite",
        json={"email": "member@example.com", "role": "member"},
    )
    token_b = create_access_token(str(user_b.id))
    resp = await client.post(
        f"{TEAMS_URL}/{team_id}/invite",
        json={"email": "target@example.com", "role": "member"},
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert resp.status_code == 403
