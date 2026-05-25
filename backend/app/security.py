"""Security hardening module.

Provides:
- In-memory rate governance (no Redis needed)
- Prompt injection detection
- Security response headers
- AI output sanitization
"""

import time
from collections import defaultdict
from functools import wraps
from typing import Any

from fastapi import HTTPException, Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint


# === In-Memory Rate Governance ===
# Simple sliding-window counter. Sufficient for single-process deployment.
# For multi-process: upgrade to PostgreSQL-backed or Redis-backed.

class RateGovernor:
    """Per-IP sliding window rate limiter. No external dependencies."""

    def __init__(self):
        self._windows: dict[str, list[float]] = defaultdict(list)

    def check(self, key: str, limit: int, window_seconds: int) -> bool:
        """Returns True if request is allowed, False if rate-limited."""
        now = time.time()
        cutoff = now - window_seconds
        # Prune old entries
        self._windows[key] = [t for t in self._windows[key] if t > cutoff]
        if len(self._windows[key]) >= limit:
            return False
        self._windows[key].append(now)
        return True


_governor = RateGovernor()

# Rate limits per endpoint category
RATE_LIMITS = {
    "auth": (10, 60),       # 10 requests per 60s (login/register)
    "upload": (5, 60),      # 5 uploads per 60s
    "analyze": (10, 60),    # 10 analyses per 60s
    "stream": (5, 60),      # 5 concurrent streams per 60s
    "default": (60, 60),    # 60 requests per 60s general
}


def get_rate_category(path: str) -> str:
    if "/auth/login" in path or "/auth/register" in path:
        return "auth"
    if "/resumes" in path and "POST" in path:
        return "upload"
    if "/analyze" in path:
        return "analyze"
    if "/stream" in path:
        return "stream"
    return "default"


# === Prompt Injection Detection ===

_INJECTION_PATTERNS = [
    "ignore previous instructions",
    "ignore all previous",
    "disregard your instructions",
    "you are now",
    "new instructions:",
    "system prompt:",
    "reveal your prompt",
    "what is your system prompt",
    "repeat the above",
    "ignore the above",
]


def detect_prompt_injection(text: str) -> bool:
    """Check if text contains common prompt injection patterns."""
    lower = text.lower()
    return any(pattern in lower for pattern in _INJECTION_PATTERNS)


def sanitize_ai_output(text: str) -> str:
    """Remove potential system prompt leakage from AI output."""
    # Remove anything that looks like system instructions leaked
    lines = text.split("\n")
    sanitized = []
    for line in lines:
        lower = line.lower().strip()
        if lower.startswith("system:") or lower.startswith("instructions:"):
            continue
        sanitized.append(line)
    return "\n".join(sanitized)


# === Security Headers Middleware ===

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "0"  # Disabled in favor of CSP
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=()"

        # Don't set CSP on API responses (frontend handles its own CSP)
        # Don't set HSTS (let the reverse proxy/CDN handle it)

        return response


# === Rate Limit Middleware ===

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Apply rate limits based on client IP and endpoint category."""

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # Skip health checks and metrics
        if request.url.path in ("/health", "/metrics", "/"):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        category = get_rate_category(request.url.path)
        limit, window = RATE_LIMITS[category]

        key = f"{client_ip}:{category}"
        if not _governor.check(key, limit, window):
            return Response(
                content='{"error":"Rate limit exceeded. Try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(window)},
            )

        return await call_next(request)
