"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.config import get_settings
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
    logging.info("Application started")
    yield
    logging.info("Application shutting down")


app = FastAPI(title="ResuMatch API", version="1.0.0", docs_url="/docs", lifespan=lifespan)

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

if _instrumentator:
    _instrumentator.instrument(app).expose(app, endpoint="/metrics")

app.include_router(api_router)


@app.get("/")
async def root():
    return {"message": "ResuMatch API", "version": "1.0.0", "status": "running"}


@app.get("/health")
async def health_check():
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    healthy = db_status == "connected"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={"status": "healthy" if healthy else "unhealthy", "database": db_status, "version": "1.0.0"},
    )


@app.get("/health/providers")
async def health_providers():
    """Subsystem readiness check."""
    import os
    return {
        "database": "configured" if settings.database_url else "missing",
        "google_oauth": "configured" if settings.google_client_id else "not configured",
        "gemini_ai": "configured" if os.getenv("GEMINI_API_KEY") else "not configured",
        "ollama": "configured" if os.getenv("OLLAMA_URL") else "not configured",
        "sentry": "configured" if settings.sentry_dsn else "not configured",
    }
