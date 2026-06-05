from __future__ import annotations

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.catalog.catalog_shared import load_seed_players
from app.modules.players import players_repository
from app.modules.players.players_schemas import (
    PlayerDetail,
    PlayerSearchResponse,
    PlayerSuggestionsResponse,
    SquadResponse,
)

# Curated marquee names shown immediately on step 2 — no DB needed.
_POPULAR_PLAYERS: list[str] = [
    "Lionel Messi",
    "Kylian Mbappé",
    "Erling Haaland",
    "Vinicius Jr",
    "Cristiano Ronaldo",
    "Lamine Yamal",
    "Jude Bellingham",
    "Pedri",
    "Mohamed Salah",
    "Harry Kane",
    "Kevin De Bruyne",
    "Son Heung-min",
    "Lautaro Martínez",
    "Julián Álvarez",
    "Rodri",
    "Federico Valverde",
    "Jamal Musiala",
    "Florian Wirtz",
    "Phil Foden",
    "Bukayo Saka",
    "Marcus Thuram",
    "Antoine Griezmann",
    "Dani Olmo",
    "Bruno Fernandes",
    "Raphinha",
    "Rodrygo",
    "Endrick",
    "Darwin Núñez",
    "Luis Díaz",
    "Alexis Mac Allister",
    "Rodrigo De Paul",
    "Romelu Lukaku",
]


def _search(all_players: list[str], q: str, limit: int) -> list[str]:
    q_lower = q.lower()
    prefix = sorted(p for p in all_players if p.lower().startswith(q_lower))
    contains = sorted(
        p for p in all_players if q_lower in p.lower() and not p.lower().startswith(q_lower)
    )
    return (prefix + contains)[:limit]


async def get_suggestions(db: AsyncSession) -> PlayerSuggestionsResponse:
    if await players_repository.has_any(db):
        names = await players_repository.get_top_players(db, limit=32)
        return PlayerSuggestionsResponse(players=names)
    return PlayerSuggestionsResponse(players=_POPULAR_PLAYERS)


async def search_players(q: str, limit: int, db: AsyncSession) -> PlayerSearchResponse:
    # Prefer the seeded players table (full WC2026 squads, ~1.3k names).
    if await players_repository.has_any(db):
        names = await players_repository.search_names(db, q, limit)
        return PlayerSearchResponse(players=names)

    # Offline / unseeded fallback: curated key players from the seed file.
    return PlayerSearchResponse(players=_search(load_seed_players(), q, limit))


async def get_squad(team_name: str, db: AsyncSession) -> SquadResponse:
    players = await players_repository.get_squad(db, team_name)
    if players is None:
        raise HTTPException(status_code=404, detail=f"Team '{team_name}' not found")
    return SquadResponse(
        team=team_name,
        players=[
            PlayerDetail(
                name=p.name,
                squad_number=p.squad_number,
                squad_position=p.squad_position,
                detailed_position=p.detailed_position,
                alternative_positions=p.alternative_positions,
                club=p.club,
                is_captain=p.is_captain,
                overall_rating=p.overall_rating,
                nationality=p.nationality,
                league=p.league,
                age=p.age,
                height_cm=p.height_cm,
                weight_kg=p.weight_kg,
                preferred_foot=p.preferred_foot,
                play_styles=p.play_styles,
                photo_url=p.photo_url,
                is_estimated=p.is_estimated,
                attributes=p.attributes,
            )
            for p in players
        ],
    )
