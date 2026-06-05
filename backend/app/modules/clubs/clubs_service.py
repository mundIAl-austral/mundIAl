from sqlalchemy import select

from app.db.models.club import Club
from app.db.session import get_db


async def get_clubs_list() -> list[str]:
    """Get all club names sorted alphabetically."""
    async for db in get_db():
        result = await db.execute(select(Club.name).order_by(Club.name))
        clubs = list(result.scalars().all())
        return clubs
    return []
