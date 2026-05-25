"""AI provider abstraction layer.

All AI providers implement the AIProvider protocol.
Business logic never imports provider SDKs directly — only this interface.
"""

from abc import ABC, abstractmethod
from collections.abc import AsyncGenerator
from dataclasses import dataclass, field
from enum import Enum


class AIModel(str, Enum):
    """Supported model identifiers (provider-agnostic)."""
    GEMINI_FLASH = "gemini-2.0-flash"
    OLLAMA_LLAMA = "llama3.2"
    OLLAMA_MISTRAL = "mistral"


@dataclass
class AIMessage:
    role: str  # "system" | "user" | "assistant"
    content: str


@dataclass
class AIResponse:
    """Normalized response from any provider."""
    content: str
    model: str
    usage: dict[str, int] = field(default_factory=dict)  # prompt_tokens, completion_tokens
    raw: dict | None = None  # Provider-specific raw response for debugging


@dataclass
class AIStreamChunk:
    """Single chunk from a streaming response."""
    content: str
    done: bool = False


class AIProviderError(Exception):
    """Base error for all provider failures."""
    def __init__(self, message: str, retryable: bool = False):
        self.message = message
        self.retryable = retryable
        super().__init__(message)


class QuotaExhaustedError(AIProviderError):
    """Provider rate limit or quota exceeded."""
    def __init__(self, message: str = "Quota exhausted"):
        super().__init__(message, retryable=True)


class ProviderUnavailableError(AIProviderError):
    """Provider is down or unreachable."""
    def __init__(self, message: str = "Provider unavailable"):
        super().__init__(message, retryable=True)


class AIProvider(ABC):
    """Protocol that all AI providers must implement."""

    @abstractmethod
    async def generate(self, messages: list[AIMessage], **kwargs) -> AIResponse:
        """Generate a complete response."""
        ...

    @abstractmethod
    async def generate_stream(self, messages: list[AIMessage], **kwargs) -> AsyncGenerator[AIStreamChunk, None]:
        """Generate a streaming response."""
        ...

    @abstractmethod
    async def generate_json(self, messages: list[AIMessage], **kwargs) -> dict:
        """Generate a response and parse as JSON."""
        ...
