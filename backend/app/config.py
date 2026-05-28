"""Centralized application configuration.

Single source of truth for all environment-dependent values.
Validates at import time — the app refuses to start with invalid config.
"""

from enum import Enum
from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve .env relative to the backend root (parent of app/)
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_ENV_FILE = _BACKEND_DIR / ".env"


class Environment(str, Enum):
    development = "development"
    testing = "testing"
    production = "production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )

    # === Environment ===
    env: Environment = Field(default=Environment.development, alias="ENV")

    # === Database (required) ===
    database_url: str = Field(..., alias="DATABASE_URL")

    # === JWT (required) ===
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_expire_minutes: int = Field(default=10080, alias="JWT_ACCESS_EXPIRE_MINUTES")  # 7 days
    jwt_refresh_expire_minutes: int = Field(default=43200, alias="JWT_REFRESH_EXPIRE_MINUTES")  # 30 days

    # === OAuth (optional) ===
    google_client_id: str | None = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: str | None = Field(default=None, alias="GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = Field(
        default="http://localhost:8000/v1/auth/google/callback",
        alias="GOOGLE_REDIRECT_URI",
    )

    # === Application ===
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        alias="CORS_ORIGINS",
    )

    # === Observability ===
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_dir: str = Field(default="logs", alias="LOG_DIR")

    # === Redis (optional) ===
    redis_url: str | None = Field(default=None, alias="REDIS_URL")

    # === OpenRouter (required) ===
    openrouter_api_key: str = Field(..., alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="meta-llama/llama-3.1-8b-instruct:free", alias="OPENROUTER_MODEL")

    # === Validators ===

    @field_validator("openrouter_api_key")
    @classmethod
    def openrouter_api_key_not_placeholder(cls, v: str) -> str:
        if not v or v.strip() in ("", "placeholder", "your-openrouter-key", "sk-or-v1-your-key-here"):
            raise ValueError("OPENROUTER_API_KEY must be a valid OpenRouter API key, not a placeholder")
        return v.strip()

    @field_validator("jwt_secret")
    @classmethod
    def jwt_secret_not_placeholder(cls, v: str) -> str:
        if v in ("changeme", "secret", "test", "generate-a-strong-random-secret-here"):
            raise ValueError("JWT_SECRET must be a real secret, not a placeholder")
        if len(v) < 16:
            raise ValueError("JWT_SECRET must be at least 16 characters")
        return v

    @field_validator("database_url")
    @classmethod
    def database_url_valid(cls, v: str) -> str:
        if not v.startswith(("postgresql", "sqlite")):
            raise ValueError("DATABASE_URL must be a PostgreSQL or SQLite connection string")
        return v

    @property
    def is_production(self) -> bool:
        return self.env == Environment.production

    @property
    def is_testing(self) -> bool:
        return self.env == Environment.testing


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached Settings instance. Validates on first call.

    Raises pydantic.ValidationError with field-level messages if config is invalid.
    This crashes the app at startup — which is the correct behavior.
    """
    return Settings()  # type: ignore[call-arg]
