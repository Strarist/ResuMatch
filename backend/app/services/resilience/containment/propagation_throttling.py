from typing import Dict, Any

class PropagationThrottler:
    """Safeguards message queues by dynamically throttling event-driven propagation flow rates."""

    @staticmethod
    def calculate_throttle(queue_depth: int, max_depth: int = 100) -> Dict[str, Any]:
        """
        Determines event transmission limits based on queue backpressure.
        
        Args:
            queue_depth (int): Current pending event count.
            max_depth (int): Safe queue storage boundary.
        """
        fill_ratio = queue_depth / max_depth
        should_throttle = fill_ratio >= 0.70

        # Pacing coefficient: higher ratio translates to slower paced events
        pacing_coefficient = 1.0 + (fill_ratio * 4.0) if should_throttle else 1.0

        return {
            "queue_depth": queue_depth,
            "fill_ratio": round(fill_ratio, 3),
            "should_throttle": should_throttle,
            "pacing_coefficient": round(pacing_coefficient, 2)
        }
