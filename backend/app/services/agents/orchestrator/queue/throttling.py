class ThrottleController:
    """Adapts orchestration dispatch rate based on system pressure."""

    def __init__(self, target_ms_per_cycle: int = 100):
        self.target_ms = target_ms_per_cycle
        self.current_throttle_delay = 0.0

    def adjust(self, last_cycle_ms: float):
        """Increases or decreases delay between dispatches based on cycle latency."""
        if last_cycle_ms > self.target_ms:
            # System is struggling, slow down dispatch
            self.current_throttle_delay = min(2.0, self.current_throttle_delay + 0.1)
        else:
            # System is fast, reduce throttle
            self.current_throttle_delay = max(0.0, self.current_throttle_delay - 0.05)

    def get_delay(self) -> float:
        return self.current_throttle_delay
