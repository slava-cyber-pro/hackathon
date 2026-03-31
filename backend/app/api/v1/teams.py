from uuid import UUID

from fastapi import APIRouter

from app.api.deps import DB, CurrentUser
from app.schemas.team import InviteRequest, TeamCreate, TeamMemberResponse, TeamResponse
from app.services import team_service

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("", response_model=list[TeamResponse])
async def list_my_teams(db: DB, user: CurrentUser) -> list[TeamResponse]:
    teams = await team_service.get_my_teams(db, user.id)
    return [TeamResponse.model_validate(t) for t in teams]


@router.post("", response_model=TeamResponse, status_code=201)
async def create_team(body: TeamCreate, db: DB, user: CurrentUser) -> TeamResponse:
    team = await team_service.create_team(db, user.id, body.name)
    return TeamResponse.model_validate(team)


@router.get("/{team_id}", response_model=TeamResponse)
async def get_team(team_id: UUID, db: DB, user: CurrentUser) -> TeamResponse:
    team = await team_service.get_team(db, user.id, team_id)
    return TeamResponse.model_validate(team)


@router.get("/{team_id}/members", response_model=list[TeamMemberResponse])
async def get_team_members(team_id: UUID, db: DB, user: CurrentUser) -> list[TeamMemberResponse]:
    await team_service.get_team(db, user.id, team_id)
    members = await team_service.get_team_members(db, team_id)
    return [
        TeamMemberResponse(
            user_id=m.user_id,
            role=m.role,
            joined_at=m.joined_at,
            display_name=m.user.display_name,
            email=m.user.email,
        )
        for m in members
    ]


@router.post("/{team_id}/invite", response_model=TeamMemberResponse, status_code=201)
async def invite_member(
    team_id: UUID, body: InviteRequest, db: DB, user: CurrentUser
) -> TeamMemberResponse:
    member = await team_service.invite_member(db, user.id, team_id, body.email, body.role)
    return TeamMemberResponse(
        user_id=member.user_id,
        role=member.role,
        joined_at=member.joined_at,
        display_name=member.user.display_name,
        email=member.user.email,
    )


@router.delete("/{team_id}/members/{user_id}", status_code=204)
async def remove_member(team_id: UUID, user_id: UUID, db: DB, user: CurrentUser) -> None:
    await team_service.remove_member(db, user.id, team_id, user_id)


@router.post("/{team_id}/leave", status_code=204)
async def leave_team(team_id: UUID, db: DB, user: CurrentUser) -> None:
    await team_service.remove_member(db, user.id, team_id, user.id)
