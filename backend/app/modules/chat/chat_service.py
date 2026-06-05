from __future__ import annotations

from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.llm import get_chat_model, get_topic_classifier_model
from app.modules.chat import chat_context, chat_prompts
from app.modules.chat.chat_schemas import ChatRequest, ChatResponse
from app.modules.recommendations import recommendations_repository


class TopicClassification(BaseModel):
    is_about_matches: bool = Field(
        description="True only if the user message is about World Cup 2026 group-stage matches"
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


async def _generate_answer(
    request: ChatRequest,
    match_context: str,
) -> str:
    llm = get_chat_model()
    system = chat_prompts.ANSWER_SYSTEM_TEMPLATE.format(match_context=match_context)
    lc_messages: list[SystemMessage | HumanMessage | AIMessage] = [
        SystemMessage(content=system),
    ]
    for msg in request.messages:
        if msg.role == "user":
            lc_messages.append(HumanMessage(content=msg.content))
        else:
            lc_messages.append(AIMessage(content=msg.content))

    response = await llm.ainvoke(lc_messages)
    content = response.content
    if isinstance(content, str):
        return content.strip()
    return str(content).strip()


async def chat(
    request: ChatRequest,
    db: AsyncSession,
) -> ChatResponse:
    from app.core.config import settings

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

    all_matches = await recommendations_repository.get_all_matches(db)
    relevant = chat_context.select_relevant_matches(all_matches, user_text)
    context_json = chat_context.build_match_context(
        relevant,
        all_count=len(all_matches),
        timezone=request.timezone,
    )

    answer = await _generate_answer(request, context_json)
    return ChatResponse(message=answer, refused=False)
