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

        # Publish to Redis channel for multi-worker synchronization
        from app.infrastructure.redis import get_redis
        redis_client = await get_redis()
        if redis_client:
            try:
                import json
                await redis_client.publish(f"resumatch:bus:{topic}", json.dumps(event))
            except Exception as e:
                import logging
                logging.getLogger(__name__).warning(f"Failed to publish event to Redis: {e}")

# Global runtime bus
runtime_bus = EventBus()
