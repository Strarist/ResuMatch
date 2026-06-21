import asyncio
import json
import random
from typing import AsyncGenerator

class DriftAnalyzer:
    def __init__(self):
        # Baseline metrics
        self.match_score = 94.0
        self.career_velocity = 78.0
        self.market_fit = 91.0
        self.recruiter_confidence = 87.0

        # Explainability signals pool to simulate realistic mutations
        self.mutations_pool = [
            {"signal": "Target Role Alignment", "delta": "+4%", "reason": "Added Distributed Systems keywords to profile", "confidence": "High (0.89)", "type": "matchScore", "impact": 4.0},
            {"signal": "Recruiter Confidence", "delta": "-0.5", "reason": "Market demand shifted towards your stack but activity decayed", "confidence": "Verified Source", "type": "recruiterConfidence", "impact": -0.5},
            {"signal": "Career Velocity", "delta": "+1.5x", "reason": "Successfully deployed 3 backend optimizations", "confidence": "System Computed", "type": "careerVelocity", "impact": 1.5},
            {"signal": "Opportunity Adjacency", "delta": "+2%", "reason": "New Staff roles detected matching your execution profile", "confidence": "Live Market Data", "type": "marketFit", "impact": 2.0},
            {"signal": "Execution Decay", "delta": "-1%", "reason": "No new portfolio commits detected in 14 days", "confidence": "System Computed", "type": "careerVelocity", "impact": -1.0},
        ]

    async def _get_expanded_payload(self, base_payload: dict):
        from app.services.causal_graph.topology import CausalGraphService
        from app.services.propagation.engine import PropagationEngine
        from app.services.agents.orchestrator.coordinator import OrchestratorCoordinator

        base_payload["graph"] = await CausalGraphService.get_graph_topology(None, "demo_user")
        base_payload["propagation"] = PropagationEngine.get_live_propagation_feed()

        coord = OrchestratorCoordinator.get_instance()
        base_payload["orchestration"] = coord.latest_cycle_payload

        return base_payload

    async def generate_drift_stream(self) -> AsyncGenerator[str, None]:
        """Yields SSE formatted intelligence events continuously."""
        from app.services.agents.orchestrator.coordinator import OrchestratorCoordinator
        from app.services.runtime.compression.payload_minimizer import normalize_runtime_payload
        from app.infrastructure.redis import get_redis

        coord = OrchestratorCoordinator.get_instance()
        asyncio.create_task(coord.start_orchestration_loop())

        # Wait a bit for orchestrator to have a cycle
        await asyncio.sleep(1)

        # Yield initial state
        init_data = await self._get_expanded_payload({"type": "init", "data": self._get_current_metrics()})
        init_data = normalize_runtime_payload(init_data)
        yield f"event: init\ndata: {json.dumps(init_data)}\n\n"

        # Setup Redis Pub/Sub if available
        redis_client = await get_redis()
        pubsub = None
        if redis_client:
            try:
                pubsub = redis_client.pubsub()
                await pubsub.subscribe("resumatch:bus:orchestration_cycle")
            except Exception as e:
                pubsub = None

        try:
            while True:
                # If Redis is active, poll for coordinated events
                if pubsub:
                    try:
                        msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                        if msg and msg.get("data"):
                            event_data = json.loads(msg["data"])
                            data_obj = await self._get_expanded_payload({
                                "type": "orchestration_cycle",
                                "cycle": event_data,
                                "metrics": self._get_current_metrics()
                            })
                            data_obj = normalize_runtime_payload(data_obj)
                            yield f"event: update\ndata: {json.dumps(data_obj)}\n\n"
                            continue
                    except Exception:
                        pass

                # Fallback to local micro-drifts and ticks
                await asyncio.sleep(random.uniform(4.0, 8.0))

                drift_type = random.choice(["metrics_tick", "mutation"])

                if drift_type == "metrics_tick":
                    # Micro-drift
                    self.match_score = min(99.9, max(10.0, self.match_score + (random.random() - 0.5) * 0.2))
                    self.career_velocity = min(99.9, max(10.0, self.career_velocity + (random.random() - 0.5) * 0.3))
                    self.market_fit = min(99.9, max(10.0, self.market_fit + (random.random() - 0.5) * 0.1))
                    self.recruiter_confidence = min(99.9, max(10.0, self.recruiter_confidence + (random.random() - 0.5) * 0.2))

                    data_obj = await self._get_expanded_payload({"type": "metrics", "data": self._get_current_metrics()})
                    data_obj = normalize_runtime_payload(data_obj)
                    yield f"event: update\ndata: {json.dumps(data_obj)}\n\n"

                else:
                    # Meaningful mutation
                    mutation = random.choice(self.mutations_pool)
                    if mutation["type"] == "matchScore":
                        self.match_score = min(99.9, max(10.0, self.match_score + mutation["impact"]))
                    elif mutation["type"] == "recruiterConfidence":
                        self.recruiter_confidence = min(99.9, max(10.0, self.recruiter_confidence + mutation["impact"]))
                    elif mutation["type"] == "careerVelocity":
                        self.career_velocity = min(99.9, max(10.0, self.career_velocity + mutation["impact"]))
                    elif mutation["type"] == "marketFit":
                        self.market_fit = min(99.9, max(10.0, self.market_fit + mutation["impact"]))

                    data_obj = await self._get_expanded_payload({"type": "mutation", "mutation": mutation, "metrics": self._get_current_metrics()})
                    data_obj = normalize_runtime_payload(data_obj)
                    yield f"event: update\ndata: {json.dumps(data_obj)}\n\n"
        finally:
            if pubsub:
                try:
                    await pubsub.unsubscribe("resumatch:bus:orchestration_cycle")
                except Exception:
                    pass

    def _get_current_metrics(self):
        return {
            "matchScore": round(self.match_score, 1),
            "careerVelocity": round(self.career_velocity, 1),
            "marketFit": round(self.market_fit, 1),
            "recruiterConfidence": round(self.recruiter_confidence, 1)
        }

drift_engine = DriftAnalyzer()
