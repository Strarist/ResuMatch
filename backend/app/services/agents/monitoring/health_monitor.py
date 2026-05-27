from app.services.agents.monitoring.metrics import AgentMetrics
from app.services.agents.monitoring.degradation import DegradationAnalyzer
from app.services.agents.monitoring.telemetry import TelemetryStream
from app.services.agents.monitoring.alerts import AlertManager

class AgentHealthMonitor:
    """Master component for monitoring and enforcing agent health limits."""

    def __init__(self):
        self.metrics_registry = {}
        self.analyzer = DegradationAnalyzer()
        self.telemetry = TelemetryStream()
        self.alerts = AlertManager()

    def _get_metrics(self, agent_id: str) -> AgentMetrics:
        if agent_id not in self.metrics_registry:
            self.metrics_registry[agent_id] = AgentMetrics()
        return self.metrics_registry[agent_id]

    def record_agent_execution(self, agent_id: str, execution_time_ms: float):
        """Records an execution and evaluates the agent's new state."""
        metrics = self._get_metrics(agent_id)
        metrics.record_execution(execution_time_ms)

        state = self.analyzer.analyze(metrics)
        self.telemetry.emit_execution(agent_id, execution_time_ms, state)

        if state == "CRITICAL":
            self.alerts.trigger_stalled_alert(agent_id)

    def cycle_tick(self):
        """Called at the start of every orchestration cycle to track missing agents."""
        for agent_id, metrics in self.metrics_registry.items():
            metrics.stalled_cycles += 1
            state = self.analyzer.analyze(metrics)
            if state == "CRITICAL":
                self.alerts.trigger_stalled_alert(agent_id)
