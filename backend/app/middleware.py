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


class ObservabilityMiddleware:
    """Native ASGI observability middleware."""
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        headers = dict(scope.get("headers", []))
        request_id = headers.get(b"x-request-id", b"").decode("utf-8")
        rid = set_request_id(request_id or None)

        start = time.perf_counter()
        status_code = 500

        async def send_wrapper(message):
            nonlocal status_code
            if message["type"] == "http.response.start":
                status_code = message.get("status", 200)
                res_headers = message.setdefault("headers", [])
                res_headers.append((b"x-request-id", rid.encode("utf-8")))
            await send(message)

        try:
            await self.app(scope, receive, send_wrapper)
        finally:
            duration_ms = (time.perf_counter() - start) * 1000
            path = scope.get("path", "")
            method = scope.get("method", "GET")

            log_request(method, path, status_code, duration_ms)

            if REQUEST_COUNT:
                REQUEST_COUNT.labels(method=method, path=path, status=status_code).inc()
            if REQUEST_DURATION:
                REQUEST_DURATION.labels(method=method, path=path).observe(duration_ms / 1000)
