class StateReconstructor:
    """Rebuilds runtime state from a series of events rather than full state dumps."""

    def reconstruct(self, base_state: dict, events: list) -> dict:
        """
        Applies a chronological list of events to the base state to reconstruct the final state.

        Args:
            base_state (dict): The initial state snapshot.
            events (list): The list of ReplayEvents.

        Returns:
            dict: The reconstructed state.
        """
        import copy
        current_state = copy.deepcopy(base_state)

        for event in events:
            # We apply simple payload merging for demonstration.
            # In reality, this would have complex domain-specific reducers.
            payload = event.payload if hasattr(event, 'payload') else event.get('payload', {})
            current_state.update(payload)

        return current_state
