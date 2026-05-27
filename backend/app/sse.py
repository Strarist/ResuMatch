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

def sse_delta_event(event_type: str, encoder: Any, new_state: dict[str, Any], event_id: str | None = None) -> str:
    """Formats an SSE event using delta compression to minimize payload size."""
    from app.services.runtime.compression.payload_minimizer import PayloadMinimizer, normalize_runtime_payload

    delta_payload = encoder.encode(new_state)
    minimized_payload = PayloadMinimizer.minimize(delta_payload)
    normalized_payload = normalize_runtime_payload(minimized_payload)

    return sse_event(event_type, normalized_payload, event_id)


def sse_response(generator: AsyncGenerator[str, None], request: Request) -> StreamingResponse:
    """Create a StreamingResponse that terminates when client disconnects.

    Headers:
    - Content-Type: text/event-stream (required for SSE)
    - Cache-Control: no-cache (prevents proxy buffering)
    - X-Accel-Buffering: no (disables nginx buffering)
    - Connection: keep-alive (keeps TCP open)
    """

    async def safe_event_stream() -> AsyncGenerator[str, None]:
        import asyncio
        import traceback

        try:
            # We run the generator in a task so we can interleave heartbeats
            # but for simplicity, if we just want to protect the stream:
            async for event in generator:
                if await request.is_disconnected():
                    break
                yield event
        except Exception as e:
            print(f"SSE Stream Error: {e}")
            traceback.print_exc()
            # Emit degraded runtime state
            yield sse_event("runtime.degraded", {
                "status": "DEGRADED",
                "error": str(e)
            })

            # Keep stream alive safely
            while not await request.is_disconnected():
                yield heartbeat_event()
                await asyncio.sleep(15)

    return StreamingResponse(
        safe_event_stream(),
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
