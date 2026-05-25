"""Centralized application configuration.

Single source of truth for all environment-dependent values.
Validates at import time — the app refuses to start with invalid config.
"""

from enum import Enum
from functools import lru_cache

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Environment(str, Enum):
    development = "development"
    testing = "testing"
    production = "production"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=None,  # Never read .env files — env vars only
        extra="ignore",
        populate_by_name=True,
    )

    # === Environment ===
    env: Environment = Field(default=Environment.development, alias="ENV")

    # === Database (required) ===
    database_url: str = Field(..., alias="DATABASE_URL")

    # === Redis ===
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")

    # === JWT (required) ===
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_access_expire_minutes: int = Field(default=10080, alias="JWT_ACCESS_EXPIRE_MINUTES")  # 7 days
    jwt_refresh_expire_minutes: int = Field(default=43200, alias="JWT_REFRESH_EXPIRE_MINUTES")  # 30 days

    # === OAuth (optional) ===
    google_client_id: str | None = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: str | None = Field(default=None, alias="GOOGLE_CLIENT_SECRET")
    oauth_redirect_uri: str = Field(default="http://localhost:3000/auth/callback", alias="OAUTH_REDIRECT_URI")

    # === Application ===
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    cors_origins: list[str] = Field(
        default=["http://localhost:3000"],
        alias="CORS_ORIGINS",
    )

    # === Celery ===
    celery_broker_url: str = Field(default="redis://localhost:6379/0", alias="CELERY_BROKER_URL")
    celery_result_backend: str = Field(default="redis://localhost:6379/0", alias="CELERY_RESULT_BACKEND")

    # === Observability ===
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    log_dir: str = Field(default="logs", alias="LOG_DIR")

    # === Validators ===

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
