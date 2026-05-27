"""Event Bus for the Propagation Engine."""

import asyncio
from typing import Callable, Coroutine, Any
from loguru import logger

class EventBus:
    def __init__(self):
        self.subscribers: dict[str, list[Callable[..., Coroutine[Any, Any, None]]]] = {}
        self.queue = asyncio.Queue()

    def subscribe(self, event_type: str, handler: Callable[..., Coroutine[Any, Any, None]]):
        """Subscribe an async handler to an event type."""
        if event_type not in self.subscribers:
            self.subscribers[event_type] = []
        self.subscribers[event_type].append(handler)

    async def publish(self, event_type: str, payload: dict):
        """Publish an event to the queue."""
        await self.queue.put((event_type, payload))

    async def _worker(self):
        """Worker that processes events from the queue."""
        while True:
            event_type, payload = await self.queue.get()
            handlers = self.subscribers.get(event_type, [])
            for handler in handlers:
                try:
                    await handler(payload)
                except Exception as e:
                    logger.error(f"Error handling event {event_type} with payload {payload}: {e}")
            self.queue.task_done()

    def start_worker(self):
        """Start the background worker."""
        asyncio.create_task(self._worker())

# Global event bus instance
bus = EventBus()
