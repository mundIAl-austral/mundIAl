from __future__ import annotations

from datetime import UTC, datetime
from types import SimpleNamespace
from typing import Any

import pytest
from fastapi import HTTPException

from app.db.models.player import Player
from app.modules.matches import matches_repository
from app.modules.matches.matches_schemas import GetMatchDetailInput
from app.modules.matches.matches_service import get_match_detail


def make_player(
    name: str,
    squad_position: str,
    squad_number: int | None,
    overall_rating: int,
) -> Player:
    return Player(
        name=name,
        squad_position=squad_position,
        squad_number=squad_number,
        detailed_position=None,
        alternative_positions=[],
        club=None,
        is_captain=False,
        overall_rating=overall_rating,
        nationality=None,
        league=None,
        age=None,
        height_cm=None,
        weight_kg=None,
        preferred_foot=None,
        play_styles=[],
        photo_url=None,
        is_estimated=False,
        attributes={},
    )


def make_team(name: str, players: list[Player]) -> SimpleNamespace:
    return SimpleNamespace(
        name=name,
        fifa_ranking=1,
        confederation="CONMEBOL",
        star_power=9.5,
        narrative_flags={},
        players=players,
    )


def make_match(team_a: SimpleNamespace, team_b: SimpleNamespace) -> SimpleNamespace:
    return SimpleNamespace(
        match_id="A1",
        group="A",
        round_in_group=1,
        utc_datetime=datetime(2026, 6, 11, 19, tzinfo=UTC),
        venue="Estadio Azteca",
        city="Mexico City",
        venue_country="Mexico",
        narrative_score=10.0,
        rivalry_index=4.0,
        team_a=team_a,
        team_b=team_b,
    )


@pytest.mark.asyncio
async def test_get_match_detail_orders_players_by_position_number_rating(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    team_a = make_team(
        "Argentina",
        [
            make_player("Forward", "FW", 9, 88),
            make_player("Goalkeeper", "GK", 23, 82),
            make_player("Better Defender", "DF", 2, 90),
            make_player("Midfielder", "MF", None, 85),
            make_player("Lower Defender", "DF", 2, 80),
        ],
    )
    match = make_match(team_a, make_team("Brazil", []))

    async def fake_get_match_by_match_id(db: Any, match_id: str) -> SimpleNamespace:
        return match

    monkeypatch.setattr(matches_repository, "get_match_by_match_id", fake_get_match_by_match_id)

    output = await get_match_detail(GetMatchDetailInput(match_id="A1"), db=None)  # type: ignore[arg-type]

    assert [player.name for player in output.match.team_a.players] == [
        "Goalkeeper",
        "Better Defender",
        "Lower Defender",
        "Midfielder",
        "Forward",
    ]


@pytest.mark.asyncio
async def test_get_match_detail_returns_empty_player_lists(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    match = make_match(make_team("Argentina", []), make_team("Brazil", []))

    async def fake_get_match_by_match_id(db: Any, match_id: str) -> SimpleNamespace:
        return match

    monkeypatch.setattr(matches_repository, "get_match_by_match_id", fake_get_match_by_match_id)

    output = await get_match_detail(GetMatchDetailInput(match_id="A1"), db=None)  # type: ignore[arg-type]

    assert output.match.team_a.players == []
    assert output.match.team_b.players == []


@pytest.mark.asyncio
async def test_get_match_detail_raises_404_for_missing_match(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    async def fake_get_match_by_match_id(db: Any, match_id: str) -> None:
        return None

    monkeypatch.setattr(matches_repository, "get_match_by_match_id", fake_get_match_by_match_id)

    with pytest.raises(HTTPException) as exc:
        await get_match_detail(GetMatchDetailInput(match_id="NOPE"), db=None)  # type: ignore[arg-type]

    assert exc.value.status_code == 404
