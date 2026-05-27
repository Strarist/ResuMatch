class PriorityScorer:
    """Calculates the priority score of an orchestration event."""

    def calculate_score(self, event: dict, starvation_factor: float = 0.0) -> float:
        """
        priority_score = confidence_weight + recency_factor + starvation_boost + propagation_urgency
        """
        import time
        now = time.time()

        confidence = event.get("confidence", 0.5)

        # recency: closer to now = higher score (decay)
        event_time = event.get("timestamp", now)
        age = max(0, now - event_time)
        recency_factor = max(0, 1.0 - (age / 60.0))  # Decays over 60 seconds

        urgency = event.get("propagation_urgency", 0.1)

        return confidence + recency_factor + starvation_factor + urgency
