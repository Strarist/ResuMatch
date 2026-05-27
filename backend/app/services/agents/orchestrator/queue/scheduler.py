import asyncio
import time
from app.services.agents.orchestrator.queue.scoring import PriorityScorer
from app.services.agents.orchestrator.queue.fairness import FairnessManager
from app.services.agents.orchestrator.queue.throttling import ThrottleController
from app.services.agents.orchestrator.queue.starvation import StarvationMonitor

class RuntimePriorityQueue:
    """Master scheduler for the orchestration runtime."""

    def __init__(self):
        self.queue = []
        self.scorer = PriorityScorer()
        self.fairness = FairnessManager()
        self.throttle = ThrottleController()
        self.starvation = StarvationMonitor()
        self.lock = asyncio.Lock()

    async def enqueue(self, event: dict):
        """Adds an event to the priority queue."""
        event["_queued_at"] = time.time()
        async with self.lock:
            self.queue.append(event)

    async def dequeue(self):
        """Pulls the highest priority event, considering starvation and fairness."""
        async with self.lock:
            if not self.queue:
                return None

            best_idx = 0
            best_score = -1.0

            for i, event in enumerate(self.queue):
                boost = self.starvation.compute_boost(event["_queued_at"])
                base_score = self.scorer.calculate_score(event, starvation_factor=boost)

                agent_id = event.get("origin_agent", "unknown")
                final_score = self.fairness.adjust_priority(agent_id, base_score)

                if final_score > best_score:
                    best_score = final_score
                    best_idx = i

            selected_event = self.queue.pop(best_idx)
            self.fairness.record_execution(selected_event.get("origin_agent", "unknown"))
            return selected_event
