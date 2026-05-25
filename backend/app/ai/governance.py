"""AI cost governance and runtime control.

Controls:
- Token budgets per operation type
- Provider routing (cost-aware fallback)
- Per-user quota tracking (in-memory, upgradeable to DB)
- Streaming duration limits
- Request cooldowns

Cost model (Gemini Flash free tier):
- 15 RPM, 1M input tokens/day, 8K output tokens/min
- Goal: stay within free tier for portfolio-scale usage
"""

import time
from collections import defaultdict
from dataclasses import dataclass
from enum import Enum

from app.ai import AIProvider
from app.ai.provider_factory import get_ai_provider


# === Token Budgets ===

class OperationType(str, Enum):
    RESUME_PARSE = "resume_parse"
    JOB_EXTRACT = "job_extract"
    ANALYSIS = "analysis"
    COVER_LETTER = "cover_letter"
    ROADMAP_PLAN = "roadmap_plan"


@dataclass
class TokenBudget:
    max_input_tokens: int
    max_output_tokens: int
    max_duration_seconds: int


BUDGETS: dict[OperationType, TokenBudget] = {
    OperationType.RESUME_PARSE: TokenBudget(max_input_tokens=4000, max_output_tokens=2000, max_duration_seconds=30),
    OperationType.JOB_EXTRACT: TokenBudget(max_input_tokens=3000, max_output_tokens=1000, max_duration_seconds=15),
    OperationType.ANALYSIS: TokenBudget(max_input_tokens=5000, max_output_tokens=2000, max_duration_seconds=45),
    OperationType.COVER_LETTER: TokenBudget(max_input_tokens=4000, max_output_tokens=1000, max_duration_seconds=60),
    OperationType.ROADMAP_PLAN: TokenBudget(max_input_tokens=3000, max_output_tokens=800, max_duration_seconds=45),
}


def get_budget(op: OperationType) -> TokenBudget:
    return BUDGETS[op]


def truncate_input(text: str, op: OperationType) -> str:
    """Truncate input text to stay within token budget (~4 chars per token)."""
    budget = BUDGETS[op]
    max_chars = budget.max_input_tokens * 4
    return text[:max_chars]


# === Provider Routing ===

def get_provider_for(op: OperationType) -> AIProvider:
    """Route to the appropriate provider based on operation type.

    Routing rules:
    - All generation: Gemini Flash (free tier, fast)
    - Embeddings: local sentence-transformers (always local, zero cost)
    - Fallback: Ollama if Gemini unavailable

    The provider_factory already handles Gemini > Ollama priority.
    This function exists for future per-operation routing.
    """
    return get_ai_provider()


# === Quota Tracking (in-memory, per-IP) ===

@dataclass
class QuotaWindow:
    count: int = 0
    tokens_used: int = 0
    window_start: float = 0.0


class QuotaTracker:
    """Track AI usage per user/IP within sliding windows.

    Limits (free tier):
    - 20 AI operations per hour per user
    - 50K tokens per hour per user
    - 3 concurrent streams per user
    """

    HOURLY_OPS_LIMIT = 20
    HOURLY_TOKENS_LIMIT = 50_000
    MAX_CONCURRENT_STREAMS = 3
    WINDOW_SECONDS = 3600

    def __init__(self):
        self._usage: dict[str, QuotaWindow] = defaultdict(QuotaWindow)
        self._active_streams: dict[str, int] = defaultdict(int)

    def check_quota(self, user_key: str) -> tuple[bool, str]:
        """Returns (allowed, reason). Prunes expired windows."""
        now = time.time()
        window = self._usage[user_key]

        # Reset window if expired
        if now - window.window_start > self.WINDOW_SECONDS:
            self._usage[user_key] = QuotaWindow(window_start=now)
            window = self._usage[user_key]

        if window.count >= self.HOURLY_OPS_LIMIT:
            return False, f"Hourly operation limit reached ({self.HOURLY_OPS_LIMIT}/hr)"
        if window.tokens_used >= self.HOURLY_TOKENS_LIMIT:
            return False, f"Hourly token limit reached ({self.HOURLY_TOKENS_LIMIT}/hr)"
        return True, ""

    def record_usage(self, user_key: str, tokens: int = 0) -> None:
        now = time.time()
        window = self._usage[user_key]
        if now - window.window_start > self.WINDOW_SECONDS:
            self._usage[user_key] = QuotaWindow(count=1, tokens_used=tokens, window_start=now)
        else:
            window.count += 1
            window.tokens_used += tokens

    def check_stream_slot(self, user_key: str) -> bool:
        """Returns True if user can open another stream."""
        return self._active_streams[user_key] < self.MAX_CONCURRENT_STREAMS

    def open_stream(self, user_key: str) -> None:
        self._active_streams[user_key] += 1

    def close_stream(self, user_key: str) -> None:
        self._active_streams[user_key] = max(0, self._active_streams[user_key] - 1)

    def get_usage(self, user_key: str) -> dict:
        window = self._usage[user_key]
        return {
            "operations_used": window.count,
            "operations_limit": self.HOURLY_OPS_LIMIT,
            "tokens_used": window.tokens_used,
            "tokens_limit": self.HOURLY_TOKENS_LIMIT,
            "active_streams": self._active_streams[user_key],
            "max_streams": self.MAX_CONCURRENT_STREAMS,
        }


# Singleton
quota_tracker = QuotaTracker()
