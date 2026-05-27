class DepthGuard:
    """Prevents propagation events from exceeding a maximum depth threshold."""

    def __init__(self, max_depth: int = 5):
        self.max_depth = max_depth

    def validate(self, event: dict) -> bool:
        """
        Validates that the event's propagation depth is within limits.

        Args:
            event (dict): The orchestration event containing 'propagation_depth'

        Returns:
            bool: True if valid (under depth limit), False otherwise.
        """
        depth = event.get("propagation_depth", 0)
        return depth <= self.max_depth
