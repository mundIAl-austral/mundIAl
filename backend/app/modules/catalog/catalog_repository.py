from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.team import Team


async def get_all_teams(db: AsyncSession) -> list[Team]:
    result = await db.execute(
        select(Team).order_by(Team.confederation, Team.fifa_ranking, Team.name)
    )
    return list(result.scalars().all())


async def get_team_by_name(db: AsyncSession, name: str) -> Team | None:
    result = await db.execute(select(Team).where(Team.name == name))
    return result.scalar_one_or_none()
