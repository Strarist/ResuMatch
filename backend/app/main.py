from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from typing import Dict, Any, Sequence
import logging
import asyncio
import time
from sqlalchemy import text
from app.core.config import settings
from app.api.v1.api import api_router
from app.db.init_db import init_db
from app.db.session import engine
import app.models  # <-- Add this line before init_db()
from starlette.middleware.sessions import SessionMiddleware
import os
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

async def wait_for_db(max_retries: int = 30, delay: float = 2.0) -> None:
    """Wait for database to be ready"""
    for attempt in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection successful")
            return
        except Exception as e:
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                await asyncio.sleep(delay)
            else:
                raise Exception(f"Database connection failed after {max_retries} attempts")

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting up application...")
    
    try:
        # Wait for database to be ready
        await wait_for_db()
        
        # Initialize database
        init_db()
        logger.info("Database initialized successfully")
        
    except Exception as e:
        logger.error(f"Startup failed: {e}")
        raise
    
    logger.info("Application startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="ResuMatchAI - AI-powered resume and job matching platform",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# --- Custom Middleware Classes ---
class LogRequestsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        logger.info(f"Request: {request.method} {request.url}")
        response = await call_next(request)
        logger.info(f"Response: {response.status_code}")
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response

class HandleValidationErrorsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        try:
            response = await call_next(request)
            return response
        except ValueError as e:
            logger.error(f"Validation error: {str(e)}")
            return JSONResponse(
                status_code=422,
                content={
                    "error": {
                        "code": 422,
                        "message": str(e)
                    }
                }
            )

# --- Add Middleware ---
# Add SessionMiddleware for OAuth FIRST
SESSION_SECRET_KEY = os.getenv('SESSION_SECRET_KEY', 'dev-secret-key-change-me')
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET_KEY)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Set up trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"]  # Simplified for development
)

# Add custom middleware
app.add_middleware(LogRequestsMiddleware)
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(HandleValidationErrorsMiddleware)

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint"""
    return {"message": "Welcome to ResuMatchAI API"}

@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {"status": "healthy"}

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTP exceptions"""
    logger.error(f"HTTP error: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions"""
    logger.error(f"Unexpected error: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error"
            }
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    ) 