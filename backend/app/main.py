"""FastAPI application entry point."""

from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text

from app.config import get_settings
from app.db import async_session_factory
from app.middleware import ObservabilityMiddleware
from app.observability import setup_logging
from app.routers import api_router
from app.security import SecurityHeadersMiddleware, RateLimitMiddleware

settings = get_settings()
setup_logging()

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.5, environment=settings.env.value)


@asynccontextmanager
async def lifespan(app: FastAPI):
    from loguru import logger
    logger.info("Application started", env=settings.env.value)
    yield
    logger.info("Application shutting down")


app = FastAPI(title="ResuMatch API", version="1.0.0", docs_url="/docs", lifespan=lifespan)

# Middleware (order matters: first added = outermost)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(ObservabilityMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Instrumentator().instrument(app).expose(app, endpoint="/metrics")
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
