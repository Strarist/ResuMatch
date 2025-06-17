from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import time
import json
import asyncio
from typing import Dict, Any

from app.api.v1.api import api_router
from app.core.config import settings
from app.core.middleware import RateLimitMiddleware, RequestLoggingMiddleware
from app.core.metrics import metrics_endpoint, metrics_middleware, update_system_metrics
from app.core.websocket import manager as ws_manager
from app.core.logging import setup_logging, log_api_request, log_api_error
from app.db.session import SessionLocal

# Setup logging
setup_logging(
    log_level=settings.LOG_LEVEL,
    log_file=settings.LOG_FILE,
    max_file_size=settings.LOG_MAX_FILE_SIZE,
    backup_count=settings.LOG_BACKUP_COUNT
)

# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="ResuMatch AI - AI-powered resume and job matching platform",
    version="1.0.0",
    docs_url=None,  # Disable default docs
    redoc_url=None,  # Disable default redoc
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add rate limiting middleware
app.add_middleware(
    RateLimitMiddleware,
    requests_per_minute=settings.RATE_LIMIT_REQUESTS_PER_MINUTE,
    burst_size=settings.RATE_LIMIT_BURST_SIZE
)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

# Add metrics middleware
app.middleware("http")(metrics_middleware())

# Include API router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Add metrics endpoint
app.add_route("/metrics", metrics_endpoint)

# Add WebSocket manager startup/shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    # Connect WebSocket manager to Redis
    await ws_manager.connect()
    
    # Start system metrics collection
    asyncio.create_task(collect_system_metrics())

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    # Disconnect WebSocket manager
    await ws_manager.disconnect()

async def collect_system_metrics():
    """Collect system metrics periodically"""
    while True:
        try:
            update_system_metrics()
            # Update DB metrics
            db = SessionLocal()
            try:
                update_db_metrics(db)
            finally:
                db.close()
        except Exception as e:
            log_api_error("error", f"Error collecting metrics: {str(e)}")
        await asyncio.sleep(15)  # Collect every 15 seconds

# Custom exception handlers
@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handle HTTP exceptions"""
    log_api_error(
        "error",
        f"HTTP error: {exc.detail}",
        {
            "status_code": exc.status_code,
            "path": request.url.path,
            "method": request.method
        }
    )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
                "type": "http_error"
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors"""
    log_api_error(
        "error",
        "Validation error",
        {
            "errors": exc.errors(),
            "path": request.url.path,
            "method": request.method
        }
    )
    return JSONResponse(
        status_code=422,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation error",
                "type": "validation_error",
                "details": exc.errors()
            }
        }
    )

# Custom OpenAPI schema
def custom_openapi():
    """Generate custom OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema
        
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "Enter JWT token in format: Bearer <token>"
        }
    }
    
    # Add security requirement to all operations
    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"bearerAuth": []}]
            
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Custom documentation endpoints
@app.get("/docs", include_in_schema=False)
async def custom_swagger_ui_html():
    """Custom Swagger UI endpoint"""
    return get_swagger_ui_html(
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        title=f"{app.title} - Swagger UI",
        oauth2_redirect_url=app.swagger_ui_oauth2_redirect_url,
        swagger_js_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui-bundle.js",
        swagger_css_url="https://cdn.jsdelivr.net/npm/swagger-ui-dist@4/swagger-ui.css",
    )

@app.get("/redoc", include_in_schema=False)
async def custom_redoc_html():
    """Custom ReDoc endpoint"""
    return get_redoc_html(
        openapi_url=f"{settings.API_V1_STR}/openapi.json",
        title=f"{app.title} - ReDoc",
        redoc_js_url="https://cdn.jsdelivr.net/npm/redoc@next/bundles/redoc.standalone.js",
    ) 