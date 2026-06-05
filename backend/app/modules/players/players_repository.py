from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.db.models.player import Player
from app.db.models.team import Team


async def has_any(db: AsyncSession) -> bool:
    """Cheap check: has the players table been seeded?"""
    result = await db.execute(select(Player.id).limit(1))
    return result.scalar_one_or_none() is not None


async def search_names(db: AsyncSession, q: str, limit: int) -> list[str]:
    """
    Distinct player names matching `q` (case-insensitive substring).

    Ordering: names that start with the query come first, then by the player's
    best overall rating (recognisable stars surface first), then alphabetically.
    """
    prefix = f"{q}%"
    contains = f"%{q}%"
    is_prefix = Player.name.ilike(prefix)

    stmt = (
        select(Player.name)
        .where(Player.name.ilike(contains))
        .group_by(Player.name)
        .order_by(is_prefix.desc(), func.max(Player.overall_rating).desc(), Player.name)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_play_styles_by_names(db: AsyncSession, names: list[str]) -> set[str]:
    """
    Union of EA FC26 play styles across the players matching `names`.
    Empty set when `names` is empty or no player matches.
    """
    if not names:
        return set()

    stmt = select(Player.play_styles).where(Player.name.in_(names))
    result = await db.execute(stmt)
    styles: set[str] = set()
    for row in result.scalars().all():
        styles.update(row)
    return styles


async def get_top_players(db: AsyncSession, limit: int = 32) -> list[str]:
    """
    Distinct player names ordered by overall rating descending.
    One row per name — takes the best OVR when a name appears in multiple squads.
    """
    stmt = (
        select(Player.name)
        .group_by(Player.name)
        .order_by(func.max(Player.overall_rating).desc(), Player.name)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_squad(db: AsyncSession, team_name: str) -> list[Player] | None:
    """
    Return all players for a team ordered by position group then squad number.
    Returns None if the team name does not exist.
    """
    team_result = await db.execute(select(Team).where(Team.name == team_name))
    team = team_result.scalar_one_or_none()
    if team is None:
        return None

    _POS_ORDER = {"GK": 0, "DF": 1, "MF": 2, "FW": 3}
    stmt = select(Player).where(Player.team_id == team.id).options(joinedload(Player.team))
    result = await db.execute(stmt)
    players = list(result.scalars().all())
    players.sort(
        key=lambda p: (
            _POS_ORDER.get(p.squad_position, 9),
            p.squad_number if p.squad_number is not None else 99,
            p.name,
        )
    )
    return players


async def get_country_playstyles(db: AsyncSession, country_name: str) -> set[str]:
    """
    Union of playstyles for a national team by name.
    Empty set if team not found.
    """
    if not country_name or not country_name.strip():
        return set()

    stmt = select(Team).where(Team.name == country_name.strip())
    result = await db.execute(stmt)
    team = result.scalar_one_or_none()
    if team is None:
        return set()

    styles: set[str] = set()
    styles.update(team.playstyles_defence or [])
    styles.update(team.playstyles_midfield or [])
    styles.update(team.playstyles_forwards or [])
    return styles
