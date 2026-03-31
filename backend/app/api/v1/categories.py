import uuid

from fastapi import APIRouter, status

from app.api.deps import DB, CurrentUser
from app.schemas.category import CategoryCreate, CategoryResponse
from app.services import category_service

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=list[CategoryResponse])
async def list_categories(db: DB, user: CurrentUser) -> list[CategoryResponse]:
    categories = await category_service.get_categories(db, user.id)
    return [CategoryResponse.model_validate(c) for c in categories]


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(db: DB, user: CurrentUser, data: CategoryCreate) -> CategoryResponse:
    category = await category_service.create_category(db, user.id, data.name, data.icon)
    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(db: DB, user: CurrentUser, category_id: uuid.UUID) -> None:
    await category_service.delete_category(db, user.id, category_id)
