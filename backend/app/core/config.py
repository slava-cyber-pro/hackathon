import secrets

from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "BudgetSphere"
    app_env: str = "development"
    debug: bool = True

    database_url: str = "postgresql+asyncpg://budgetsphere:budgetsphere_secret@db:5432/budgetsphere"

    redis_url: str = "redis://redis:6379/0"

    jwt_secret_key: str = ""
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 15
    jwt_refresh_token_expire_days: int = 7

    backend_cors_origins: list[str] = ["http://localhost:5173"]

    telegram_bot_token: str = ""

    @model_validator(mode="after")
    def validate_jwt_secret(self) -> "Settings":
        if not self.jwt_secret_key or self.jwt_secret_key in ("change-me", ""):
            if self.is_production:
                raise ValueError("JWT_SECRET_KEY must be set in production")
            self.jwt_secret_key = secrets.token_urlsafe(32)
        return self

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"


settings = Settings()
