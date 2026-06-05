from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel


class MatchPlayerDetail(BaseModel):
    name: str
    squad_number: int | None
    squad_position: str
    detailed_position: str | None
    alternative_positions: list[str]
    club: str | None
    is_captain: bool
    overall_rating: int
    nationality: str | None
    league: str | None
    age: int | None
    height_cm: int | None
    weight_kg: int | None
    preferred_foot: str | None
    play_styles: list[str]
    photo_url: str | None
    is_estimated: bool
    attributes: dict[str, int]


class MatchTeamDetail(BaseModel):
    name: str
    fifa_ranking: int
    confederation: str
    star_power: float
    narrative_flags: dict[str, Any]
    players: list[MatchPlayerDetail]


class MatchDetailResponse(BaseModel):
    match_id: str
    group: str
    round_in_group: int
    utc_datetime: datetime
    venue: str
    city: str
    venue_country: str
    narrative_score: float
    rivalry_index: float
    team_a: MatchTeamDetail
    team_b: MatchTeamDetail


class GetMatchDetailInput(BaseModel):
    match_id: str


class GetMatchDetailOutput(BaseModel):
    match: MatchDetailResponse
