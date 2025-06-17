from fastapi import Request, Response
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import JSONResponse
from datetime import datetime, timedelta
from typing import Dict, Tuple, Optional
import time
import asyncio
from app.core.logging import log_api_request, log_api_error
from app.schemas.common import ErrorResponse, ErrorDetail, ErrorCodes
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Middleware for rate limiting API requests"""
    
    def __init__(
        self,
        app,
        requests_per_minute: int = 60,
        burst_size: int = 10
    ):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.burst_size = burst_size
        self.rate_limit_window = 60  # seconds
        self.request_history: Dict[str, list] = {}
        self.lock = asyncio.Lock()
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        # Skip rate limiting for certain paths
        if request.url.path in ["/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Get client identifier (IP or user ID if authenticated)
        client_id = request.headers.get("X-User-ID") or request.client.host
        
        async with self.lock:
            # Clean up old requests
            current_time = time.time()
            if client_id in self.request_history:
                self.request_history[client_id] = [
                    t for t in self.request_history[client_id]
                    if current_time - t < self.rate_limit_window
                ]
            
            # Check rate limit
            if client_id in self.request_history:
                request_count = len(self.request_history[client_id])
                if request_count >= self.requests_per_minute:
                    # Check burst limit
                    recent_requests = [
                        t for t in self.request_history[client_id]
                        if current_time - t < 1  # Last second
                    ]
                    if len(recent_requests) >= self.burst_size:
                        error_response = ErrorResponse(
                            error=ErrorDetail(
                                code=ErrorCodes.RATE_LIMIT_EXCEEDED,
                                message="Rate limit exceeded. Please try again later.",
                                details={
                                    "retry_after": self.rate_limit_window,
                                    "limit": self.requests_per_minute,
                                    "window": self.rate_limit_window
                                }
                            )
                        )
                        return JSONResponse(
                            status_code=429,
                            content=error_response.model_dump()
                        )
            
            # Add current request to history
            if client_id not in self.request_history:
                self.request_history[client_id] = []
            self.request_history[client_id].append(current_time)
        
        # Process request
        start_time = time.time()
        try:
            response = await call_next(request)
            duration = (time.time() - start_time) * 1000  # Convert to milliseconds
            
            # Log request
            log_api_request(
                logger,
                method=request.method,
                path=request.url.path,
                status_code=response.status_code,
                duration_ms=duration,
                user_id=request.headers.get("X-User-ID"),
                client_ip=request.client.host
            )
            
            return response
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            
            # Log error
            log_api_error(
                logger,
                method=request.method,
                path=request.url.path,
                status_code=500,
                error_code=ErrorCodes.SERVER_ERROR,
                error_message=str(e),
                user_id=request.headers.get("X-User-ID"),
                client_ip=request.client.host,
                exception=str(e)
            )
            
            error_response = ErrorResponse(
                error=ErrorDetail(
                    code=ErrorCodes.SERVER_ERROR,
                    message="Internal server error",
                    details={"error": str(e)}
                )
            )
            return JSONResponse(
                status_code=500,
                content=error_response.model_dump()
            )


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for logging request details"""
    
    async def dispatch(
        self,
        request: Request,
        call_next: RequestResponseEndpoint
    ) -> Response:
        # Add request ID to headers
        request_id = request.headers.get("X-Request-ID") or str(time.time_ns())
        request.state.request_id = request_id
        
        # Process request
        start_time = time.time()
        try:
            response = await call_next(request)
            duration = (time.time() - start_time) * 1000
            
            # Add response headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{duration:.2f}ms"
            
            return response
            
        except Exception as e:
            duration = (time.time() - start_time) * 1000
            
            # Log error with request ID
            log_api_error(
                logger,
                method=request.method,
                path=request.url.path,
                status_code=500,
                error_code=ErrorCodes.SERVER_ERROR,
                error_message=str(e),
                request_id=request_id,
                duration_ms=duration
            )
            
            error_response = ErrorResponse(
                error=ErrorDetail(
                    code=ErrorCodes.SERVER_ERROR,
                    message="Internal server error",
                    details={
                        "request_id": request_id,
                        "error": str(e)
                    }
                )
            )
            return JSONResponse(
                status_code=500,
                content=error_response.model_dump()
            ) 