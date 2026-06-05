"""
Personalization primitives — pure numpy, no new dependencies.

  farthest_point_sampling — pick k maximally-diverse matches for the feedback
                            screen, so the 5 shown span the feature space.
  adjust_weights          — nudge the linear scoring weights toward the user's
                            preview answers, L2-regularized to the prior.
"""

from __future__ import annotations

import numpy as np


def farthest_point_sampling(feature_matrix: np.ndarray, k: int = 5) -> list[int]:
    """
    Greedy farthest-point sampling over the (n, d) feature matrix.

    First point: closest to the centroid (a representative "average" match).
    Each next point: maximizes the minimum distance to all already-picked points.
    Returns k row indices (fewer if n < k).
    """
    n = feature_matrix.shape[0]
    if n <= k:
        return list(range(n))

    centroid = feature_matrix.mean(axis=0)
    first = int(np.argmin(np.linalg.norm(feature_matrix - centroid, axis=1)))
    selected = [first]

    min_dists = np.linalg.norm(feature_matrix - feature_matrix[first], axis=1)
    while len(selected) < k:
        next_idx = int(np.argmax(min_dists))
        selected.append(next_idx)
        new_dists = np.linalg.norm(feature_matrix - feature_matrix[next_idx], axis=1)
        min_dists = np.minimum(min_dists, new_dists)

    return selected


def adjust_weights(
    feedback_features: np.ndarray,  # (m, d)
    feedback_labels: np.ndarray,  # (m,) — 1=lo_veo, 0.5=tal_vez, 0=paso
    w_default: np.ndarray,  # (d,) prior weights from classifier.py
    lam: float = 1.0,
    lr: float = 0.05,
    iters: int = 50,
) -> np.ndarray:
    """
    Logistic regression fit on the feedback, regularized toward `w_default`.
    Labels may be soft values in [0, 1], so "tal vez" can stay neutral.

        loss(w) = cross_entropy(sigmoid(X @ w), y) + lam * ||w - w_default||^2

    Few samples (~5) + strong L2 to the prior keeps the result sane.
    Weights are clipped to [-5, 5] each step.
    """
    w = w_default.astype(np.float64).copy()
    X = feedback_features.astype(np.float64)
    y = feedback_labels.astype(np.float64)
    n = max(X.shape[0], 1)

    for _ in range(iters):
        p = 1.0 / (1.0 + np.exp(-(X @ w)))
        grad = X.T @ (p - y) / n + 2.0 * lam * (w - w_default)
        w = np.clip(w - lr * grad, -5.0, 5.0)

    return w
