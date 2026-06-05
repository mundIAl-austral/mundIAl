"""
Generates a short explanation string for each recommendation
based on the top-scoring feature dimensions.
"""

from __future__ import annotations

import numpy as np

from app.ml.feature_engineering import FEATURE_NAMES
from app.modules.recommendations.recommendations_schemas import MatchData, UserProfile

_FEATURE_TEMPLATES: dict[str, str] = {
    "team_affinity": "uno de tus equipos favoritos juega este partido",
    "rival_affinity": "juega un rival de tu equipo favorito",
    "star_player_playing": "uno de tus jugadores favoritos está en este partido",
    "availability_score": "el horario encaja perfecto con tu disponibilidad",
    "rivalry_index": "es una rivalidad histórica de alta intensidad",
    "star_power": "ambas selecciones están llenas de figuras de clase mundial",
    "group_stakes": "la clasificación del grupo está en juego",
    "expected_competitiveness": "los equipos están muy parejos en el ranking",
    "narrative_score": "es un partido con gran peso narrativo en el torneo",
    "regional_affinity": "compite una selección de tu región",
    "playstyle_affinity": "hay jugadores con el estilo de juego que te gusta",
}

_PENALTY_TEMPLATES: dict[str, str] = {
    "timezone_penalty": "el horario de inicio es incómodo para tu zona horaria",
    "availability_score": "el partido cae fuera de tus horarios disponibles",
}

_CATEGORY_INTROS: dict[str, str] = {
    "imperdible": "Imperdible",
    "vale_la_pena": "Vale la pena",
    "para_el_resumen": "Mirá el resumen",
}


def explain(
    profile: UserProfile,
    match: MatchData,
    category: str,
    features: np.ndarray,
) -> str:
    intro = _CATEGORY_INTROS.get(category, "Match")

    # Identify top positive driver
    positive_indices = [i for i, n in enumerate(FEATURE_NAMES) if n != "timezone_penalty"]
    top_idx = max(positive_indices, key=lambda i: features[i])
    top_feature = FEATURE_NAMES[top_idx]
    reason = _FEATURE_TEMPLATES.get(top_feature, "es un partido interesante")

    # Identify main obstacle (if any)
    has_penalty = features[4] > 0.5  # timezone_penalty index
    no_availability = features[3] < 0.3  # availability_score index
    obstacle = ""
    if category in ("vale_la_pena", "para_el_resumen"):
        if has_penalty:
            obstacle = ", aunque el horario de inicio es incómodo para vos"
        elif no_availability:
            obstacle = ", aunque cae fuera de tus horarios disponibles"

    return f"{intro}: {reason}{obstacle}."
