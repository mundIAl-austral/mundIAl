from datetime import UTC, datetime

from app.modules.chat import chat_context
from app.modules.recommendations.recommendations_schemas import MatchData


def _team(name: str) -> MatchData.TeamInfo:
    return MatchData.TeamInfo(
        name=name,
        fifa_ranking=1,
        confederation="UEFA",
        rival_team_names=[],
        key_players=[],
        star_power=5.0,
    )


def _match(match_id: str, group: str, team_a: str, team_b: str) -> MatchData:
    return MatchData(
        match_id=match_id,
        group=group,
        team_a=_team(team_a),
        team_b=_team(team_b),
        round_in_group=1,
        utc_datetime=datetime(2026, 6, 15, 18, 0, tzinfo=UTC),
        venue="Stadium",
        city="City",
        venue_country="US",
        narrative_score=5.0,
        rivalry_index=3.0,
    )


def test_select_by_team_name() -> None:
    matches = [_match("A1", "A", "Argentina", "Canada")]
    selected = chat_context.select_relevant_matches(matches, "¿Cuándo juega Argentina?")
    assert len(selected) == 1
    assert selected[0].match_id == "A1"


def test_select_by_group() -> None:
    matches = [
        _match("A1", "A", "Argentina", "Canada"),
        _match("B1", "B", "Brazil", "Serbia"),
    ]
    selected = chat_context.select_relevant_matches(matches, "partidos del grupo A")
    assert len(selected) == 1
    assert selected[0].group == "A"

