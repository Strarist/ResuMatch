import time

class TemporalGuard:
    """Prevents processing of stale orchestration events."""

    def __init__(self, stale_threshold_seconds: int = 5):
        self.stale_threshold_seconds = stale_threshold_seconds

    def validate(self, event: dict) -> bool:
        """
        Validates that the event is not older than the staleness threshold.

        Args:
            event (dict): The orchestration event.

        Returns:
            bool: True if valid (not stale), False if stale.
        """
        event_timestamp = event.get("timestamp", 0)
        if not event_timestamp:
            return False # Reject malformed temporal signatures

        now = time.time()
        return (now - event_timestamp) <= self.stale_threshold_seconds
