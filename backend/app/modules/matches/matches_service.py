from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.player import Player
from app.db.models.team import Team
from app.modules.matches import matches_repository
from app.modules.matches.matches_schemas import (
    GetMatchDetailInput,
    GetMatchDetailOutput,
    MatchDetailResponse,
    MatchPlayerDetail,
    MatchTeamDetail,
)

_POSITION_ORDER = {"GK": 0, "DF": 1, "MF": 2, "FW": 3}


def _sort_players(players: list[Player]) -> list[Player]:
    return sorted(
        players,
        key=lambda player: (
            _POSITION_ORDER.get(player.squad_position, 9),
            player.squad_number if player.squad_number is not None else 99,
            -player.overall_rating,
            player.name,
        ),
    )


def _player_detail(player: Player) -> MatchPlayerDetail:
    return MatchPlayerDetail(
        name=player.name,
        squad_number=player.squad_number,
        squad_position=player.squad_position,
        detailed_position=player.detailed_position,
        alternative_positions=player.alternative_positions,
        club=player.club,
        is_captain=player.is_captain,
        overall_rating=player.overall_rating,
        nationality=player.nationality,
        league=player.league,
        age=player.age,
        height_cm=player.height_cm,
        weight_kg=player.weight_kg,
        preferred_foot=player.preferred_foot,
        play_styles=player.play_styles,
        photo_url=player.photo_url,
        is_estimated=player.is_estimated,
        attributes=player.attributes,
    )


def _team_detail(team: Team) -> MatchTeamDetail:
    return MatchTeamDetail(
        name=team.name,
        fifa_ranking=team.fifa_ranking,
        confederation=team.confederation,
        star_power=team.star_power,
        narrative_flags=team.narrative_flags,
        players=[_player_detail(player) for player in _sort_players(list(team.players))],
    )


async def get_match_detail(
    input_data: GetMatchDetailInput,
    db: AsyncSession,
) -> GetMatchDetailOutput:
    match = await matches_repository.get_match_by_match_id(db, input_data.match_id)
    if match is None:
        raise HTTPException(status_code=404, detail=f"Match '{input_data.match_id}' not found")

    return GetMatchDetailOutput(
        match=MatchDetailResponse(
            match_id=match.match_id,
            group=match.group,
            round_in_group=match.round_in_group,
            utc_datetime=match.utc_datetime,
            venue=match.venue,
            city=match.city,
            venue_country=match.venue_country,
            narrative_score=match.narrative_score,
            rivalry_index=match.rivalry_index,
            team_a=_team_detail(match.team_a),
            team_b=_team_detail(match.team_b),
        )
    )
