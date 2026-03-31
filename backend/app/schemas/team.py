from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.models.team import TeamRole


class TeamCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class TeamResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: UUID
    name: str
    created_by: UUID
    created_at: datetime


class TeamMemberResponse(BaseModel):
    user_id: UUID
    role: TeamRole
    joined_at: datetime
    display_name: str
    email: str


class InviteRequest(BaseModel):
    email: EmailStr
    role: TeamRole = TeamRole.MEMBER
