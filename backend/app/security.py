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


# === In-Memory Rate Governance ===
# Simple sliding-window counter. Sufficient for single-process deployment.
# For multi-process: upgrade to PostgreSQL-backed or Redis-backed.

class RateGovernor:
    """Per-IP sliding window rate limiter. No external dependencies."""

    def __init__(self):
        self._windows: dict[str, list[float]] = defaultdict(list)
        self._last_stream_requests: dict[str, float] = {}

    def check(self, key: str, limit: int, window_seconds: int) -> bool:
        """Returns True if request is allowed, False if rate-limited."""
        now = time.time()
        cutoff = now - window_seconds
        # Prune old entries
        valid_times = [t for t in self._windows.get(key, []) if t > cutoff]

        if len(valid_times) >= limit:
            self._windows[key] = valid_times
            return False

        valid_times.append(now)
        self._windows[key] = valid_times

        # Memory leak protection
        if len(valid_times) == 1:
            # If it's a new entry (or only 1 valid), check global size
            if len(self._windows) > 10000:
                self._windows.clear()

        return True

    def check_stream_transport(self, client_ip: str, query_params: dict) -> bool:
        """Transport-aware stream throttling to allow reconnect recovery while preventing storms."""
        now = time.time()
        session_id = query_params.get("session_id", [""])[0]
        stream_instance_id = query_params.get("stream_instance_id", [""])[0]
        cooldown_state = query_params.get("cooldown_state", [""])[0]

        # Use session_id if available, fallback to client_ip
        track_key = session_id if session_id else client_ip

        # 1. Enforce minimum request spacing (prevent tight-loop reconnect storms)
        last_time = self._last_stream_requests.get(track_key, 0.0)
        if now - last_time < 1.0:
            return False

        self._last_stream_requests[track_key] = now

        # 2. Allow reconnect recovery unless it is obvious abuse
        limit_key = f"{track_key}:stream_transport"
        cutoff = now - 60
        valid_times = [t for t in self._windows.get(limit_key, []) if t > cutoff]

        # If in cooldown_state, we are more strict (e.g. limit to 10 per 60s)
        max_limit = 10 if cooldown_state == "true" else 30

        if len(valid_times) >= max_limit:
            self._windows[limit_key] = valid_times
            return False

        valid_times.append(now)
        self._windows[limit_key] = valid_times
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


def get_rate_category(path: str, method: str) -> str:
    if "/auth/login" in path or "/auth/register" in path:
        return "auth"
    if "/resumes" in path and method == "POST":
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

class SecurityHeadersMiddleware:
    """Add security headers to all responses. Native ASGI middleware to prevent deadlocks."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def send_wrapper(message):
            if message["type"] == "http.response.start":
                headers = message.setdefault("headers", [])
                headers.append((b"x-content-type-options", b"nosniff"))
                headers.append((b"x-frame-options", b"DENY"))
                headers.append((b"x-xss-protection", b"0"))
                headers.append((b"referrer-policy", b"strict-origin-when-cross-origin"))
                headers.append((b"permissions-policy", b"camera=(), microphone=(), geolocation=()"))
            await send(message)

        await self.app(scope, receive, send_wrapper)


# === Rate Limit Middleware ===

def get_client_ip(scope) -> str:
    headers = dict(scope.get("headers", []))
    if b"x-forwarded-for" in headers:
        return headers[b"x-forwarded-for"].decode("utf-8").split(",")[0].strip()
    if b"x-real-ip" in headers:
        return headers[b"x-real-ip"].decode("utf-8").strip()
    client = scope.get("client")
    if client and client[0]:
        return client[0]
    return "unknown"


class RateLimitMiddleware:
    """Apply rate limits based on client IP and endpoint category. Native ASGI middleware."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        path = scope.get("path", "")
        # Skip health checks and metrics
        if path in ("/health", "/metrics", "/"):
            return await self.app(scope, receive, send)

        client_ip = get_client_ip(scope)
        method = scope.get("method", "")
        category = get_rate_category(path, method)

        if category == "stream":
            from urllib.parse import parse_qs
            query_string = scope.get("query_string", b"").decode("utf-8")
            query_params = parse_qs(query_string)
            if not _governor.check_stream_transport(client_ip, query_params):
                response = Response(
                    content='{"error":"SSE connection storm detected. Throttled."}',
                    status_code=429,
                    media_type="application/json",
                    headers={"Retry-After": "2"},
                )
                await response(scope, receive, send)
                return
        else:
            limit, window = RATE_LIMITS[category]
            key = f"{client_ip}:{category}"
            if not _governor.check(key, limit, window):
                response = Response(
                    content='{"error":"Rate limit exceeded. Try again later."}',
                    status_code=429,
                    media_type="application/json",
                    headers={"Retry-After": str(window)},
                )
                await response(scope, receive, send)
                return

        await self.app(scope, receive, send)
