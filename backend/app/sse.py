"""SSE (Server-Sent Events) streaming infrastructure.

Provides typed event emission over HTTP streaming responses.
Uses async generators for backpressure-safe event production.

Why SSE over WebSockets:
- Unidirectional (server→client) which is all we need for progress/results
- Works over standard HTTP (no upgrade negotiation)
- Automatic reconnection built into EventSource API
- No proxy/CDN configuration issues (Vercel, Cloudflare pass-through)
- Simpler server lifecycle (no connection state management)
"""

import json
import uuid
from collections.abc import AsyncGenerator
from datetime import datetime, timezone
from typing import Any

from fastapi import Request
from fastapi.responses import StreamingResponse


def sse_event(event_type: str, data: dict[str, Any], event_id: str | None = None) -> str:
    """Format a single SSE event string.

    SSE wire format:
      id: <event_id>
      event: <event_type>
      data: <json>
      \\n
    """
    event_id = event_id or uuid.uuid4().hex[:8]
    payload = {
        "id": str(uuid.uuid4()),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "type": event_type,
        "data": data,
    }
    lines = [
        f"id: {event_id}",
        f"event: {event_type}",
        f"data: {json.dumps(payload)}",
        "",  # blank line terminates event
    ]
    return "\n".join(lines) + "\n"


def sse_response(generator: AsyncGenerator[str, None], request: Request) -> StreamingResponse:
    """Create a StreamingResponse that terminates when client disconnects.

    Headers:
    - Content-Type: text/event-stream (required for SSE)
    - Cache-Control: no-cache (prevents proxy buffering)
    - X-Accel-Buffering: no (disables nginx buffering)
    - Connection: keep-alive (keeps TCP open)
    """

    async def _guarded_stream() -> AsyncGenerator[str, None]:
        try:
            async for event in generator:
                if await request.is_disconnected():
                    break
                yield event
        except Exception:
            yield sse_event("analysis.error", {"error": "Internal error", "retryable": True, "resume_id": ""})

    return StreamingResponse(
        _guarded_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


def heartbeat_event() -> str:
    """Keepalive event to prevent proxy timeouts (send every ~15s)."""
    return sse_event("heartbeat", {})
