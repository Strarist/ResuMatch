from collections.abc import AsyncGenerator
from app.ai import AIProvider, AIMessage, AIResponse, AIStreamChunk
from app.services.llm.provider import llm_service

class OpenRouterProvider(AIProvider):
    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model

    async def generate(self, messages: list[AIMessage], **kwargs) -> AIResponse:
        # Convert AIMessage to dict
        formatted_messages = [
            {"role": m.role, "content": m.content} for m in messages
        ]
        temperature = kwargs.get("temperature", 0.1)
        max_tokens = kwargs.get("max_tokens")

        content = await llm_service.generate(
            messages=formatted_messages,
            temperature=temperature,
            max_tokens=max_tokens
        )

        return AIResponse(
            content=content,
            model=self._model,
            usage={"prompt_tokens": 0, "completion_tokens": 0},
            raw={"model": self._model}
        )

    async def generate_stream(self, messages: list[AIMessage], **kwargs) -> AsyncGenerator[AIStreamChunk, None]:
        # Simple stream simulation or direct yield for compatibility
        # Free OpenRouter models are highly performant on fast complete requests
        formatted_messages = [
            {"role": m.role, "content": m.content} for m in messages
        ]
        content = await llm_service.generate(formatted_messages)
        yield AIStreamChunk(content=content, done=True)

    async def generate_json(self, messages: list[AIMessage], **kwargs) -> dict:
        formatted_messages = [
            {"role": m.role, "content": m.content} for m in messages
        ]
        temperature = kwargs.get("temperature", 0.1)
        # Call llm_service.generate_json with secure empty fallback
        return await llm_service.generate_json(
            messages=formatted_messages,
            schema_fallback={},
            temperature=temperature
        )
