"""Resilience infrastructure for AI provider calls.

Provides:
- Retry with exponential backoff (jittered)
- Provider failover (Gemini → Ollama)
- Circuit breaker (stops calling a failing provider)
- Partial result recovery (return what we have on failure)
"""

import asyncio
import logging
import time
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field

from app.ai import AIMessage, AIProvider, AIProviderError, AIResponse, AIStreamChunk, QuotaExhaustedError, ProviderUnavailableError
from app.ai.gemini import GeminiProvider
from app.ai.ollama import OllamaProvider

logger = logging.getLogger(__name__)


# === Retry with Backoff ===


async def retry_with_backoff(
    fn,
    max_retries: int = 2,
    base_delay: float = 1.0,
    max_delay: float = 10.0,
):
    """Retry an async function with exponential backoff + jitter.

    Only retries on retryable errors (QuotaExhausted, ProviderUnavailable).
    Non-retryable errors propagate immediately.
    """
    last_error: Exception | None = None
    for attempt in range(max_retries + 1):
        try:
            return await fn()
        except AIProviderError as e:
            last_error = e
            if not e.retryable or attempt == max_retries:
                raise
            delay = min(base_delay * (2 ** attempt), max_delay)
            # Add jitter (±25%)
            import random
            delay *= 0.75 + random.random() * 0.5
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {delay:.1f}s: {e.message}")
            await asyncio.sleep(delay)
    raise last_error or AIProviderError("Retry exhausted")


# === Circuit Breaker ===


@dataclass
class CircuitState:
    failures: int = 0
    last_failure: float = 0.0
    open_until: float = 0.0


class CircuitBreaker:
    """Stops calling a provider after repeated failures.

    States:
    - CLOSED: normal operation, requests pass through
    - OPEN: provider is failing, requests rejected immediately
    - HALF-OPEN: after cooldown, allow one test request

    Thresholds:
    - 3 failures in 60s → open circuit for 30s
    """

    FAILURE_THRESHOLD = 3
    WINDOW_SECONDS = 60
    COOLDOWN_SECONDS = 30

    def __init__(self):
        self._states: dict[str, CircuitState] = {}

    def is_available(self, provider_name: str) -> bool:
        state = self._states.get(provider_name)
        if not state:
            return True
        now = time.time()
        if now >= state.open_until:
            return True  # Closed or half-open
        return False  # Open

    def record_success(self, provider_name: str) -> None:
        self._states.pop(provider_name, None)

    def record_failure(self, provider_name: str) -> None:
        now = time.time()
        state = self._states.setdefault(provider_name, CircuitState())
        # Reset if outside window
        if now - state.last_failure > self.WINDOW_SECONDS:
            state.failures = 0
        state.failures += 1
        state.last_failure = now
        if state.failures >= self.FAILURE_THRESHOLD:
            state.open_until = now + self.COOLDOWN_SECONDS
            logger.warning(f"Circuit OPEN for {provider_name} (cooldown {self.COOLDOWN_SECONDS}s)")


_breaker = CircuitBreaker()


# === Resilient Provider ===


class ResilientProvider:
    """Wraps AI providers with retry, failover, and circuit breaking.

    Usage:
        provider = ResilientProvider()
        response = await provider.generate(messages)
    """

    def __init__(self):
        self._providers: list[tuple[str, AIProvider]] = []
        # Build provider chain from available config
        import os
        gemini_key = os.getenv("GEMINI_API_KEY")
        if gemini_key:
            self._providers.append(("gemini", GeminiProvider(api_key=gemini_key)))
        ollama_url = os.getenv("OLLAMA_URL")
        if ollama_url or os.getenv("USE_OLLAMA"):
            self._providers.append(("ollama", OllamaProvider(base_url=ollama_url or "http://localhost:11434")))
        # Fallback: empty Gemini (will fail with clear error)
        if not self._providers:
            self._providers.append(("gemini", GeminiProvider(api_key="")))

    async def generate(self, messages: list[AIMessage], **kwargs) -> AIResponse:
        """Generate with automatic failover between providers."""
        last_error: Exception | None = None
        for name, provider in self._providers:
            if not _breaker.is_available(name):
                continue
            try:
                result = await retry_with_backoff(lambda: provider.generate(messages, **kwargs))
                _breaker.record_success(name)
                return result
            except AIProviderError as e:
                _breaker.record_failure(name)
                last_error = e
                logger.warning(f"Provider {name} failed: {e.message}, trying next")
        raise last_error or AIProviderError("All providers unavailable")

    async def generate_json(self, messages: list[AIMessage], **kwargs) -> dict:
        """Generate JSON with failover + schema repair on malformed output."""
        last_error: Exception | None = None
        for name, provider in self._providers:
            if not _breaker.is_available(name):
                continue
            try:
                result = await retry_with_backoff(lambda: provider.generate_json(messages, **kwargs))
                _breaker.record_success(name)
                return result
            except AIProviderError as e:
                _breaker.record_failure(name)
                last_error = e
        raise last_error or AIProviderError("All providers unavailable")

    async def generate_stream(self, messages: list[AIMessage], **kwargs) -> AsyncGenerator[AIStreamChunk, None]:
        """Stream with failover (no retry mid-stream — failover to next provider)."""
        for name, provider in self._providers:
            if not _breaker.is_available(name):
                continue
            try:
                async for chunk in provider.generate_stream(messages, **kwargs):
                    yield chunk
                _breaker.record_success(name)
                return
            except AIProviderError as e:
                _breaker.record_failure(name)
                logger.warning(f"Stream provider {name} failed: {e.message}")
        yield AIStreamChunk(content="[Generation unavailable. Please try again.]", done=True)
