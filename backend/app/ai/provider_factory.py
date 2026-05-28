"""Provider factory — constructs the appropriate AI provider based on config.

Provider selection hierarchy:
1. GEMINI_API_KEY set → GeminiProvider (free tier, fast, production-ready)
2. OLLAMA_URL set → OllamaProvider (local, offline, zero-cost)
3. Neither → raises at startup

This ensures the system always has an AI provider available.
"""

import os
from functools import lru_cache

from app.ai import AIProvider, AIProviderError
from app.ai.gemini import GeminiProvider
from app.ai.ollama import OllamaProvider


@lru_cache(maxsize=1)
def get_ai_provider() -> AIProvider:
    """Return the configured AI provider (singleton).

    Priority: OpenRouter > Gemini > Ollama.
    """
    openrouter_key = os.getenv("OPENROUTER_API_KEY")
    if openrouter_key:
        from app.ai.openrouter import OpenRouterProvider
        model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.1-8b-instruct:free")
        return OpenRouterProvider(api_key=openrouter_key, model=model)

    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        return GeminiProvider(api_key=gemini_key)

    ollama_url = os.getenv("OLLAMA_URL", "http://localhost:11434")
    # Check if Ollama is likely available (env explicitly set or default)
    if os.getenv("OLLAMA_URL") or os.getenv("USE_OLLAMA"):
        return OllamaProvider(base_url=ollama_url)

    # Default to Gemini with empty key (will fail on first call with clear error)
    # This allows the app to start and serve non-AI endpoints
    return GeminiProvider(api_key="")
