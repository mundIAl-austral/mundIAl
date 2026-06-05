"""
Seed script: populate teams and matches tables from JSON files.

Usage:
    cd backend && uv run python -m app.seed.seed
"""

import asyncio
import csv
import json
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings
from app.db.models.club import Club
from app.db.models.match import Match
from app.db.models.player import Player
from app.db.models.team import Team

SEED_DIR = Path(__file__).parent
# backend root → scripts/ holds the raw EA FC26 squad CSV (single source of truth).
PLAYERS_CSV = Path(__file__).parents[2] / "scripts" / "wc2026_squad_players.csv"

# CSV stat columns → snake_case keys stored in Player.attributes (JSONB).
_FACE_STATS = {
    "PAC": "pace",
    "SHO": "shooting",
    "PAS": "passing",
    "DRI": "dribbling",
    "DEF": "defending",
    "PHY": "physical",
}
_DETAILED_STATS = (
    "Acceleration",
    "Sprint Speed",
    "Positioning",
    "Finishing",
    "Shot Power",
    "Long Shots",
    "Volleys",
    "Penalties",
    "Vision",
    "Crossing",
    "Free Kick Accuracy",
    "Short Passing",
    "Long Passing",
    "Curve",
    "Dribbling",
    "Agility",
    "Balance",
    "Reactions",
    "Ball Control",
    "Composure",
    "Interceptions",
    "Heading Accuracy",
    "Def Awareness",
    "Standing Tackle",
    "Sliding Tackle",
    "Jumping",
    "Stamina",
    "Strength",
    "Aggression",
    "GK Diving",
    "GK Handling",
    "GK Kicking",
    "GK Positioning",
    "GK Reflexes",
)


async def seed_teams(session: AsyncSession) -> dict[str, Team]:
    raw = json.loads((SEED_DIR / "teams.json").read_text())
    team_map: dict[str, Team] = {}

    for item in raw:
        result = await session.execute(select(Team).where(Team.name == item["name"]))
        existing = result.scalar_one_or_none()
        if existing:
            team_map[item["name"]] = existing
            continue

        team = Team(
            name=item["name"],
            fifa_ranking=item["fifa_ranking"],
            confederation=item["confederation"],
            rival_team_names=item["rivals"],
            key_players=item["key_players"],
            star_power=item["star_power"],
            narrative_flags=item["narrative_flags"],
        )
        session.add(team)
        team_map[item["name"]] = team

    await session.flush()
    return team_map


async def seed_matches(session: AsyncSession, team_map: dict[str, Team]) -> None:
    raw = json.loads((SEED_DIR / "matches.json").read_text())

    for item in raw:
        result = await session.execute(select(Match).where(Match.match_id == item["match_id"]))
        if result.scalar_one_or_none():
            continue

        team_a = team_map[item["team_a"]]
        team_b = team_map[item["team_b"]]
        utc_dt = datetime.fromisoformat(item["utc_datetime"].replace("Z", "+00:00"))

        match = Match(
            match_id=item["match_id"],
            group=item["group"],
            team_a_id=team_a.id,
            team_b_id=team_b.id,
            round_in_group=item["round_in_group"],
            utc_datetime=utc_dt,
            venue=item["venue"],
            city=item["city"],
            venue_country=item["venue_country"],
            narrative_score=item["narrative_score"],
            rivalry_index=item["rivalry_index"],
        )
        session.add(match)


def _to_int(value: str) -> int | None:
    value = value.strip()
    if not value:
        return None
    try:
        return int(float(value))
    except ValueError:
        return None


