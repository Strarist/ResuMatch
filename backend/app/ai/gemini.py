"""Google Gemini provider implementation.

Uses the Gemini REST API directly (no SDK dependency) for:
- Minimal dependency footprint
- Full control over retry/timeout behavior
- Streaming via server-sent events from Gemini API
"""

import json
from collections.abc import AsyncGenerator

import httpx

from app.ai import (
    AIMessage, AIProvider, AIResponse, AIStreamChunk,
    AIProviderError, QuotaExhaustedError, ProviderUnavailableError,
)

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


class GeminiProvider(AIProvider):
    def __init__(self, api_key: str, model: str = "gemini-2.0-flash"):
        self._api_key = api_key
        self._model = model
        self._client = httpx.AsyncClient(timeout=60.0)

    async def generate(self, messages: list[AIMessage], **kwargs) -> AIResponse:
        body = self._build_request(messages, **kwargs)
        url = f"{GEMINI_API_BASE}/{self._model}:generateContent?key={self._api_key}"

        response = await self._request(url, body)
        text = response["candidates"][0]["content"]["parts"][0]["text"]
        usage = response.get("usageMetadata", {})

        return AIResponse(
            content=text,
            model=self._model,
            usage={
                "prompt_tokens": usage.get("promptTokenCount", 0),
                "completion_tokens": usage.get("candidatesTokenCount", 0),
            },
            raw=response,
        )

    async def generate_stream(self, messages: list[AIMessage], **kwargs) -> AsyncGenerator[AIStreamChunk, None]:
        body = self._build_request(messages, **kwargs)
        url = f"{GEMINI_API_BASE}/{self._model}:streamGenerateContent?alt=sse&key={self._api_key}"

        async with self._client.stream("POST", url, json=body) as response:
            if response.status_code != 200:
                raise self._map_error(response.status_code, await response.aread())
            async for line in response.aiter_lines():
                if not line.startswith("data: "):
                    continue
                chunk = json.loads(line[6:])
                parts = chunk.get("candidates", [{}])[0].get("content", {}).get("parts", [])
                text = parts[0]["text"] if parts else ""
                done = chunk.get("candidates", [{}])[0].get("finishReason") is not None
                yield AIStreamChunk(content=text, done=done)

    async def generate_json(self, messages: list[AIMessage], **kwargs) -> dict:
        kwargs["response_mime_type"] = "application/json"
        resp = await self.generate(messages, **kwargs)
        try:
            return json.loads(resp.content)
        except json.JSONDecodeError:
            raise AIProviderError("Gemini returned invalid JSON")

    def _build_request(self, messages: list[AIMessage], **kwargs) -> dict:
        contents = []
        system_instruction = None

        for msg in messages:
            if msg.role == "system":
                system_instruction = {"parts": [{"text": msg.content}]}
            else:
                contents.append({
                    "role": "user" if msg.role == "user" else "model",
                    "parts": [{"text": msg.content}],
                })

        body: dict = {"contents": contents}
        if system_instruction:
            body["systemInstruction"] = system_instruction

        generation_config = {}
        if "temperature" in kwargs:
            generation_config["temperature"] = kwargs["temperature"]
        if "max_tokens" in kwargs:
            generation_config["maxOutputTokens"] = kwargs["max_tokens"]
        if "response_mime_type" in kwargs:
            generation_config["responseMimeType"] = kwargs["response_mime_type"]
        if generation_config:
            body["generationConfig"] = generation_config

        return body

    async def _request(self, url: str, body: dict) -> dict:
        try:
            resp = await self._client.post(url, json=body)
        except httpx.TimeoutException:
            raise ProviderUnavailableError("Gemini request timed out")
        except httpx.ConnectError:
            raise ProviderUnavailableError("Cannot connect to Gemini API")

        if resp.status_code != 200:
            raise self._map_error(resp.status_code, resp.content)
        return resp.json()

    @staticmethod
    def _map_error(status: int, body: bytes) -> AIProviderError:
        if status == 429:
            return QuotaExhaustedError("Gemini rate limit exceeded")
        if status >= 500:
            return ProviderUnavailableError(f"Gemini server error: {status}")
        return AIProviderError(f"Gemini error {status}: {body[:200].decode()}")
