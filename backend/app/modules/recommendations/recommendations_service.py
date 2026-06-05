from datetime import datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession

from app.ml import classifier, explainer, feature_engineering, ics_parser, weight_tuner
from app.modules.players import players_repository
from app.modules.recommendations import recommendations_repository
from app.modules.recommendations.recommendations_schemas import (
    GetPreviewOutput,
    GetRecommendationsInput,
    GetRecommendationsOutput,
    MatchData,
    MatchRecommendation,
    PreviewResponse,
    RecommendationResponse,
    ScoreBreakdown,
    UserProfile,
)

# Number of diverse matches shown on the feedback screen.
_PREVIEW_K = 5


def _local_datetime(utc_dt: datetime, tz_name: str) -> datetime | None:
    try:
        tz = ZoneInfo(tz_name)
        return utc_dt.astimezone(tz)
    except (ZoneInfoNotFoundError, KeyError):
        return None


def _build_recommendation(
    profile: UserProfile,
    match: MatchData,
    category: str,
    score: float,
    feat_row: np.ndarray,
) -> MatchRecommendation:
    explanation = explainer.explain(profile, match, category, feat_row)
    return MatchRecommendation(
        match_id=match.match_id,
        group=match.group,
        team_a=match.team_a.name,
        team_b=match.team_b.name,
        utc_datetime=match.utc_datetime,
        local_datetime=_local_datetime(match.utc_datetime, profile.timezone),
        venue=match.venue,
        city=match.city,
        score=round(float(score), 4),
        category=category,
        explanation=explanation,
        score_breakdown=ScoreBreakdown(
            team_affinity=round(feat_row[0], 3),
            rival_affinity=round(feat_row[1], 3),
            star_player_playing=round(feat_row[2], 3),
            availability_score=round(feat_row[3], 3),
            timezone_penalty=round(feat_row[4], 3),
            rivalry_index=round(feat_row[5], 3),
            star_power=round(feat_row[6], 3),
            group_stakes=round(feat_row[7], 3),
            expected_competitiveness=round(feat_row[8], 3),
            narrative_score=round(feat_row[9], 3),
            regional_affinity=round(feat_row[10], 3),
            playstyle_affinity=round(feat_row[11], 3),
        ),
    )


async def _resolve_user_play_styles(profile: UserProfile, db: AsyncSession) -> set[str]:
    """Union of play styles across the user's favorite players (empty if none)."""
    return await players_repository.get_play_styles_by_names(db, profile.favorite_players)


def _personalized_weights(
    profile: UserProfile, matches: list[MatchData], feature_matrix: np.ndarray
) -> np.ndarray | None:
    """Tune scoring weights from the user's like/dislike feedback, or None."""
    if not profile.feedback:
        return None

    index_by_id = {m.match_id: i for i, m in enumerate(matches)}
    rows: list[np.ndarray] = []
    labels: list[float] = []
    for item in profile.feedback:
        idx = index_by_id.get(item.match_id)
        if idx is None:
            continue
        rows.append(feature_matrix[idx])
        labels.append(1.0 if item.liked else 0.0)

    if not rows:
        return None

    return weight_tuner.adjust_weights(
        np.vstack(rows), np.array(labels), classifier.DEFAULT_WEIGHTS
    )


async def get_recommendations(
    input_data: GetRecommendationsInput,
    db: AsyncSession,
) -> GetRecommendationsOutput:
    profile = input_data.profile
    matches = await recommendations_repository.get_all_matches(db)

    # Parse the ICS once and pass the Calendar object to the ML pipeline.
    # _availability_score queries it per-match using recurring_ical_events,
    # so a one-off event only affects that specific match datetime.
    cal = ics_parser.parse_calendar(profile.ics_content)
    user_styles = await _resolve_user_play_styles(profile, db)

    feature_matrix = feature_engineering.compute_batch(profile, matches, cal, user_styles)
    custom_weights = _personalized_weights(profile, matches, feature_matrix)
    categories, scores, features = classifier.predict(feature_matrix, custom_weights)

    result: dict[str, list[MatchRecommendation]] = {
        "imperdible": [],
        "vale_la_pena": [],
        "para_el_resumen": [],
    }

    for match, category, score, feat_row in zip(  # noqa: B905
        matches, categories, scores, features
    ):
        rec = _build_recommendation(profile, match, category, score, feat_row)
        result[category].append(rec)

    # Sort each bucket by score descending
    for bucket in result.values():
        bucket.sort(key=lambda r: r.score, reverse=True)

    return GetRecommendationsOutput(
        response=RecommendationResponse(
            imperdible=result["imperdible"],
            vale_la_pena=result["vale_la_pena"],
            para_el_resumen=result["para_el_resumen"],
        )
    )


async def get_preview(
    input_data: GetRecommendationsInput,
    db: AsyncSession,
) -> GetPreviewOutput:
    """Pick 5 maximally-diverse matches for the user to rate (like/dislike)."""
    profile = input_data.profile
    matches = await recommendations_repository.get_all_matches(db)

    cal = ics_parser.parse_calendar(profile.ics_content)
    user_styles = await _resolve_user_play_styles(profile, db)
    feature_matrix = feature_engineering.compute_batch(profile, matches, cal, user_styles)

    # Classify on the full set so preview categories match the final ranking.
    categories, scores, features = classifier.predict(feature_matrix)
    selected = weight_tuner.farthest_point_sampling(feature_matrix, k=_PREVIEW_K)

    preview = [
        _build_recommendation(profile, matches[i], categories[i], scores[i], features[i])
        for i in selected
    ]
    return GetPreviewOutput(response=PreviewResponse(matches=preview))
