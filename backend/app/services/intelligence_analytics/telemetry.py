"""Intelligence Analytics - Observability for Propagation Engine."""

from loguru import logger
import time

def track_propagation_latency(event_type: str, start_time: float):
    """Tracks and logs how long a propagation chain took."""
    latency = (time.perf_counter() - start_time) * 1000
    logger.info(f"IntelligenceAnalytics: Event '{event_type}' propagated in {latency:.2f}ms")
    # In a real system, send this to Prometheus or Datadog
