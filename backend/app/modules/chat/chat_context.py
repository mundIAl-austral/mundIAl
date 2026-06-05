"""Pure helpers: pick relevant matches and serialize context for the LLM."""

from __future__ import annotations

import json
import re
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.modules.recommendations.recommendations_schemas import MatchData

_GROUP_RE = re.compile(r"\bgrupo\s*([a-l])\b", re.IGNORECASE)
_MAX_CONTEXT_MATCHES = 15
_MAX_TOOL_MATCHES = 20


def team_mentioned(team_name: str, text: str) -> bool:
    team_lower = team_name.lower()
    text_lower = text.lower()
    if team_lower in text_lower:
        return True
    return any(len(word) >= 4 and word in team_lower for word in text_lower.split())


def select_relevant_matches(matches: list[MatchData], query: str) -> list[MatchData]:
    """Return matches tied to teams or group mentioned in the query."""
    if not matches:
        return []

    hits: list[MatchData] = []
    seen: set[str] = set()

    def add(m: MatchData) -> None:
        if m.match_id not in seen:
            seen.add(m.match_id)
            hits.append(m)

    text = query.strip()
    group_match = _GROUP_RE.search(text)
    if group_match:
        group = group_match.group(1).upper()
        for m in matches:
            if m.group.upper() == group:
                add(m)

    team_names = {m.team_a.name for m in matches} | {m.team_b.name for m in matches}
    for name in sorted(team_names, key=len, reverse=True):
        if team_mentioned(name, text):
            for m in matches:
                if m.team_a.name == name or m.team_b.name == name:
                    add(m)

    return hits[:_MAX_CONTEXT_MATCHES]


def filter_matches(
    matches: list[MatchData],
    *,
    team_name: str | None = None,
    group: str | None = None,
    round_in_group: int | None = None,
) -> list[MatchData]:
    """Filter group-stage matches for chat tools."""
    result = matches
    if group:
        g = group.strip().upper()
        result = [m for m in result if m.group.upper() == g]
    if team_name:
        t = team_name.strip()
        result = [m for m in result if m.team_a.name == t or m.team_b.name == t]
    if round_in_group is not None:
        result = [m for m in result if m.round_in_group == round_in_group]
    return result[:_MAX_TOOL_MATCHES]


def _format_local(utc_dt: datetime, timezone: str) -> str | None:
    try:
        local = utc_dt.astimezone(ZoneInfo(timezone))
        return local.strftime("%Y-%m-%d %H:%M %Z")
    except (ZoneInfoNotFoundError, KeyError):
        return None


def _round_label(round_in_group: int) -> str:
    labels = {
        1: "1.ª fecha del grupo",
        2: "2.ª fecha del grupo",
        3: "3.ª fecha del grupo",
    }
    return labels.get(round_in_group, f"fecha {round_in_group} del grupo")


def _significance_phrase(narrative_score: float) -> str:
    if narrative_score >= 8:
        return "cruce muy destacado del torneo (apertura, clásico o gran expectativa)"
    if narrative_score >= 6:
        return "partido con buen contexto y algo de repercusión"
    if narrative_score >= 4:
        return "partido interesante pero sin ser el foco del día"
    return "partido habitual de la fase de grupos"


def _rivalry_phrase(rivalry_index: float) -> str:
    if rivalry_index >= 8:
        return "rivalidad histórica muy marcada entre ambas selecciones"
    if rivalry_index >= 5:
        return "hay historial de cruces relevantes entre estos equipos"
    if rivalry_index >= 2:
        return "poco historial de enfrentamientos memorables"
    return "sin una rivalidad histórica destacada"


def _venue_phrase(venue: str, city: str, venue_country: str) -> str:
    return f"{venue}, {city}, {venue_country}"


def match_row(m: MatchData, timezone: str) -> dict[str, object]:
    """Serialize one match with human-facing keys only (no internal field names)."""
    row: dict[str, object] = {
        "grupo": m.group,
        "fecha_del_grupo": _round_label(m.round_in_group),
        "equipos": f"{m.team_a.name} vs {m.team_b.name}",
        "sede": _venue_phrase(m.venue, m.city, m.venue_country),
        "por_que_llama_la_atencion": _significance_phrase(m.narrative_score),
        "contexto_historico": _rivalry_phrase(m.rivalry_index),
        "jugadores_destacados": {
            m.team_a.name: m.team_a.squad_players[:5],
            m.team_b.name: m.team_b.squad_players[:5],
        },
    }
    local = _format_local(m.utc_datetime, timezone)
    if local:
        row["horario_local"] = local
    else:
        row["horario_utc"] = m.utc_datetime.strftime("%Y-%m-%d %H:%M UTC")
    return row


def build_match_context(
    matches: list[MatchData],
    all_count: int,
    timezone: str,
) -> str:
    """JSON string injected into the system prompt."""
    rows = [match_row(m, timezone) for m in matches]

    payload = {
        "torneo": "Copa Mundial FIFA 2026 — fase de grupos (72 partidos)",
        "total_partidos": all_count,
        "partidos_en_contexto": len(rows),
        "partidos": rows,
    }
    if not rows:
        payload["nota"] = (
            "No se detectó equipo ni grupo en la pregunta. "
            "Pedí al usuario que mencione un equipo (ej. Argentina) o un grupo (ej. grupo A)."
        )

    return json.dumps(payload, ensure_ascii=False, indent=2)
