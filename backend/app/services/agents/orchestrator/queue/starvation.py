import time

class StarvationMonitor:
    """Boosts priority of events that have been stuck in the queue."""

    def __init__(self, starvation_threshold_sec: float = 2.0):
        self.threshold = starvation_threshold_sec

    def compute_boost(self, queued_at: float) -> float:
        """Calculates a priority boost based on time spent in queue."""
        wait_time = time.time() - queued_at
        if wait_time > self.threshold:
            # Exponential boost to force dispatch
            return min(5.0, (wait_time - self.threshold) ** 1.5)
        return 0.0
