from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db.models.match import Match
from app.db.models.team import Team
from app.modules.recommendations.recommendations_schemas import MatchData

# FC26 overall ratings cluster in ~[60, 90]; map a squad's top talent onto the
# 0–10 star_power scale the feature pipeline expects.
_STAR_POWER_TOP_N = 5
_OVR_FLOOR = 60.0
_OVR_CEILING = 90.0


def _derive_star_power(ovrs: list[int]) -> float:
    """Mean of the top-N overall ratings, mapped to 0–10 and clamped."""
    if not ovrs:
        return 0.0
    top = sorted(ovrs, reverse=True)[:_STAR_POWER_TOP_N]
    mean_top = sum(top) / len(top)
    scaled = (mean_top - _OVR_FLOOR) / (_OVR_CEILING - _OVR_FLOOR) * 10.0
    return max(0.0, min(10.0, scaled))


def _team_info(team: Team) -> MatchData.TeamInfo:
    # Real squad drives star_player_playing; OVRs drive star_power. Fall back to
    # the curated seed values if a team has no players loaded.
    squad_players = [p.name for p in team.players]
    star_power = (
        _derive_star_power([p.overall_rating for p in team.players])
        if team.players
        else team.star_power
    )
    return MatchData.TeamInfo(
        name=team.name,
        fifa_ranking=team.fifa_ranking,
        confederation=team.confederation,
        rival_team_names=team.rival_team_names,
        squad_players=squad_players,
        squad_play_styles=[p.play_styles for p in team.players],
        star_power=star_power,
        playstyles_defence=team.playstyles_defence or [],
        playstyles_midfield=team.playstyles_midfield or [],
        playstyles_forwards=team.playstyles_forwards or [],
    )


async def get_all_matches(db: AsyncSession) -> list[MatchData]:
    result = await db.execute(
        select(Match).options(
            selectinload(Match.team_a).selectinload(Team.players),
            selectinload(Match.team_b).selectinload(Team.players),
        )
    )
    matches = list(result.scalars().all())

    return [
        MatchData(
            match_id=m.match_id,
            group=m.group,
            team_a=_team_info(m.team_a),
            team_b=_team_info(m.team_b),
            round_in_group=m.round_in_group,
            utc_datetime=m.utc_datetime,
            venue=m.venue,
            city=m.city,
            venue_country=m.venue_country,
            narrative_score=m.narrative_score,
            rivalry_index=m.rivalry_index,
        )
        for m in matches
    ]
