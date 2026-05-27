"""Test Phase 9 propagation engine event bus."""

import pytest
import asyncio
from app.services.propagation.event_bus import EventBus

@pytest.mark.asyncio
async def test_event_bus_subscribe_and_publish():
    bus = EventBus()
    received_payload = {}

    async def mock_handler(payload):
        received_payload.update(payload)

    bus.subscribe("TEST_EVENT", mock_handler)

    # Start worker
    worker_task = asyncio.create_task(bus._worker())

    await bus.publish("TEST_EVENT", {"key": "value"})
    await asyncio.sleep(0.1) # Yield to allow worker to process

    assert received_payload.get("key") == "value"

    worker_task.cancel()
