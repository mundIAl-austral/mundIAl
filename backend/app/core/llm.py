"""LangChain chat-model provider (OpenRouter).

Builds a single cached ChatOpenAI client pointed at OpenRouter from settings.
Not wired into any endpoint yet; call get_chat_model() where needed.
"""

from __future__ import annotations

from functools import lru_cache

from langchain_openai import ChatOpenAI
from pydantic import SecretStr

from app.core.config import settings

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


def _build_chat_model(*, temperature: float, max_tokens: int | None = None) -> ChatOpenAI:
    if not settings.model_api_key:
        raise RuntimeError("MODEL_API_KEY is not set. Add it to backend/.env to use the LLM.")
    kwargs: dict[str, object] = {
        "model": settings.model,
        "api_key": SecretStr(settings.model_api_key),
        "base_url": OPENROUTER_BASE_URL,
        "temperature": temperature,
    }
    if max_tokens is not None:
        kwargs["max_tokens"] = max_tokens
    return ChatOpenAI(**kwargs)  # type: ignore[arg-type]


@lru_cache(maxsize=1)
def get_chat_model() -> ChatOpenAI:
    return _build_chat_model(
        temperature=settings.model_temperature,
        max_tokens=settings.model_max_tokens,
    )


@lru_cache(maxsize=1)
def get_topic_classifier_model() -> ChatOpenAI:
    """Low temperature for strict on-topic classification."""
    return _build_chat_model(temperature=0.0)
