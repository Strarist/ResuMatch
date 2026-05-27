class AlertManager:
    """Dispatches alerts when critical runtime thresholds are breached."""

    def trigger_stalled_alert(self, agent_id: str):
        print(f"[ALERT] CRITICAL: Agent {agent_id} has stalled and missed cycle boundaries.")

    def trigger_degraded_alert(self, agent_id: str, reason: str):
        print(f"[ALERT] WARNING: Agent {agent_id} is degraded. Reason: {reason}")
