"""Redis Infrastructure — singleton async client with retry-safe initialization."""

from __future__ import annotations
import asyncio
import logging
import time
from typing import Optional

logger = logging.getLogger(__name__)

_redis_client: Optional[object] = None
_redis_loop: Optional[object] = None
_redis_unavailable_until: float = 0.0
_redis_connect_lock: asyncio.Lock | None = None
_redis_last_warn_at: float = 0.0
_REDIS_RETRY_COOLDOWN_SEC = 60.0


def _connect_lock() -> asyncio.Lock:
    global _redis_connect_lock
    if _redis_connect_lock is None:
        _redis_connect_lock = asyncio.Lock()
    return _redis_connect_lock


async def get_redis():
    """Get or create Redis client. Returns None if Redis unavailable (graceful degradation)."""
    global _redis_client, _redis_loop, _redis_unavailable_until, _redis_last_warn_at

    from app.config import get_settings
    settings = get_settings()
    if not settings.redis_url:
        return None

    now = time.monotonic()
    if _redis_client is not None:
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None
        if _redis_loop is None or _redis_loop is current_loop:
            return _redis_client

    if now < _redis_unavailable_until:
        return None

    async with _connect_lock():
        now = time.monotonic()
        if _redis_client is not None:
            return _redis_client
        if now < _redis_unavailable_until:
            return None

        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if _redis_client is not None:
            if _redis_loop is None or _redis_loop is current_loop:
                return _redis_client
            try:
                await _redis_client.aclose()
            except Exception:
                pass
            _redis_client = None
            _redis_loop = None

        try:
            import redis.asyncio as aioredis

            client = aioredis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=0.5,
                socket_timeout=0.5,
            )
            await client.ping()
            _redis_client = client
            _redis_loop = current_loop
            _redis_unavailable_until = 0.0
            logger.info("Redis connected")
            return _redis_client
        except Exception as e:
            _redis_unavailable_until = time.monotonic() + _REDIS_RETRY_COOLDOWN_SEC
            _redis_client = None
            _redis_loop = None
            if time.monotonic() - _redis_last_warn_at >= _REDIS_RETRY_COOLDOWN_SEC:
                _redis_last_warn_at = time.monotonic()
                logger.warning(
                    "Redis unavailable: %s. Operating without cache for %.0fs.",
                    e,
                    _REDIS_RETRY_COOLDOWN_SEC,
                )
            return None


async def close_redis():
    """Graceful shutdown."""
    global _redis_client, _redis_loop
    if _redis_client:
        try:
            await _redis_client.aclose()
        except Exception:
            pass
        _redis_client = None
        _redis_loop = None


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
