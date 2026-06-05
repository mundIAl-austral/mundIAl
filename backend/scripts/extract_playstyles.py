"""
Extract and aggregate playstyles by club and national team.

Usage:
    cd backend && uv run python scripts/extract_playstyles.py
"""

import asyncio
import csv
from collections import defaultdict
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.models.club import Club
from app.db.models.team import Team


SCRIPTS_DIR = Path(__file__).parent
MALE_PLAYERS_CSV = SCRIPTS_DIR / "male_players.csv"
WC2026_SQUAD_CSV = SCRIPTS_DIR / "wc2026_squad_players.csv"


def _position_to_group(position: str) -> str:
    """Map squad position (GK/DF/MF/FW) to group (defence/midfield/forwards)."""
    pos = position.strip().upper()
    if pos == "GK":
        return "defence"
    elif pos == "DF":
        return "defence"
    elif pos == "MF":
        return "midfield"
    elif pos == "FW":
        return "forwards"
    return "midfield"  # default


def _parse_playstyles(playstyle_str: str) -> set[str]:
    """Parse comma-separated playstyle string into a set of unique styles."""
    if not playstyle_str or not playstyle_str.strip():
        return set()
    # Remove quotes if present (from CSV parsing)
    playstyle_str = playstyle_str.strip().strip('"')
    styles = {s.strip() for s in playstyle_str.split(",") if s.strip()}
    return styles


def _extract_clubs_playstyles() -> dict[str, dict[str, set[str]]]:
    """Extract playstyles by club and position from male_players.csv."""
    if not MALE_PLAYERS_CSV.exists():
        print(f"  WARNING: {MALE_PLAYERS_CSV} not found, skipping club extraction")
        return {}

    club_data: dict[str, dict[str, set[str]]] = defaultdict(
        lambda: {"defence": set(), "midfield": set(), "forwards": set()}
    )

    with MALE_PLAYERS_CSV.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            club_val = row.get("Team")
            if not club_val:
                continue
            club = club_val.strip()
            if not club:
                continue

            position = _position_to_group(row.get("Position", ""))
            playstyles = _parse_playstyles(row.get("play style", ""))

            club_data[club][position].update(playstyles)

    return club_data


def _extract_teams_playstyles() -> dict[str, dict[str, set[str]]]:
    """Extract playstyles by national team and position from wc2026_squad_players.csv."""
    if not WC2026_SQUAD_CSV.exists():
        print(f"  WARNING: {WC2026_SQUAD_CSV} not found, skipping team extraction")
        return {}

    team_data: dict[str, dict[str, set[str]]] = defaultdict(
        lambda: {"defence": set(), "midfield": set(), "forwards": set()}
    )

    with WC2026_SQUAD_CSV.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            nation_val = row.get("squad_nation")
            if not nation_val:
                continue
            nation = nation_val.strip()
            if not nation:
                continue

            position = _position_to_group(row.get("squad_position", ""))
            playstyles = _parse_playstyles(row.get("play style", ""))

            team_data[nation][position].update(playstyles)

    return team_data


async def seed_clubs(
    session: AsyncSession, club_data: dict[str, dict[str, set[str]]]
) -> None:
    """Seed clubs table idempotently."""
    for club_name, positions in club_data.items():
        result = await session.execute(select(Club).where(Club.name == club_name))
        existing = result.scalar_one_or_none()

        defence = sorted(positions["defence"])
        midfield = sorted(positions["midfield"])
        forwards = sorted(positions["forwards"])

        if existing:
            existing.playstyles_defence = defence
            existing.playstyles_midfield = midfield
            existing.playstyles_forwards = forwards
            continue

        club = Club(
            name=club_name,
            playstyles_defence=defence,
            playstyles_midfield=midfield,
            playstyles_forwards=forwards,
        )
        session.add(club)


async def seed_teams(
    session: AsyncSession, team_data: dict[str, dict[str, set[str]]]
) -> None:
    """Update teams table with playstyles idempotently."""
    for nation, positions in team_data.items():
        result = await session.execute(select(Team).where(Team.name == nation))
        team = result.scalar_one_or_none()

        if team is None:
            print(f"  WARNING: no team for nation {nation!r}, skipping playstyles")
            continue

        defence = sorted(positions["defence"])
        midfield = sorted(positions["midfield"])
        forwards = sorted(positions["forwards"])

        team.playstyles_defence = defence
        team.playstyles_midfield = midfield
        team.playstyles_forwards = forwards


async def main() -> None:
    print("Extracting club playstyles...")
    club_data = _extract_clubs_playstyles()
    print(f"  {len(club_data)} clubs found")

    print("Extracting national team playstyles...")
    team_data = _extract_teams_playstyles()
    print(f"  {len(team_data)} teams found")

    engine = create_async_engine(settings.database_url)
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with factory() as session, session.begin():
        print("Seeding clubs...")
        await seed_clubs(session, club_data)

        print("Seeding team playstyles...")
        await seed_teams(session, team_data)

    await engine.dispose()
    print("Playstyle extraction complete.")


if __name__ == "__main__":
    asyncio.run(main())
