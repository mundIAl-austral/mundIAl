from datetime import UTC, datetime

from app.db.models.team import Team
from app.modules.chat import chat_context
from app.modules.chat.chat_tools import _star_power_band, _team_profile_payload
from app.modules.recommendations.recommendations_schemas import MatchData


def _team(name: str) -> MatchData.TeamInfo:
    return MatchData.TeamInfo(
        name=name,
        fifa_ranking=1,
        confederation="UEFA",
        rival_team_names=[],
        squad_players=[],
        squad_play_styles=[],
        star_power=5.0,
    )


def _match(match_id: str, group: str, team_a: str, team_b: str, rnd: int = 1) -> MatchData:
    return MatchData(
        match_id=match_id,
        group=group,
        team_a=_team(team_a),
        team_b=_team(team_b),
        round_in_group=rnd,
        utc_datetime=datetime(2026, 6, 15, 18, 0, tzinfo=UTC),
        venue="Stadium",
        city="City",
        venue_country="US",
        narrative_score=5.0,
        rivalry_index=3.0,
    )


def test_filter_matches_by_team_and_group() -> None:
    matches = [
        _match("A1", "A", "Argentina", "Canada"),
        _match("B1", "B", "Brazil", "Serbia"),
        _match("A2", "A", "Argentina", "Mexico", rnd=2),
    ]
    by_team = chat_context.filter_matches(matches, team_name="Argentina")
    assert len(by_team) == 2
    by_group = chat_context.filter_matches(matches, group="B")
    assert len(by_group) == 1
    assert by_group[0].match_id == "B1"


def test_star_power_band() -> None:
    assert "muy estrellado" in _star_power_band(9.0)
    assert "equilibrado" in _star_power_band(4.0)


def test_team_profile_payload() -> None:
    team = Team(
        name="Argentina",
        fifa_ranking=3,
        confederation="CONMEBOL",
        rival_team_names=["Brazil"],
        key_players=["Lionel Messi"],
        star_power=10.0,
        narrative_flags={"defending_champion": True, "wc_winner_count": 3},
    )
    payload = _team_profile_payload(team)
    assert payload["nombre"] == "Argentina"
    assert "defensor del título" in payload["contexto_torneo"]
    assert "muy estrellado" in payload["nivel_plantel"]
