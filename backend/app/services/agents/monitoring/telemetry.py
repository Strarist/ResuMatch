class TelemetryStream:
    """Emits runtime execution telemetry to the observability platform."""

    def emit_execution(self, agent_id: str, execution_time_ms: float, state: str):
        """Logs the execution timing and health state."""
        # Simulated emission
        print(f"[TELEMETRY] Agent={agent_id} | ExecTime={execution_time_ms}ms | State={state}")
