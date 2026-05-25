"""FastAPI application entry point."""

import logging
from contextlib import asynccontextmanager

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from prometheus_fastapi_instrumentator import Instrumentator
from sqlalchemy import text

from app.config import get_settings
from app.db import async_session_factory
from app.routers import api_router

settings = get_settings()

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, traces_sample_rate=0.5, environment=settings.env.value)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logging.info("Application startup complete")
    yield


app = FastAPI(title="ResuMatch API", version="1.0.0", docs_url="/docs", lifespan=lifespan)

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
