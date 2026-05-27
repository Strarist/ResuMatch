class DegradationAnalyzer:
    """Analyzes metrics to determine the degradation state of an agent."""

    def analyze(self, metrics) -> str:
        """Returns the runtime state: NORMAL, DEGRADED, THROTTLED, CRITICAL"""
        import time
        now = time.time()

        # Check if agent is stalled
        time_since_last_exec = now - metrics.last_execution

        if metrics.failure_count > 5 or metrics.stalled_cycles >= 3:
            return "CRITICAL"

        if time_since_last_exec > 30.0 and metrics.total_executions > 0:
            return "DEGRADED"

        if metrics.avg_execution_ms > 1000.0:
            return "THROTTLED"

        return "NORMAL"
