"""Application settings with strict validation.

All configuration is loaded from environment variables.
Missing required variables cause immediate startup failure.
"""

from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    # Database (required — no default)
    database_url: str = Field(..., alias="DATABASE_URL")

    # Redis
    redis_url: str = Field(default="redis://localhost:6379", alias="REDIS_URL")

    # JWT (required — no default)
    jwt_secret: str = Field(..., alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")

    # OAuth (optional — app works without OAuth)
    google_client_id: str | None = Field(default=None, alias="GOOGLE_CLIENT_ID")
    google_client_secret: str | None = Field(default=None, alias="GOOGLE_CLIENT_SECRET")
    oauth_redirect_uri: str = Field(
        default="http://localhost:3000/auth/callback", alias="OAUTH_REDIRECT_URI"
    )

    # Application
    frontend_url: str = Field(default="http://localhost:3000", alias="FRONTEND_URL")
    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    env: str = Field(default="development", alias="ENV")

    # Observability (optional)
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")

    model_config = {"env_file": None, "extra": "ignore"}


def get_settings() -> Settings:
    """Load and validate settings from environment variables.

    Raises ValidationError with clear messages if required vars are missing.
    """
    return Settings()  # type: ignore[call-arg]
