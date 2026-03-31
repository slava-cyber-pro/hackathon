import uuid

from pydantic import BaseModel, ConfigDict, Field


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    icon: str | None
    is_default: bool


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    icon: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    icon: str | None = None
