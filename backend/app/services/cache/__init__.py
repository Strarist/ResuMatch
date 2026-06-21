"""Cache Layer — Redis-backed with in-memory fallback when Redis is unavailable."""

from __future__ import annotations
import json
import logging
import time
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

# In-process fallback when Redis is down (key -> (expires_at, value))
_memory_cache: dict[str, tuple[float, Any]] = {}
_memory_degraded_logged = False


def _memory_get(key: str) -> Any | None:
    entry = _memory_cache.get(key)
    if not entry:
        return None
    expires_at, value = entry
    if time.monotonic() > expires_at:
        _memory_cache.pop(key, None)
        return None
    return value


def _memory_set(key: str, value: Any, ttl: int) -> None:
    _memory_cache[key] = (time.monotonic() + ttl, value)
    if len(_memory_cache) > 500:
        now = time.monotonic()
        stale = [k for k, (exp, _) in _memory_cache.items() if exp <= now]
        for k in stale:
            _memory_cache.pop(k, None)


async def cache_get(key: str) -> Any | None:
    """Get from cache. Returns None on miss or cache unavailable."""
    full_key = f"rm:{key}"

    mem = _memory_get(full_key)
    if mem is not None:
        logger.debug(f"[CACHE HIT memory] key='{full_key}'")
        return mem

    client = await get_redis()
    if not client:
        return None
    try:
        data = await client.get(full_key)
        if data:
            parsed = json.loads(data)
            _memory_set(full_key, parsed, TTL["short"])
            logger.debug(f"[CACHE HIT redis] key='{full_key}'")
            return parsed
        return None
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_get failed for '{full_key}': {e}")
        return None


async def cache_set(key: str, value: Any, ttl_category: str = "medium") -> None:
    """Set cache value. Falls back to in-memory when Redis unavailable."""
    global _memory_degraded_logged
    full_key = f"rm:{key}"
    ttl = TTL.get(ttl_category, TTL["medium"])
    _memory_set(full_key, value, ttl)

    client = await get_redis()
    if not client:
        if not _memory_degraded_logged:
            logger.info("[CACHE] Using in-memory fallback (Redis unavailable)")
            _memory_degraded_logged = True
        return
    try:
        await client.set(full_key, json.dumps(value, default=str), ex=ttl)
        logger.debug(f"[CACHE SET] key='{full_key}' ttl={ttl}s")
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_set failed for '{full_key}': {e}")


async def cache_invalidate(key: str) -> None:
    """Invalidate a cache key."""
    full_key = f"rm:{key}"
    _memory_cache.pop(full_key, None)

    client = await get_redis()
    if not client:
        return
    try:
        await client.delete(full_key)
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_invalidate failed for '{full_key}': {e}")


async def cache_invalidate_pattern(pattern: str) -> None:
    """Invalidate all keys matching pattern."""
    prefix = f"rm:{pattern}"
    stale = [k for k in _memory_cache if k.startswith(prefix)]
    for k in stale:
        _memory_cache.pop(k, None)

    client = await get_redis()
    if not client:
        return
    try:
        keys = []
        async for key in client.scan_iter(prefix):
            keys.append(key)
        if keys:
            await client.delete(*keys)
    except Exception as e:
        logger.warning(f"[CACHE ERROR] cache_invalidate_pattern failed for '{prefix}': {e}")
