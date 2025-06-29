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
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import time
from typing import Optional
from .db import get_db, engine
from .models import Base

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
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    dependencies=[Depends(RateLimiter(times=1000, seconds=3600))],
    lifespan=lifespan
)

# CORS configuration - allow all origins for now, can be restricted later
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app, endpoint="/metrics")

app.include_router(api_v1_router)

# Security
security = HTTPBearer()

@app.get("/")
async def root():
    return {
        "message": "ResuMatch API",
        "version": "1.0.0",
        "status": "running",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring and deployment validation"""
    try:
        # Check if database URL is configured
        database_url = os.getenv("DATABASE_URL")
        if not database_url:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "unhealthy",
                    "timestamp": datetime.utcnow().isoformat(),
                    "version": "1.0.0",
                    "error": "DATABASE_URL not configured",
                    "database": "not configured"
                }
            )
        
        # Try database connection
        try:
            db = next(get_db())
            db.execute("SELECT 1")
            db.close()
            db_status = "connected"
        except Exception as db_error:
            db_status = f"error: {str(db_error)}"
        
        return {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "1.0.0",
            "database": db_status,
            "uptime": time.time()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "timestamp": datetime.utcnow().isoformat(),
                "version": "1.0.0",
                "error": str(e),
                "database": "unknown"
            }
        )

@app.get("/ready")
async def readiness_check():
    """Readiness check for Kubernetes/container orchestration"""
    try:
        # Check environment variables
        required_env_vars = [
            "DATABASE_URL",
            "JWT_SECRET",
            "JWT_ALGORITHM"
        ]
        
        missing_vars = [var for var in required_env_vars if not os.getenv(var)]
        
        if missing_vars:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "not ready",
                    "missing_environment_variables": missing_vars
                }
            )
        
        # Try database connection
        try:
            db = next(get_db())
            db.execute("SELECT 1")
            db.close()
        except Exception as e:
            return JSONResponse(
                status_code=503,
                content={
                    "status": "not ready",
                    "error": f"Database connection failed: {str(e)}"
                }
            )
        
        return {
            "status": "ready",
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "not ready",
                "error": str(e)
            }
        )

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