from app.services.runtime.compression.diff_engine import DiffEngine

class DeltaEncoder:
    """Encodes state updates into a minimal delta payload."""

    def __init__(self):
        self.last_state = {}
        self.diff_engine = DiffEngine()

    def encode(self, new_state: dict) -> dict:
        """
        Computes the delta payload against the last sent state.
        Updates the internal last_state.
        """
        delta = self.diff_engine.compute_diff(self.last_state, new_state)
        self.last_state = new_state.copy()

        return {"delta": delta}
