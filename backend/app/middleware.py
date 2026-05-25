"""Observability middleware — request tracing and metrics collection.

Attaches to every request:
- Correlation ID (X-Request-ID header, generated if missing)
- Request timing
- Response status logging
- AI provider metrics via Prometheus
"""

import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from prometheus_client import Counter, Histogram

from app.observability import set_request_id, log_request

# === Prometheus Metrics ===

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_DURATION = Histogram(
    "http_request_duration_seconds",
    "HTTP request duration",
    ["method", "path"],
    buckets=[0.01, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

AI_CALL_DURATION = Histogram(
    "ai_provider_duration_seconds",
    "AI provider call duration",
    ["provider", "model", "status"],
    buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0],
)

AI_CALL_COUNT = Counter(
    "ai_provider_calls_total",
    "Total AI provider calls",
    ["provider", "model", "status"],
)

STREAM_DURATION = Histogram(
    "sse_stream_duration_seconds",
    "SSE stream duration",
    ["endpoint"],
    buckets=[1.0, 5.0, 10.0, 30.0, 60.0],
)

STREAM_COUNT = Counter(
    "sse_streams_total",
    "Total SSE streams",
    ["endpoint", "status"],
)


class ObservabilityMiddleware(BaseHTTPMiddleware):
    """Middleware that traces every request with correlation ID and timing."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Set correlation ID
        request_id = request.headers.get("X-Request-ID") or ""
        rid = set_request_id(request_id or None)

        start = time.perf_counter()

        response = await call_next(request)

        duration_ms = (time.perf_counter() - start) * 1000
        path = request.url.path

        # Add correlation ID to response
        response.headers["X-Request-ID"] = rid

        # Log and record metrics
        log_request(request.method, path, response.status_code, duration_ms)
        REQUEST_COUNT.labels(method=request.method, path=path, status=response.status_code).inc()
        REQUEST_DURATION.labels(method=request.method, path=path).observe(duration_ms / 1000)

        return response
