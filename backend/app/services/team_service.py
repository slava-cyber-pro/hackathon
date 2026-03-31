from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.metrics import teams_created_total
from app.models.team import Team, TeamMember, TeamRole
from app.models.user import User
from app.utils.exceptions import ConflictError, NotFoundError, PermissionDeniedError


async def get_team_user_ids(db: AsyncSession, user_id: UUID) -> list[UUID]:
    """Get all user IDs in the same team(s) as this user, including the user themselves."""
    result = await db.execute(
        select(TeamMember.user_id)
        .where(TeamMember.team_id.in_(
            select(TeamMember.team_id).where(TeamMember.user_id == user_id)
        ))
    )
    ids = list({row[0] for row in result.all()})
    return ids if ids else [user_id]


async def get_my_teams(db: AsyncSession, user_id: UUID) -> list[Team]:
    result = await db.execute(
        select(Team)
        .join(TeamMember, Team.id == TeamMember.team_id)
        .where(TeamMember.user_id == user_id)
        .order_by(Team.created_at.desc())
    )
    return list(result.scalars().all())


async def create_team(db: AsyncSession, user_id: UUID, name: str) -> Team:
    team = Team(name=name, created_by=user_id)
    db.add(team)
    await db.flush()

    member = TeamMember(team_id=team.id, user_id=user_id, role=TeamRole.OWNER)
    db.add(member)

    await db.commit()
    await db.refresh(team)
    teams_created_total.inc()
    return team


async def get_team(db: AsyncSession, user_id: UUID, team_id: UUID) -> Team:
    team = await db.get(Team, team_id)
    if not team:
        raise NotFoundError("Team")

    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
    )
    if not result.scalar_one_or_none():
        raise PermissionDeniedError("You are not a member of this team")

    return team


async def get_team_members(db: AsyncSession, team_id: UUID) -> list[TeamMember]:
    result = await db.execute(
        select(TeamMember)
        .where(TeamMember.team_id == team_id)
        .options(selectinload(TeamMember.user))
    )
    return list(result.scalars().all())


async def invite_member(
    db: AsyncSession, inviter_id: UUID, team_id: UUID, email: str, role: TeamRole
) -> TeamMember:
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == inviter_id)
    )
    inviter = result.scalar_one_or_none()
    if not inviter or inviter.role not in (TeamRole.OWNER, TeamRole.ADMIN):
        raise PermissionDeniedError("Only owners and admins can invite members")

    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        raise NotFoundError("User")

    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == user.id)
    )
    if result.scalar_one_or_none():
        raise ConflictError("User is already a member of this team")

    member = TeamMember(team_id=team_id, user_id=user.id, role=role)
    db.add(member)
    await db.commit()
    await db.refresh(member, attribute_names=["user"])
    return member


async def remove_member(
    db: AsyncSession, requester_id: UUID, team_id: UUID, target_user_id: UUID,
) -> None:
    # Load requester membership
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == requester_id)
    )
    requester = result.scalar_one_or_none()
    if not requester:
        raise PermissionDeniedError("You are not a member of this team")

    # Load target membership
    result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id, TeamMember.user_id == target_user_id)
    )
    target = result.scalar_one_or_none()
    if not target:
        raise NotFoundError("Member")

    is_self = requester_id == target_user_id

    if is_self:
        # Leaving: owner cannot leave (must transfer or delete team)
        if target.role == TeamRole.OWNER:
            raise PermissionDeniedError("Owner cannot leave the team. Transfer ownership first.")
    else:
        # Kicking: only owner/admin can kick, and only lower roles
        if requester.role not in (TeamRole.OWNER, TeamRole.ADMIN):
            raise PermissionDeniedError("Only owners and admins can remove members")
        if target.role == TeamRole.OWNER:
            raise PermissionDeniedError("Cannot remove the team owner")
        if target.role == TeamRole.ADMIN and requester.role != TeamRole.OWNER:
            raise PermissionDeniedError("Only the owner can remove admins")

    await db.delete(target)
    await db.commit()
