"""Cache Layer — Redis-backed with graceful fallback to no-cache."""

from __future__ import annotations
import json
import logging
from typing import Any

from app.infrastructure.redis import get_redis

logger = logging.getLogger(__name__)

# TTL strategy (seconds)
TTL = {
    "short": 60,        # opportunities, automation state
    "medium": 300,      # recommendations, roadmap
    "long": 900,        # public profiles, analytics
    "extended": 3600,   # static market data
}


async def cache_get(key: str) -> Any | None:
    """Get from cache. Returns None on miss or Redis unavailable."""
    client = await get_redis()
    if not client:
        logger.warning(f"[CACHE DEGRADED] cache_get ignored for key 'rm:{key}'")
        return None
    try:
        data = await client.get(f"rm:{key}")
        if data:
            logger.info(f"[CACHE HIT] key='rm:{key}'")
            return json.loads(data)
        logger.info(f"[CACHE MISS] key='rm:{key}'")
        return None
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_get failed for 'rm:{key}': {e}")
        return None


async def cache_set(key: str, value: Any, ttl_category: str = "medium") -> None:
    """Set cache value. No-op if Redis unavailable."""
    client = await get_redis()
    if not client:
        logger.warning(f"[CACHE DEGRADED] cache_set ignored for key 'rm:{key}'")
        return
    try:
        ttl = TTL.get(ttl_category, TTL["medium"])
        await client.set(f"rm:{key}", json.dumps(value, default=str), ex=ttl)
        logger.info(f"[CACHE SET] key='rm:{key}' ttl={ttl}s")
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_set failed for 'rm:{key}': {e}")


async def cache_invalidate(key: str) -> None:
    """Invalidate a cache key."""
    client = await get_redis()
    if not client:
        logger.warning(f"[CACHE DEGRADED] cache_invalidate ignored for key 'rm:{key}'")
        return
    try:
        await client.delete(f"rm:{key}")
        logger.info(f"[CACHE INVALIDATE] key='rm:{key}'")
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_invalidate failed for 'rm:{key}': {e}")


async def cache_invalidate_pattern(pattern: str) -> None:
    """Invalidate all keys matching pattern."""
    client = await get_redis()
    if not client:
        logger.warning(f"[CACHE DEGRADED] cache_invalidate_pattern ignored for pattern 'rm:{pattern}'")
        return
    try:
        keys = []
        async for key in client.scan_iter(f"rm:{pattern}"):
            keys.append(key)
        if keys:
            await client.delete(*keys)
            logger.info(f"[CACHE INVALIDATE] pattern='rm:{pattern}' count={len(keys)}")
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_invalidate_pattern failed for 'rm:{pattern}': {e}")
