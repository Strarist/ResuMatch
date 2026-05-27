import json
from app.services.runtime.compression.delta_encoder import DeltaEncoder
from app.services.runtime.compression.payload_minimizer import PayloadMinimizer

class ScopedStreamer:
    """Handles scoped, delta-compressed streaming for specific SSE subscribers."""

    def __init__(self, scopes: list = None):
        self.scopes = scopes or []
        self.encoder = DeltaEncoder()

    def format_event(self, full_state: dict) -> str:
        """
        Extracts scoped data, compresses to a delta, and formats as SSE.
        """
        # Filter by scope if provided
        scoped_state = full_state
        if self.scopes:
            scoped_state = {k: v for k, v in full_state.items() if k in self.scopes}

        # Delta compress
        delta_payload = self.encoder.encode(scoped_state)

        # Minimize
        minimized = PayloadMinimizer.minimize(delta_payload)

        # If there's no delta, we optionally skip sending entirely.
        # This prevents the emission of `{"delta": {}}` which can cause
        # frontend state overrides without proper defensive rendering.
        if not minimized.get("delta"):
            return ""

        return f"data: {json.dumps(minimized)}\n\n"
