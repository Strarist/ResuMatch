"""Ollama provider for local inference.

Connects to a local Ollama server (default: http://localhost:11434).
Used for: offline development, CI testing, zero-cost inference.
"""

import json
from collections.abc import AsyncGenerator

import httpx

from app.ai import (
    AIMessage, AIProvider, AIResponse, AIStreamChunk,
    AIProviderError, ProviderUnavailableError,
)


class OllamaProvider(AIProvider):
    def __init__(self, base_url: str = "http://localhost:11434", model: str = "llama3.2"):
        self._base_url = base_url
        self._model = model
        self._client = httpx.AsyncClient(timeout=120.0)

    async def generate(self, messages: list[AIMessage], **kwargs) -> AIResponse:
        body = self._build_request(messages, stream=False, **kwargs)
        try:
            resp = await self._client.post(f"{self._base_url}/api/chat", json=body)
        except (httpx.ConnectError, httpx.TimeoutException):
            raise ProviderUnavailableError("Ollama server not reachable (is it running?)")

        if resp.status_code != 200:
            raise AIProviderError(f"Ollama error: {resp.status_code}")

        data = resp.json()
        return AIResponse(
            content=data["message"]["content"],
            model=self._model,
            usage={
                "prompt_tokens": data.get("prompt_eval_count", 0),
                "completion_tokens": data.get("eval_count", 0),
            },
            raw=data,
        )

    async def generate_stream(self, messages: list[AIMessage], **kwargs) -> AsyncGenerator[AIStreamChunk, None]:
        body = self._build_request(messages, stream=True, **kwargs)
        try:
            async with self._client.stream("POST", f"{self._base_url}/api/chat", json=body) as resp:
                if resp.status_code != 200:
                    raise AIProviderError(f"Ollama error: {resp.status_code}")
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    chunk = json.loads(line)
                    yield AIStreamChunk(
                        content=chunk.get("message", {}).get("content", ""),
                        done=chunk.get("done", False),
                    )
        except (httpx.ConnectError, httpx.TimeoutException):
            raise ProviderUnavailableError("Ollama server not reachable")

    async def generate_json(self, messages: list[AIMessage], **kwargs) -> dict:
        kwargs["format"] = "json"
        resp = await self.generate(messages, **kwargs)
        try:
            return json.loads(resp.content)
        except json.JSONDecodeError:
            raise AIProviderError("Ollama returned invalid JSON")

    def _build_request(self, messages: list[AIMessage], stream: bool = False, **kwargs) -> dict:
        body: dict = {
            "model": self._model,
            "messages": [{"role": m.role, "content": m.content} for m in messages],
            "stream": stream,
        }
        if "format" in kwargs:
            body["format"] = kwargs["format"]
        if "temperature" in kwargs:
            body["options"] = {"temperature": kwargs["temperature"]}
        return body
