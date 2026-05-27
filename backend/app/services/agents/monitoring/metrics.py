import time

class AgentMetrics:
    """Tracks latency and execution counts for an agent."""
    def __init__(self):
        self.last_execution = 0.0
        self.total_executions = 0
        self.total_time_ms = 0.0
        self.queue_depth = 0
        self.failure_count = 0
        self.stalled_cycles = 0

    def record_execution(self, execution_time_ms: float):
        self.last_execution = time.time()
        self.total_executions += 1
        self.total_time_ms += execution_time_ms
        self.stalled_cycles = 0  # Reset stalls upon successful execution

    @property
    def avg_execution_ms(self) -> float:
        if self.total_executions == 0:
            return 0.0
        return self.total_time_ms / self.total_executions
