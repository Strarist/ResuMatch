"""FastAPI application entry point."""

import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, UTC

import redis.asyncio as aioredis
import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text
from starlette.status import HTTP_429_TOO_MANY_REQUESTS

from app.db import get_db, AsyncSessionLocal
from app.routers import api_router

# Sentry
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(dsn=SENTRY_DSN, traces_sample_rate=0.5, environment=os.getenv("ENV", "development"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    try:
        redis = await aioredis.from_url(redis_url, encoding="utf-8", decode_responses=True)
        await FastAPILimiter.init(redis)
    except Exception as e:
        logging.warning(f"Redis connection failed: {e}")
    yield


app = FastAPI(
    title="ResuMatch API",
    version="1.0.0",
    docs_url="/docs",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://resu-match-one.vercel.app", "http://localhost:3000"],
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
    """Health check with async DB verification."""
    try:
        async with AsyncSessionLocal() as session:
            await session.execute(text("SELECT 1"))
            db_status = "connected"
    except Exception as e:
        db_status = f"error: {e}"

    healthy = db_status == "connected"
    return JSONResponse(
        status_code=200 if healthy else 503,
        content={"status": "healthy" if healthy else "unhealthy", "database": db_status, "version": "1.0.0"},
    )


@app.exception_handler(HTTP_429_TOO_MANY_REQUESTS)
async def rate_limit_handler(request: Request, exc):
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Please try again later."},
        headers={"Retry-After": "60"},
    )
