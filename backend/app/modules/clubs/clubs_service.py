from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.clubs import clubs_repository
from app.modules.clubs.clubs_schemas import GetClubsResponse


async def get_clubs(db: AsyncSession, prefix: str, limit: int, offset: int) -> GetClubsResponse:
    names, total = await clubs_repository.search_clubs(db, prefix, limit, offset)
    return GetClubsResponse(clubs=names, total=total, limit=limit, offset=offset)
