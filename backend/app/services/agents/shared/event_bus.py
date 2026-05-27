import asyncio
from typing import Dict, List, Any

class EventBus:
    """In-memory async queue for agent orchestration."""
    def __init__(self):
        self.subscribers: Dict[str, List[asyncio.Queue]] = {}
        self.history: List[Dict[str, Any]] = []

    def subscribe(self, topic: str) -> asyncio.Queue:
        queue = asyncio.Queue()
        if topic not in self.subscribers:
            self.subscribers[topic] = []
        self.subscribers[topic].append(queue)
        return queue

    async def publish(self, topic: str, event: Dict[str, Any]):
        self.history.append({"topic": topic, "event": event})
        # Keep history bounded
        if len(self.history) > 100:
            self.history.pop(0)

        if topic in self.subscribers:
            for queue in self.subscribers[topic]:
                await queue.put(event)

# Global runtime bus
runtime_bus = EventBus()
