from fastapi import APIRouter, Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.api.deps import DB
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse
from app.services import auth_service

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
@limiter.limit("30/minute")
async def register(request: Request, body: RegisterRequest, db: DB) -> TokenResponse:
    user = await auth_service.register(db, body.email, body.password, body.display_name)
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest, db: DB) -> TokenResponse:
    user = await auth_service.authenticate(db, body.email, body.password)
    return TokenResponse(
        access_token=create_access_token(str(user.id)),
        refresh_token=create_refresh_token(str(user.id)),
    )


@router.post("/refresh", response_model=TokenResponse)
@limiter.limit("20/minute")
async def refresh(request: Request, body: RefreshRequest, db: DB) -> TokenResponse:
    access_token, refresh_token = await auth_service.refresh_tokens(db, body.refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)
