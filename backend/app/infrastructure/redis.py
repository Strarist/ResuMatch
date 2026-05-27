"""Redis Infrastructure — singleton async client with retry-safe initialization."""

from __future__ import annotations
import logging
from typing import Optional

logger = logging.getLogger(__name__)

_redis_client: Optional[object] = None


async def get_redis():
    """Get or create Redis client. Returns None if Redis unavailable (graceful degradation)."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client

    try:
        import redis.asyncio as aioredis
        from app.config import get_settings
        settings = get_settings()
        redis_url = getattr(settings, 'redis_url', None) or "redis://localhost:6379"
        _redis_client = aioredis.from_url(redis_url, decode_responses=True, socket_connect_timeout=2)
        await _redis_client.ping()
        logger.info("Redis connected")
        return _redis_client
    except Exception as e:
        logger.warning(f"Redis unavailable: {e}. Operating without cache/queue.")
        _redis_client = None
        return None


async def close_redis():
    """Graceful shutdown."""
    global _redis_client
    if _redis_client:
        await _redis_client.close()
        _redis_client = None


async def redis_health() -> dict:
    """Health check."""
    client = await get_redis()
    if not client:
        return {"status": "unavailable"}
    try:
        await client.ping()
        return {"status": "healthy"}
    except Exception:
        return {"status": "degraded"}
