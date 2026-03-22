"""
LinUCB contextual bandit for task suggestion ranking.

Each "arm" is a candidate task. The context vector encodes the current
situation (hour, day, energy level, workload, streak, etc.).

The model maintains per-arm linear ridge regression parameters and uses
the Upper Confidence Bound to balance exploration vs exploitation.

Feature vector (7 dimensions):
  [hour_norm, day_norm, energy_norm, tasks_today_norm,
   streak_norm, priority_norm, task_age_norm]
"""

from __future__ import annotations

from typing import Any

import numpy as np


class LinUCB:
    """Linear Upper Confidence Bound contextual bandit."""

    __slots__ = ("alpha", "d", "_A", "_b")

    def __init__(self, n_features: int = 7, alpha: float = 1.0) -> None:
        self.alpha = alpha
        self.d = n_features
        # Per-arm parameters stored by arm_id (str)
        self._A: dict[str, np.ndarray] = {}
        self._b: dict[str, np.ndarray] = {}

    def _ensure_arm(self, arm_id: str) -> None:
        """Lazily initialise arm parameters on first encounter."""
        if arm_id not in self._A:
            self._A[arm_id] = np.eye(self.d, dtype=np.float64)
            self._b[arm_id] = np.zeros((self.d, 1), dtype=np.float64)

    def predict(
        self,
        context: list[float],
        arm_ids: list[str],
    ) -> list[tuple[str, float]]:
        """
        Score each arm given the context vector.

        Returns a list of (arm_id, ucb_score) sorted descending by score.
        """
        if len(context) != self.d:
            raise ValueError(
                f"Context has {len(context)} features, expected {self.d}"
            )

        x = np.array(context, dtype=np.float64).reshape(-1, 1)
        scores: list[tuple[str, float]] = []

        for arm_id in arm_ids:
            self._ensure_arm(arm_id)
            A_inv = np.linalg.inv(self._A[arm_id])
            theta = A_inv @ self._b[arm_id]
            exploitation = float(theta.T @ x)
            exploration = self.alpha * float(np.sqrt(x.T @ A_inv @ x))
            scores.append((arm_id, exploitation + exploration))

        return sorted(scores, key=lambda s: s[1], reverse=True)

    def update(
        self,
        arm_id: str,
        context: list[float],
        reward: float,
    ) -> None:
        """Update arm parameters after observing a reward."""
        if len(context) != self.d:
            raise ValueError(
                f"Context has {len(context)} features, expected {self.d}"
            )

        x = np.array(context, dtype=np.float64).reshape(-1, 1)
        self._ensure_arm(arm_id)
        self._A[arm_id] = self._A[arm_id] + (x @ x.T)
        self._b[arm_id] = self._b[arm_id] + (reward * x)

    def fit_from_completions(
        self,
        completions: list[dict[str, Any]],
    ) -> None:
        """
        Batch-update from task completion history.

        Each record should have: task_id, priority, created_at, completed_at.
        Reward is 1.0 for completed tasks (we only see completions here).
        Context is built from available fields.
        """
        for record in completions:
            task_id = str(record.get("task_id", ""))
            if not task_id:
                continue

            # Build a simplified context from completion data
            priority = float(record.get("priority", 2))
            context = [
                0.5,  # hour (unknown from completion record)
                0.5,  # day (unknown)
                0.5,  # energy (unknown)
                0.5,  # tasks_today (unknown)
                0.5,  # streak (unknown)
                priority / 4.0,  # priority normalised to [0, 1]
                0.5,  # task_age (unknown)
            ]
            self.update(task_id, context, reward=1.0)

    @property
    def arm_count(self) -> int:
        return len(self._A)
