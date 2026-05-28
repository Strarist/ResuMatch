"""Alert management for runtime health monitoring."""

from app.logger import logger


class AlertManager:
    """Dispatches alerts when critical runtime thresholds are breached."""

    def trigger_stalled_alert(self, agent_id: str) -> None:
        """Log a critical alert when an agent stalls."""
        logger.error(f"[ALERT] CRITICAL: Agent {agent_id} has stalled and missed cycle boundaries.")

    def trigger_degraded_alert(self, agent_id: str, reason: str) -> None:
        """Log a warning when an agent is degraded."""
        logger.warning(f"[ALERT] WARNING: Agent {agent_id} is degraded. Reason: {reason}")
