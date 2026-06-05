from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

MAX_MESSAGES = 20
MAX_MESSAGE_CHARS = 2000


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., min_length=1, max_length=MAX_MESSAGE_CHARS)


class ChatRequest(BaseModel):
    messages: list[ChatMessage] = Field(..., min_length=1, max_length=MAX_MESSAGES)
    timezone: str = Field(default="UTC", examples=["America/Argentina/Buenos_Aires"])

    @field_validator("messages")
    @classmethod
    def last_message_must_be_user(cls, messages: list[ChatMessage]) -> list[ChatMessage]:
        if messages[-1].role != "user":
            raise ValueError("The last message must be from the user")
        return messages


class ChatResponse(BaseModel):
    message: str
    refused: bool = False
