"""FastAPI application entry point."""

import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.sessions import SessionMiddleware

from app.config import Environment, get_settings
from app.db import async_session_factory
from app.routers import api_router

# Optional: Sentry
try:
    import sentry_sdk
except ImportError:
    sentry_sdk = None

# Optional: Prometheus
try:
    from prometheus_fastapi_instrumentator import Instrumentator
    _instrumentator = Instrumentator()
except ImportError:
    _instrumentator = None

settings = get_settings()

# Optional observability setup
from app.observability import setup_logging
setup_logging()

if sentry_sdk and settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.5, environment=settings.env.value)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import all models to register them with Base.metadata
    from app.models.base import Base
    from app.db import engine
    import app.models.strategic_profile  # noqa: F401
    import app.models.strategic_memory  # noqa: F401
    import app.models.user_progress  # noqa: F401
    import app.services.intelligence.intelligence_models  # noqa: F401

    import app.services.intelligence.operational_events  # noqa: F401
    import app.services.roadmap_intel.roadmap_models  # noqa: F401
    import app.services.trajectory.models  # noqa: F401
    import app.services.workspace.models  # noqa: F401
    import app.services.portfolio.proof_engine  # noqa: F401
    import app.services.storage  # noqa: F401
    import app.services.scheduler  # noqa: F401
    import app.services.jobs  # noqa: F401

    # Create tables only in testing or explicit dev override; production uses Alembic
    async with engine.begin() as conn:
        if settings.env == Environment.testing or os.getenv("DEV_CREATE_ALL", "").lower() == "true":
            await conn.run_sync(Base.metadata.create_all)
            logging.info("Base.metadata.create_all applied (testing or DEV_CREATE_ALL)")
        await conn.execute(text("SELECT 1"))
    logging.info("Database tables verified and connection probe succeeded")

    # P2 — Database verification log (sprint requirement)
    import re as _re
    _db_url = settings.database_url
    _sanitized_url = _re.sub(r'(?<=://)[^@]+@', '***:***@', _db_url)
    _db_engine = engine.url.get_backend_name()
    logging.info(f"DATABASE_ENGINE={_db_engine}")
    logging.info(f"DATABASE_URL={_sanitized_url}")

    logging.info("Application started")
    yield
    logging.info("Application shutting down")


app = FastAPI(title="Skillyn API", version="1.0.0", docs_url="/docs", lifespan=lifespan)

# Middleware
try:
    from app.middleware import ObservabilityMiddleware
    app.add_middleware(ObservabilityMiddleware)
except ImportError:
    pass

try:
    from app.security import SecurityHeadersMiddleware, RateLimitMiddleware
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RateLimitMiddleware)
except ImportError:
    pass

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Session middleware for OAuth state (must be after CORS)
app.add_middleware(SessionMiddleware, secret_key=settings.jwt_secret, session_cookie="skillyn_session")

if _instrumentator:
    _instrumentator.instrument(app).expose(app, endpoint="/metrics")

app.include_router(api_router)


# === Global exception handlers for typed error responses ===
from app.exceptions import (
    AuthenticationError, AuthorizationError, NotFoundError,
    ConflictError, ValidationError, ExternalServiceError,
)


@app.exception_handler(AuthenticationError)
async def auth_error_handler(request: Request, exc: AuthenticationError):
    return JSONResponse(status_code=401, content={"error": "authentication_error", "detail": exc.message})


@app.exception_handler(AuthorizationError)
async def authz_error_handler(request: Request, exc: AuthorizationError):
    return JSONResponse(status_code=403, content={"error": "authorization_error", "detail": exc.message})


@app.exception_handler(NotFoundError)
async def not_found_handler(request: Request, exc: NotFoundError):
    return JSONResponse(status_code=404, content={"error": "not_found", "detail": exc.message})


@app.exception_handler(ConflictError)
async def conflict_handler(request: Request, exc: ConflictError):
    return JSONResponse(status_code=409, content={"error": "conflict", "detail": exc.message})


@app.exception_handler(ValidationError)
async def validation_handler(request: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"error": "validation_error", "detail": exc.message})


@app.exception_handler(ExternalServiceError)
async def external_service_handler(request: Request, exc: ExternalServiceError):
    return JSONResponse(status_code=502, content={"error": "external_service_error", "detail": exc.message})


@app.get("/")
async def root():
    return {"message": "Skillyn API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    from app.db import engine

    db_engine = engine.url.get_backend_name()
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    healthy = db_status == "connected"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={
            "status": "healthy" if healthy else "unhealthy",
            "database": db_status,
            "database_engine": db_engine,
            "version": "1.0.0",
        },
    )


@app.get("/health/providers")
async def health_providers():
    """Subsystem readiness check."""
    import os
    return {
        "database": "configured" if settings.database_url else "missing",
        "google_oauth": "configured" if (settings.google_client_id and settings.google_client_secret) else "not configured",
        "google_redirect_uri": settings.google_redirect_uri if settings.google_client_id else None,
        "gemini_ai": "configured" if os.getenv("GEMINI_API_KEY") else "not configured",
        "ollama": "configured" if os.getenv("OLLAMA_URL") else "not configured",
        "sentry": "configured" if settings.sentry_dsn else "not configured",
    }


@app.get("/health/auth")
async def health_auth():
    """Auth subsystem readiness."""
    return {
        "jwt": "configured" if settings.jwt_secret else "missing",
        "jwt_algorithm": settings.jwt_algorithm,
        "access_token_expiry_minutes": settings.jwt_access_expire_minutes,
        "refresh_token_expiry_minutes": settings.jwt_refresh_expire_minutes,
    }


@app.get("/health/oauth")
async def health_oauth():
    """OAuth provider readiness."""
    google_ready = bool(settings.google_client_id and settings.google_client_secret)
    return {
        "google": {
            "status": "ready" if google_ready else "not_configured",
            "client_id_set": bool(settings.google_client_id),
            "client_secret_set": bool(settings.google_client_secret),
            "redirect_uri": settings.google_redirect_uri if google_ready else None,
        },
    }
