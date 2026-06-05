"""Per-request cache for chat tool calls (single DB load for matches)."""

from __future__ import annotations

from dataclasses import dataclass, field

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.recommendations import recommendations_repository
from app.modules.recommendations.recommendations_schemas import MatchData


@dataclass
class ChatRunContext:
    db: AsyncSession
    timezone: str
    _matches: list[MatchData] | None = field(default=None, repr=False)

    async def matches(self) -> list[MatchData]:
        if self._matches is None:
            self._matches = await recommendations_repository.get_all_matches(self.db)
        return self._matches
