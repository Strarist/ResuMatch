import hashlib
import time

class DuplicateGuard:
    """Prevents processing of duplicate orchestration events."""

    def __init__(self, cache_ttl_seconds: int = 10):
        self.cache_ttl_seconds = cache_ttl_seconds
        self._seen_signatures = {} # signature -> timestamp

    def _generate_signature(self, event: dict) -> str:
        """Generates an MD5 signature based on the event payload and source."""
        # We use origin_agent and parent_event_id (or event_id if unique) to form a signature
        origin = event.get("origin_agent", "unknown")
        event_id = event.get("event_id", "")
        parent_id = event.get("parent_event_id", "")

        raw_str = f"{origin}:{event_id}:{parent_id}"
        return hashlib.md5(raw_str.encode("utf-8")).hexdigest()

    def validate(self, event: dict) -> bool:
        """
        Validates that the event has not been seen recently.

        Args:
            event (dict): The orchestration event.

        Returns:
            bool: True if valid (not duplicate), False if duplicate.
        """
        now = time.time()

        # Clean up expired cache
        expired = [sig for sig, ts in self._seen_signatures.items() if now - ts > self.cache_ttl_seconds]
        for sig in expired:
            del self._seen_signatures[sig]

        signature = self._generate_signature(event)

        if signature in self._seen_signatures:
            return False

        self._seen_signatures[signature] = now
        return True
