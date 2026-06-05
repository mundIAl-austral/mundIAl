from __future__ import annotations

import numpy as np
import pytest
from pydantic import ValidationError

from app.ml.weight_tuner import adjust_weights
from app.modules.recommendations.recommendations_schemas import FeedbackItem


def test_feedback_item_accepts_maybe_preference() -> None:
    item = FeedbackItem(match_id="A1", preference="tal_vez")

    assert item.preference == "tal_vez"


def test_feedback_item_maps_legacy_liked_payload() -> None:
    liked = FeedbackItem.model_validate({"match_id": "A1", "liked": True})
    disliked = FeedbackItem.model_validate({"match_id": "A2", "liked": False})

    assert liked.preference == "lo_veo"
    assert disliked.preference == "paso"


def test_feedback_item_rejects_invalid_preference() -> None:
    with pytest.raises(ValidationError):
        FeedbackItem(match_id="A1", preference="depende")  # type: ignore[arg-type]


def test_adjust_weights_accepts_soft_maybe_label() -> None:
    features = np.array(
        [
            [1.0, 0.0],
            [0.5, 0.5],
            [0.0, 1.0],
        ]
    )
    labels = np.array([1.0, 0.5, 0.0])
    default_weights = np.array([0.8, -0.4])

    weights = adjust_weights(features, labels, default_weights)

    assert weights.shape == default_weights.shape
    assert np.isfinite(weights).all()
