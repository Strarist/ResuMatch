import os
import json
import logging
import asyncio
import httpx
from typing import List, Dict, Any, Optional
from app.config import get_settings

logger = logging.getLogger(__name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

class OpenRouterLLMService:
    def __init__(self):
        settings = get_settings()
        self.api_key = settings.openrouter_api_key
        self.default_model = settings.openrouter_model

        self.fallbacks = [
            "google/gemma-7b-it:free",
            "mistralai/mistral-7b-instruct:free"
        ]
        self.timeout = 45.0
        self.max_retries = 3

    def _get_headers(self) -> Dict[str, str]:
        headers = {
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Skillyn Career Platform"
        }
        if self.api_key:
            headers["Authorization"] = f"Bearer {self.api_key}"
        return headers

    async def generate(self, messages: List[Dict[str, str]], temperature: float = 0.1, max_tokens: Optional[int] = None) -> str:
        """Call OpenRouter LLM API with full retries, backoff, and model failover chains."""
        models_to_try = [self.default_model] + self.fallbacks

        last_error = None
        for model in models_to_try:
            logger.info(f"Attempting inference via OpenRouter with model: {model}")

            # Reset retry counter for each model attempt
            for attempt in range(self.max_retries):
                try:
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        payload: Dict[str, Any] = {
                            "model": model,
                            "messages": messages,
                            "temperature": temperature
                        }
                        if max_tokens:
                            payload["max_tokens"] = max_tokens

                        response = await client.post(
                            OPENROUTER_URL,
                            headers=self._get_headers(),
                            json=payload
                        )

                        # Handle rate limit (429) specifically with wait and retry
                        if response.status_code == 429:
                            wait_time = (attempt + 1) * 3
                            logger.warning(f"OpenRouter rate limited (429). Retrying in {wait_time}s...")
                            await asyncio.sleep(wait_time)
                            continue

                        # Handle other errors
                        if response.status_code != 200:
                            if response.status_code in (401, 403):
                                raise RuntimeError(f"OpenRouter authentication failed: {response.text}")
                            raise httpx.HTTPStatusError(
                                f"OpenRouter returned status {response.status_code}: {response.text}",
                                request=response.request,
                                response=response
                            )

                        data = response.json()
                        choices = data.get("choices", [])
                        if not choices:
                            raise ValueError("OpenRouter returned empty choices list.")

                        content = choices[0].get("message", {}).get("content", "")
                        return content

                except RuntimeError as re_err:
                    # Authentication or non-retryable failure: fail fast
                    last_error = re_err
                    logger.error(f"Non-retryable failure encountered: {re_err}")
                    raise re_err
                except Exception as e:
                    last_error = e
                    wait_time = (attempt + 1) * 2
                    logger.warning(f"Attempt {attempt + 1} failed for model {model} due to: {e}. Retrying in {wait_time}s...")
                    await asyncio.sleep(wait_time)

            # If we reached here, the current model failed completely. Log and proceed to fallback.
            logger.warning(f"Model {model} failed all retry attempts. Swapping to next model in failover chain.")

        logger.error(f"All OpenRouter models failed. Last error encountered: {last_error}")
        raise RuntimeError(f"OpenRouter LLM service completely failed: {last_error}")

    async def generate_json(self, messages: List[Dict[str, str]], schema_fallback: Dict[str, Any], temperature: float = 0.1) -> Dict[str, Any]:
        """Request structured JSON, validate it, and return a dictionary. Falls back gracefully if JSON is invalid."""
        # Append explicit system instruction or format requirement to the end of user message
        modified_messages = messages.copy()
        if modified_messages:
            last_msg = modified_messages[-1]
            last_msg["content"] = last_msg["content"] + "\n\nCRITICAL: Return ONLY raw, valid JSON. Do not include markdown code block syntax (like ```json). Ensure that the keys match precisely."

        try:
            content = await self.generate(modified_messages, temperature=temperature)

            # Clean up potential markdown formatting wrapping the JSON
            cleaned = content.strip()
            if cleaned.startswith("```"):
                # strip out ```json and ```
                lines = cleaned.splitlines()
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines and lines[-1].startswith("```"):
                    lines = lines[:-1]
                cleaned = "\n".join(lines).strip()

            return json.loads(cleaned)
        except Exception as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}. Returning secure fallback schema.")
            return schema_fallback

# Singleton global instance
llm_service = OpenRouterLLMService()
