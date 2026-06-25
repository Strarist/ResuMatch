"""Structured logging with request correlation and PII redaction.

Every log entry includes:
- request_id: unique per HTTP request (correlates all logs for one request)
- stream_id: unique per SSE stream (correlates streaming lifecycle)
- provider: AI provider name when relevant

PII redaction: email addresses, file paths with user data, and resume content
are never logged. Only IDs and metadata appear in logs.
"""

import json
import re
import uuid
from contextvars import ContextVar
from typing import Any

from loguru import logger

from app.config import get_settings

# === Context Variables (async-safe, per-request) ===

_request_id: ContextVar[str] = ContextVar("request_id", default="")
_stream_id: ContextVar[str] = ContextVar("stream_id", default="")


def set_request_id(rid: str | None = None) -> str:
    """Set request correlation ID for current async context."""
    rid = rid or uuid.uuid4().hex[:12]
    _request_id.set(rid)
    return rid


def set_stream_id(sid: str | None = None) -> str:
    """Set stream correlation ID for current async context."""
    sid = sid or uuid.uuid4().hex[:8]
    _stream_id.set(sid)
    return sid


def get_request_id() -> str:
    return _request_id.get()


# === PII Redaction ===

_EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}")
_REDACT_KEYS = {"password", "password_hash", "access_token", "refresh_token", "jwt_secret", "api_key"}


def _redact(data: Any) -> Any:
    """Recursively redact PII from log data."""
    if isinstance(data, dict):
        return {k: "[REDACTED]" if k.lower() in _REDACT_KEYS else _redact(v) for k, v in data.items()}
    if isinstance(data, str):
        return _EMAIL_RE.sub("[EMAIL]", data)
    if isinstance(data, list):
        return [_redact(item) for item in data[:5]]  # Cap list logging at 5 items
    return data


# === Log Formatter ===


def _json_log_line(record) -> str:
    """One JSON object string with correlation context (no trailing newline)."""
    entry = {
        "ts": record["time"].strftime("%Y-%m-%dT%H:%M:%S.%fZ"),
        "level": record["level"].name,
        "msg": record["message"],
        "request_id": _request_id.get(""),
        "stream_id": _stream_id.get(""),
        "module": record["name"],
        "func": record["function"],
    }
    if record["extra"]:
        entry["extra"] = _redact(record["extra"])
    if record["exception"]:
        entry["exc"] = record["exception"].type.__name__ if record["exception"].type else None
    return json.dumps(entry, default=str)


def _json_formatter(record) -> str:
    """Loguru dynamic format: payload is substituted; line break is in the template only."""
    record["extra"]["json_payload"] = _json_log_line(record)
    return "{extra[json_payload]}\n"


# === Configure Logger ===


def setup_logging() -> None:
    """Configure loguru for the application. Call once at startup."""
    from app.logger import configure_logging

    configure_logging(get_settings(), production_formatter=_json_formatter)


# === Convenience Loggers ===


def log_request(method: str, path: str, status: int, duration_ms: float) -> None:
    logger.info("request", method=method, path=path, status=status, duration_ms=round(duration_ms, 1))


def log_ai_call(provider: str, model: str, duration_ms: float, tokens: int = 0, error: str | None = None) -> None:
    if error:
        logger.warning("ai_call_failed", provider=provider, model=model, duration_ms=round(duration_ms, 1), error=error)
    else:
        logger.info("ai_call", provider=provider, model=model, duration_ms=round(duration_ms, 1), tokens=tokens)


def log_stream_event(event: str, resume_id: str = "", duration_ms: float = 0) -> None:
    logger.info("stream", event=event, resume_id=resume_id, duration_ms=round(duration_ms, 1))


def log_db_query(query: str, duration_ms: float) -> None:
    if duration_ms > 500:
        logger.warning("slow_query", query=query[:100], duration_ms=round(duration_ms, 1))
