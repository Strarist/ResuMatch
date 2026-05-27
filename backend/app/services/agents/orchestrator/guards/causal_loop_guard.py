class CausalLoopGuard:
    """Prevents an agent from processing an event that has already traversed through it."""

    def validate(self, event: dict) -> bool:
        """
        Validates that the causal path does not contain loops involving the origin agent.

        Args:
            event (dict): The orchestration event.

        Returns:
            bool: True if valid (no loop detected), False if loop detected.
        """
        origin = event.get("origin_agent")
        path = event.get("propagation_path", [])

        if not origin or not path:
            return True

        # A loop occurs if the origin agent has already appeared in the upstream propagation path.
        # However, the current event adds the origin to the path. We must check if it appears MORE than once.
        # Or simpler: if the origin agent is in the path BEFORE this event was emitted.

        # If this event claims to be emitted by X, but X is already in the historical path, it's a loop.
        # Assuming propagation_path tracks agents that have ALREADY processed this causal chain.
        count = path.count(origin)
        return count <= 1  # 1 is acceptable if the path includes the current hop. >1 means a loop.
