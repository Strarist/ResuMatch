"""Product telemetry — typed events for product intelligence.

Privacy principles:
- Never log resume content, cover letters, or prompts
- Only log IDs, durations, counts, and boolean outcomes
- PII (emails, names) never appear in telemetry
- Events are fire-and-forget (never block request handling)

Event taxonomy:
- analysis.*: resume analysis workflow
- generation.*: cover letter / roadmap generation
- stream.*: SSE streaming lifecycle
- workspace.*: navigation and feature usage
"""

import time
import logging
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any

logger = logging.getLogger(__name__)


class EventCategory(str, Enum):
    ANALYSIS = "analysis"
    GENERATION = "generation"
    STREAM = "stream"
    WORKSPACE = "workspace"
    AUTH = "auth"


@dataclass
class TelemetryEvent:
    """Typed telemetry event. All fields are privacy-safe."""
    category: str
    action: str
    # Metadata (never PII)
    duration_ms: float = 0
    success: bool = True
    provider: str = ""
    tokens_used: int = 0
    retry_count: int = 0
    metadata: dict[str, Any] = field(default_factory=dict)


# === Event Emitter ===

_events: list[dict] = []  # In-memory buffer for batch export


def emit(event: TelemetryEvent) -> None:
    """Emit a telemetry event. Non-blocking, fire-and-forget."""
    entry = asdict(event)
    entry["ts"] = time.time()
    _events.append(entry)

    # Log for observability (structured)
    logger.info(f"telemetry.{event.category}.{event.action}", extra={
        "duration_ms": event.duration_ms,
        "success": event.success,
        "provider": event.provider,
    })

    # Cap buffer (prevent memory leak if export is not configured)
    if len(_events) > 1000:
        _events.pop(0)


def get_events(limit: int = 100) -> list[dict]:
    """Get recent events (for internal dashboard / export)."""
    return _events[-limit:]


def get_summary() -> dict:
    """Aggregate summary for operational dashboard."""
    now = time.time()
    hour_ago = now - 3600

    recent = [e for e in _events if e.get("ts", 0) > hour_ago]
    if not recent:
        return {"total_events": 0, "period": "1h"}

    analyses = [e for e in recent if e["category"] == "analysis"]
    generations = [e for e in recent if e["category"] == "generation"]
    streams = [e for e in recent if e["category"] == "stream"]

    return {
        "period": "1h",
        "total_events": len(recent),
        "analyses": {
            "count": len(analyses),
            "success_rate": sum(1 for a in analyses if a["success"]) / max(len(analyses), 1),
            "avg_duration_ms": sum(a["duration_ms"] for a in analyses) / max(len(analyses), 1),
        },
        "generations": {
            "count": len(generations),
            "success_rate": sum(1 for g in generations if g["success"]) / max(len(generations), 1),
        },
        "streams": {
            "count": len(streams),
            "avg_duration_ms": sum(s["duration_ms"] for s in streams) / max(len(streams), 1),
        },
    }


# === Convenience Emitters ===


def track_analysis(duration_ms: float, success: bool, provider: str = "", tokens: int = 0) -> None:
    emit(TelemetryEvent(
        category="analysis", action="completed",
        duration_ms=duration_ms, success=success, provider=provider, tokens_used=tokens,
    ))


def track_generation(kind: str, duration_ms: float, success: bool, provider: str = "") -> None:
    emit(TelemetryEvent(
        category="generation", action=kind,
        duration_ms=duration_ms, success=success, provider=provider,
    ))


def track_stream(action: str, duration_ms: float = 0, success: bool = True) -> None:
    emit(TelemetryEvent(category="stream", action=action, duration_ms=duration_ms, success=success))