def _to_list(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _build_attributes(row: dict[str, str]) -> dict[str, int]:
    attributes: dict[str, int] = {}
    for col, key in _FACE_STATS.items():
        parsed = _to_int(row.get(col, ""))
        if parsed is not None:
            attributes[key] = parsed
    for col in _DETAILED_STATS:
        parsed = _to_int(row.get(col, ""))
        if parsed is not None:
            attributes[col.lower().replace(" ", "_")] = parsed
    return attributes


async def seed_players(session: AsyncSession, team_map: dict[str, Team]) -> int:
    if not PLAYERS_CSV.exists():
        print(f"  WARNING: {PLAYERS_CSV} not found, skipping players")
        return 0

    # Idempotent: only seed if the table is empty (players have no natural key
    # in the source data — squad numbers are missing for ~65% of rows).
    existing = await session.execute(select(Player.id).limit(1))
    if existing.scalar_one_or_none() is not None:
        return 0

    count = 0
    with PLAYERS_CSV.open(encoding="utf-8") as fh:
        for row in csv.DictReader(fh):
            team = team_map.get(row["squad_nation"])
            if team is None:
                print(f"  WARNING: no team for nation {row['squad_nation']!r}, skipping player")
                continue

            ovr = _to_int(row["OVR"])
            if ovr is None:
                continue

            session.add(
                Player(
                    team_id=team.id,
                    name=row["Name"].strip(),
                    squad_number=_to_int(row["squad_number"]),
                    squad_position=row["squad_position"].strip(),
                    detailed_position=row["Position"].strip() or None,
                    alternative_positions=_to_list(row["Alternative positions"]),
                    club=row["squad_club"].strip() or None,
                    is_captain=row["captain"].strip() == "True",
                    overall_rating=ovr,
                    nationality=row["Nation"].strip() or None,
                    league=row["League"].strip() or None,
                    age=_to_int(row["Age"]),
                    height_cm=_to_int(row["Height"]),
                    weight_kg=_to_int(row["Weight"]),
                    preferred_foot=row["Preferred foot"].strip() or None,
                    play_styles=_to_list(row["play style"]),
                    photo_url=row["url"].strip() or None,
                    is_estimated=row["estimated"].strip() == "True",
                    attributes=_build_attributes(row),
                )
            )
            count += 1

    return count


async def seed_clubs(session: AsyncSession) -> int:
    """Seed clubs table from clubs.json."""
    raw = json.loads((SEED_DIR / "clubs.json").read_text())

    # Idempotent: skip if clubs already exist
    existing = await session.execute(select(Club.id).limit(1))
    if existing.scalar_one_or_none() is not None:
        return 0

    count = 0
    for club_name, playstyles in raw.items():
        club = Club(
            name=club_name,
            playstyles_defence=playstyles.get("playstyles_defence", []),
            playstyles_midfield=playstyles.get("playstyles_midfield", []),
            playstyles_forwards=playstyles.get("playstyles_forwards", []),
        )
        session.add(club)
        count += 1

    return count


async def seed_team_playstyles(session: AsyncSession, team_map: dict[str, Team]) -> None:
    """Update teams with playstyles from team_playstyles.json."""
    raw = json.loads((SEED_DIR / "team_playstyles.json").read_text())

    for nation, playstyles in raw.items():
        team = team_map.get(nation)
        if team is None:
            continue

        team.playstyles_defence = playstyles.get("playstyles_defence", [])
        team.playstyles_midfield = playstyles.get("playstyles_midfield", [])
        team.playstyles_forwards = playstyles.get("playstyles_forwards", [])


async def main() -> None:
    engine = create_async_engine(settings.database_url)
    factory = async_sessionmaker(engine, expire_on_commit=False)

    async with factory() as session, session.begin():
        print("Seeding teams...")
        team_map = await seed_teams(session)
        print(f"  {len(team_map)} teams ready")

        print("Seeding matches...")
        await seed_matches(session, team_map)
        print("  72 matches ready")

        print("Seeding players...")
        player_count = await seed_players(session, team_map)
        print(f"  {player_count} players seeded")

        print("Seeding clubs...")
        club_count = await seed_clubs(session)
        print(f"  {club_count} clubs seeded")

        print("Seeding team playstyles...")
        await seed_team_playstyles(session, team_map)
        print("  48 teams enriched with playstyles")

    await engine.dispose()
    print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(main())
