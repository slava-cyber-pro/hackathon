from fastapi import APIRouter

from app.api.deps import DB, CurrentUser
from app.schemas.user import UserResponse, UserUpdate
from app.services import user_service

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(user: CurrentUser) -> UserResponse:
    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
async def update_me(db: DB, user: CurrentUser, data: UserUpdate) -> UserResponse:
    updated = await user_service.update_user(db, user, data)
    return UserResponse.model_validate(updated)
