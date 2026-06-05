"""Pure helpers: pick relevant matches and serialize context for the LLM."""

from __future__ import annotations

import json
import re
from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from app.modules.recommendations.recommendations_schemas import MatchData

_GROUP_RE = re.compile(r"\bgrupo\s*([a-l])\b", re.IGNORECASE)
_MAX_CONTEXT_MATCHES = 15


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


def _format_local(utc_dt: datetime, timezone: str) -> str | None:
    try:
        local = utc_dt.astimezone(ZoneInfo(timezone))
        return local.strftime("%Y-%m-%d %H:%M %Z")
    except (ZoneInfoNotFoundError, KeyError):
        return None


def build_match_context(
    matches: list[MatchData],
    all_count: int,
    timezone: str,
) -> str:
    """JSON string injected into the system prompt."""
    rows = []
    for m in matches:
        rows.append(
            {
                "group": m.group,
                "round_in_group": m.round_in_group,
                "team_a": m.team_a.name,
                "team_b": m.team_b.name,
                "utc_datetime": m.utc_datetime.isoformat(),
                "local_datetime": _format_local(m.utc_datetime, timezone),
                "venue": m.venue,
                "city": m.city,
                "venue_country": m.venue_country,
                "narrative_score": m.narrative_score,
                "rivalry_index": m.rivalry_index,
                "team_a_key_players": m.team_a.key_players[:5],
                "team_b_key_players": m.team_b.key_players[:5],
            }
        )

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
