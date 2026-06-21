"""Tests for OpenRouter AI provider parameter forwarding."""

import pytest
from unittest.mock import AsyncMock, patch

from app.ai import AIMessage
from app.ai.openrouter import OpenRouterProvider


@pytest.mark.asyncio
async def test_generate_stream_forwards_generation_kwargs():
    provider = OpenRouterProvider(api_key="test-key", model="test-model")
    messages = [AIMessage(role="user", content="Hello")]

    with patch("app.ai.openrouter.llm_service.generate", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = "streamed response"

        chunks = []
        async for chunk in provider.generate_stream(messages, temperature=0.7, max_tokens=512):
            chunks.append(chunk)

        mock_generate.assert_awaited_once_with(
            messages=[{"role": "user", "content": "Hello"}],
            temperature=0.7,
            max_tokens=512,
        )
        assert len(chunks) == 1
        assert chunks[0].content == "streamed response"
        assert chunks[0].done is True
