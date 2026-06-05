from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.club import Club


async def search_clubs(
    db: AsyncSession, prefix: str, limit: int, offset: int
) -> tuple[list[str], int]:
    """
    Club names matching a case-insensitive name prefix, paginated.
    Returns (page of names ordered alphabetically, total matching count).
    """
    stmt = select(Club.name)
    if prefix:
        stmt = stmt.where(Club.name.ilike(f"{prefix}%"))

    total = await db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
    result = await db.execute(stmt.order_by(Club.name).limit(limit).offset(offset))
    return list(result.scalars().all()), total
