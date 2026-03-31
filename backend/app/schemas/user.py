import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: str
    display_name: str
    created_at: datetime


class UserUpdate(BaseModel):
    display_name: str | None = Field(None, min_length=1, max_length=100)
    email: EmailStr | None = None
