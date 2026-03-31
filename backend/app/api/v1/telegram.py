import secrets

from fastapi import APIRouter

from app.api.deps import DB, CurrentUser
from app.core.redis import redis_client
from app.models.user import User
from app.schemas.user import UserResponse

router = APIRouter(prefix="/telegram", tags=["telegram"])

LINK_TOKEN_TTL = 600  # 10 minutes


@router.post("/generate-link-token")
async def generate_link_token(user: CurrentUser) -> dict:
    token = secrets.token_urlsafe(32)
    await redis_client.setex(f"tg_link:{token}", LINK_TOKEN_TTL, str(user.id))
    return {"token": token, "expires_in": LINK_TOKEN_TTL}


@router.delete("/unlink", status_code=204)
async def unlink_telegram(db: DB, user: CurrentUser) -> None:
    user.telegram_chat_id = None
    db.add(user)
    await db.flush()


@router.get("/status")
async def telegram_status(user: CurrentUser) -> dict:
    return {
        "linked": user.telegram_chat_id is not None,
        "chat_id": user.telegram_chat_id,
    }
