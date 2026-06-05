"""LangChain tools that expose Mundial 2026 DB data to the chat agent."""

from __future__ import annotations

import json
from typing import Any

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from app.db.models.player import Player
from app.db.models.team import Team
from app.modules.catalog import catalog_repository
from app.modules.chat import chat_context
from app.modules.chat.chat_run_context import ChatRunContext
from app.modules.players import players_repository


def _json(payload: object) -> str:
    return json.dumps(payload, ensure_ascii=False, indent=2)


def _star_power_band(star_power: float) -> str:
    if star_power >= 8:
        return "plantel muy estrellado"
    if star_power >= 6:
        return "buen nivel de figuras"
    return "plantel equilibrado"


def _narrative_phrases(flags: dict[str, Any]) -> list[str]:
    phrases: list[str] = []
    if flags.get("defending_champion"):
        phrases.append("defensor del título")
    if flags.get("host_nation"):
        phrases.append("anfitrión del torneo")
    if flags.get("euro_champion_2024"):
        phrases.append("campeón de la Euro 2024")
    count = flags.get("wc_winner_count")
    if isinstance(count, int) and count > 0:
        phrases.append(f"{count} veces campeón del mundo")
    return phrases


def _compact_player(p: Player, team_name: str) -> dict[str, object]:
    return {
        "nombre": p.name,
        "seleccion": team_name,
        "numero": p.squad_number,
        "posicion": p.squad_position,
        "posicion_detallada": p.detailed_position,
        "ovr": p.overall_rating,
        "capitan": p.is_captain,
        "club": p.club,
        "estilos_de_juego": p.play_styles,
    }


def _compact_player_from_name(p: Player) -> dict[str, object]:
    team_name = p.team.name if p.team else ""
    return _compact_player(p, team_name)


class _MatchesInput(BaseModel):
    team_name: str | None = Field(
        default=None,
        description="Exact national team name, e.g. Argentina",
    )
    group: str | None = Field(
        default=None,
        description="Group letter A–L",
    )
    round_in_group: int | None = Field(
        default=None,
        description="Group stage round 1, 2, or 3",
        ge=1,
        le=3,
    )


class _SearchPlayersInput(BaseModel):
    query: str = Field(..., min_length=2, description="Substring of player name")
    limit: int = Field(default=8, ge=1, le=20)


class _TeamNameInput(BaseModel):
    team_name: str = Field(..., description="Exact national team name")


class _PlayerNameInput(BaseModel):
    player_name: str = Field(..., description="Exact player name")


def create_chat_tools(ctx: ChatRunContext) -> list[StructuredTool]:
    """Build tools bound to one chat request (shared match cache)."""

    async def get_tournament_summary() -> str:
        matches = await ctx.matches()
        return _json(
            {
                "torneo": "Copa Mundial FIFA 2026 — fase de grupos",
                "total_partidos": len(matches),
                "grupos": [chr(ord("A") + i) for i in range(12)],
            }
        )

    async def list_teams() -> str:
        teams = await catalog_repository.get_all_teams(ctx.db)
        rows = [
            {
                "nombre": t.name,
                "confederacion": t.confederation,
                "ranking_fifa": t.fifa_ranking,
                "rivales_historicos": t.rival_team_names,
                "nivel_plantel": _star_power_band(t.star_power),
            }
            for t in teams
        ]
        return _json({"equipos": rows, "total": len(rows)})

    async def get_team_profile(team_name: str) -> str:
        team = await catalog_repository.get_team_by_name(ctx.db, team_name)
        if team is None:
            return _json({"error": f"No encontré la selección '{team_name}'."})
        return _json(_team_profile_payload(team))

    async def get_matches(
        team_name: str | None = None,
        group: str | None = None,
        round_in_group: int | None = None,
    ) -> str:
        all_matches = await ctx.matches()
        filtered = chat_context.filter_matches(
            all_matches,
            team_name=team_name,
            group=group,
            round_in_group=round_in_group,
        )
        rows = [chat_context.match_row(m, ctx.timezone) for m in filtered]
        payload: dict[str, object] = {
            "partidos": rows,
            "cantidad": len(rows),
            "total_torneo": len(all_matches),
        }
        if not rows:
            payload["nota"] = "No hay partidos con esos filtros. Probá otro equipo o grupo."
        return _json(payload)

    async def get_team_squad(team_name: str) -> str:
        if not await players_repository.has_any(ctx.db):
            return _json({"error": "Plantel no cargado en la base de datos."})
        players = await players_repository.get_squad(ctx.db, team_name)
        if players is None:
            return _json({"error": f"No encontré la selección '{team_name}'."})
        return _json(
            {
                "seleccion": team_name,
                "jugadores": [_compact_player(p, team_name) for p in players],
                "cantidad": len(players),
            }
        )

    async def search_players(query: str, limit: int = 8) -> str:
        if not await players_repository.has_any(ctx.db):
            return _json({"error": "Plantel no cargado en la base de datos."})
        names = await players_repository.search_names(ctx.db, query, limit)
        return _json({"consulta": query, "jugadores": names, "cantidad": len(names)})

    async def get_player_profile(player_name: str) -> str:
        if not await players_repository.has_any(ctx.db):
            return _json({"error": "Plantel no cargado en la base de datos."})
        player = await players_repository.get_best_by_name(ctx.db, player_name)
        if player is None:
            return _json({"error": f"No encontré al jugador '{player_name}'."})
        return _json({"jugador": _compact_player_from_name(player)})

    return [
        StructuredTool.from_function(
            coroutine=get_tournament_summary,
            name="get_tournament_summary",
            description="Overview of the 2026 World Cup group stage: match count and groups.",
        ),
        StructuredTool.from_function(
            coroutine=list_teams,
            name="list_teams",
            description=("All 48 national teams with confederation, FIFA ranking, and rivals."),
        ),
        StructuredTool.from_function(
            coroutine=get_team_profile,
            name="get_team_profile",
            description=("Profile of one national team: rivals, key players, narrative."),
            args_schema=_TeamNameInput,
        ),
        StructuredTool.from_function(
            coroutine=get_matches,
            name="get_matches",
            description=(
                "Group-stage fixtures. Filter by team_name, group A–L, and/or round_in_group 1–3."
            ),
            args_schema=_MatchesInput,
        ),
        StructuredTool.from_function(
            coroutine=get_team_squad,
            name="get_team_squad",
            description="Full World Cup squad for a national team (compact player cards).",
            args_schema=_TeamNameInput,
        ),
        StructuredTool.from_function(
            coroutine=search_players,
            name="search_players",
            description="Search player names in World Cup squads (min 2 characters).",
            args_schema=_SearchPlayersInput,
        ),
        StructuredTool.from_function(
            coroutine=get_player_profile,
            name="get_player_profile",
            description="One player profile by exact name (best rating if duplicated).",
            args_schema=_PlayerNameInput,
        ),
    ]


def _team_profile_payload(team: Team) -> dict[str, object]:
    return {
        "nombre": team.name,
        "confederacion": team.confederation,
        "ranking_fifa": team.fifa_ranking,
        "rivales_historicos": team.rival_team_names,
        "jugadores_clave": team.key_players,
        "nivel_plantel": _star_power_band(team.star_power),
        "contexto_torneo": _narrative_phrases(team.narrative_flags),
    }
