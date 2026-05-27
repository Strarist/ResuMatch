class ReplayValidator:
    """Validates if two reconstructed states are deterministic."""

    def validate_states(self, expected_state: dict, actual_state: dict) -> bool:
        """Returns True if states match exactly, False otherwise."""
        from app.services.agents.replay.serializers import serialize_event
        return serialize_event(expected_state) == serialize_event(actual_state)
