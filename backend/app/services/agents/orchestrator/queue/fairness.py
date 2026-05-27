class FairnessManager:
    """Ensures weighted fairness across agents so high-confidence agents don't dominate."""

    def __init__(self):
        self.execution_counts = {}

    def adjust_priority(self, agent_id: str, base_score: float) -> float:
        """Penalizes agents that have executed too frequently in the recent window."""
        count = self.execution_counts.get(agent_id, 0)
        penalty = count * 0.1
        return max(0.1, base_score - penalty)

    def record_execution(self, agent_id: str):
        self.execution_counts[agent_id] = self.execution_counts.get(agent_id, 0) + 1

    def decay_counts(self):
        """Called periodically to decay execution counts, allowing agents to recover priority."""
        for agent in list(self.execution_counts.keys()):
            self.execution_counts[agent] = max(0, self.execution_counts[agent] - 1)
