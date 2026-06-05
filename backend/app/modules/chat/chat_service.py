from __future__ import annotations

import json
from typing import Any

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage, ToolMessage
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.llm import get_chat_model, get_topic_classifier_model
from app.modules.chat import chat_prompts
from app.modules.chat.chat_run_context import ChatRunContext
from app.modules.chat.chat_schemas import ChatRequest, ChatResponse
from app.modules.chat.chat_tools import create_chat_tools


class TopicClassification(BaseModel):
    is_about_matches: bool = Field(
        description="True if the user message is about World Cup 2026 (matches, teams, squads)"
    )


async def _classify_topic(user_text: str) -> bool:
    llm = get_topic_classifier_model().with_structured_output(TopicClassification)
    result = await llm.ainvoke(
        [
            SystemMessage(content=chat_prompts.TOPIC_CLASSIFIER_SYSTEM),
            HumanMessage(content=user_text),
        ]
    )
    if isinstance(result, TopicClassification):
        return result.is_about_matches
    return bool(getattr(result, "is_about_matches", False))


def _history_messages(request: ChatRequest) -> list[HumanMessage | AIMessage]:
    out: list[HumanMessage | AIMessage] = []
    for msg in request.messages:
        if msg.role == "user":
            out.append(HumanMessage(content=msg.content))
        else:
            out.append(AIMessage(content=msg.content))
    return out


def _tool_result_content(result: object) -> str:
    if isinstance(result, str):
        return result
    return json.dumps(result, ensure_ascii=False)


async def _invoke_tool(tool: BaseTool, args: dict[str, Any]) -> str:
    raw = await tool.ainvoke(args)
    return _tool_result_content(raw)


async def _run_tool_agent(request: ChatRequest, ctx: ChatRunContext) -> str:
    tools = create_chat_tools(ctx)
    tool_by_name = {t.name: t for t in tools}
    llm = get_chat_model().bind_tools(tools)

    messages: list[SystemMessage | HumanMessage | AIMessage | ToolMessage] = [
        SystemMessage(content=chat_prompts.ANSWER_SYSTEM),
        *_history_messages(request),
    ]

    for _ in range(settings.model_max_tool_rounds):
        response = await llm.ainvoke(messages)
        if not isinstance(response, AIMessage):
            return chat_prompts.TOOL_LOOP_EXHAUSTED_REPLY

        tool_calls = response.tool_calls or []
        if not tool_calls:
            content = response.content
            if isinstance(content, str) and content.strip():
                return content.strip()
            return chat_prompts.TOOL_LOOP_EXHAUSTED_REPLY

        messages.append(response)
        for tc in tool_calls:
            name = tc.get("name") if isinstance(tc, dict) else getattr(tc, "name", None)
            args = tc.get("args") if isinstance(tc, dict) else getattr(tc, "args", {}) or {}
            tool_call_id = tc.get("id") if isinstance(tc, dict) else getattr(tc, "id", None)
            if not name or not tool_call_id:
                continue
            tool = tool_by_name.get(name)
            if tool is None:
                payload = json.dumps({"error": f"Herramienta desconocida: {name}"})
                messages.append(ToolMessage(content=payload, tool_call_id=tool_call_id))
                continue
            try:
                content = await _invoke_tool(tool, args)
            except Exception as exc:  # noqa: BLE001 — surface to model, not user stack trace
                content = json.dumps({"error": str(exc)}, ensure_ascii=False)
            messages.append(ToolMessage(content=content, tool_call_id=tool_call_id))

    return chat_prompts.TOOL_LOOP_EXHAUSTED_REPLY


async def chat(
    request: ChatRequest,
    db: AsyncSession,
) -> ChatResponse:
    if not settings.model_api_key:
        raise RuntimeError(
            "MODEL_API_KEY is not set. Add it to backend/.env to use the match chat."
        )

    user_text = request.messages[-1].content.strip()
    if not user_text:
        return ChatResponse(message=chat_prompts.OFF_TOPIC_REPLY, refused=True)

    is_about_matches = await _classify_topic(user_text)
    if not is_about_matches:
        return ChatResponse(message=chat_prompts.OFF_TOPIC_REPLY, refused=True)

    ctx = ChatRunContext(db=db, timezone=request.timezone)
    answer = await _run_tool_agent(request, ctx)
    return ChatResponse(message=answer, refused=False)
