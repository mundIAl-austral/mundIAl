from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.match import Match
from app.db.models.team import Team


async def get_match_by_match_id(db: AsyncSession, match_id: str) -> Match | None:
    result = await db.execute(
        select(Match)
        .where(Match.match_id == match_id)
        .options(
            selectinload(Match.team_a).selectinload(Team.players),
            selectinload(Match.team_b).selectinload(Team.players),
        )
    )
    return result.scalar_one_or_none()
