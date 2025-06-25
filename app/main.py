from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import sentry_sdk
import os
from .api_v1 import router as api_v1_router
from fastapi_limiter import FastAPILimiter
import redis.asyncio as aioredis
from fastapi.responses import JSONResponse
from starlette.status import HTTP_429_TOO_MANY_REQUESTS
import logging
from datetime import datetime, UTC
from fastapi_limiter.depends import RateLimiter
from contextlib import asynccontextmanager

# Sentry setup
SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        traces_sample_rate=0.5,
        environment=os.getenv("ENV", "development"),
    )

@asynccontextmanager
async def lifespan(app: FastAPI):
    redis = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"), encoding="utf-8", decode_responses=True)
    await FastAPILimiter.init(redis)
    yield

app = FastAPI(
    title="ResuMatch API",
    version="1.0.0",
    openapi_url="/v1/openapi.json",
    docs_url="/v1/docs",
    redoc_url="/v1/redoc",
    dependencies=[Depends(RateLimiter(times=1000, seconds=3600))],
    lifespan=lifespan
)

# CORS best practice: allow only frontend origin in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(api_v1_router)

@app.get("/v1/healthz", tags=["Health"])
def health_check():
    return {"status": "ok"}

@app.exception_handler(HTTP_429_TOO_MANY_REQUESTS)
async def rate_limit_exceeded_handler(request: Request, exc):
    ip = request.client.host
    endpoint = request.url.path
    method = request.method
    now = datetime.now(UTC).isoformat()
    logging.warning(f"[RATE LIMIT] 429 - IP: {ip} - Endpoint: {endpoint} - Method: {method} - Time: {now}")
    return JSONResponse(
        status_code=429,
        content={"error": "Too many requests. Please try again later."},
        headers={"Retry-After": "60"}
    ) 