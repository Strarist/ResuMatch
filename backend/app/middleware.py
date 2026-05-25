"""Observability middleware — request tracing and metrics."""

import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

try:
    from prometheus_client import Counter, Histogram
    REQUEST_COUNT = Counter("http_requests_total", "Total HTTP requests", ["method", "path", "status"])
    REQUEST_DURATION = Histogram("http_request_duration_seconds", "HTTP request duration", ["method", "path"])
except ImportError:
    REQUEST_COUNT = None
    REQUEST_DURATION = None

from app.observability import set_request_id, log_request


class ObservabilityMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        request_id = request.headers.get("X-Request-ID") or ""
        rid = set_request_id(request_id or None)

        start = time.perf_counter()
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000

        response.headers["X-Request-ID"] = rid
        path = request.url.path

        log_request(request.method, path, response.status_code, duration_ms)

        if REQUEST_COUNT:
            REQUEST_COUNT.labels(method=request.method, path=path, status=response.status_code).inc()
        if REQUEST_DURATION:
            REQUEST_DURATION.labels(method=request.method, path=path).observe(duration_ms / 1000)

        return response
