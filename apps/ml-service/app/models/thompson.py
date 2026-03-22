"""
Thompson Sampling for optimal notification time selection.

Uses Beta-Bernoulli conjugate model: each hour slot maintains independent
Beta(alpha, beta) parameters. Alpha tracks "opens" and beta tracks "ignores".

Inference: sample from each slot's Beta distribution, pick the argmax.
This naturally balances exploration vs exploitation.
"""

from __future__ import annotations

from typing import Any

import numpy as np
from scipy.stats import beta as beta_dist


class ThompsonSampling:
    """Thompson Sampling bandit over 24 hourly time slots."""

    __slots__ = ("n_slots", "alphas", "betas")

    def __init__(self, n_slots: int = 24) -> None:
        self.n_slots = n_slots
        # Uniform prior: Beta(1, 1) = Uniform(0, 1)
        self.alphas = np.ones(n_slots, dtype=np.float64)
        self.betas = np.ones(n_slots, dtype=np.float64)

    def update(self, slot: int, reward: bool) -> None:
        """Update the posterior for a single observation."""
        if not 0 <= slot < self.n_slots:
            return
        if reward:
            self.alphas[slot] += 1.0
        else:
            self.betas[slot] += 1.0

    def sample(self) -> int:
        """Draw one sample per arm and return the argmax slot."""
        samples = np.array(
            [
                beta_dist.rvs(a, b)
                for a, b in zip(self.alphas, self.betas)
            ]
        )
        return int(np.argmax(samples))

    def get_distribution(self) -> list[dict[str, Any]]:
        """Return per-slot mean and confidence for the current posterior."""
        results: list[dict[str, Any]] = []
        for i in range(self.n_slots):
            a = self.alphas[i]
            b = self.betas[i]
            mean = a / (a + b)
            # Confidence: 1 - variance (scaled to [0,1])
            variance = beta_dist.var(a, b)
            confidence = max(0.0, min(1.0, 1.0 - variance))
            observations = int(a + b - 2)  # subtract the prior
            results.append(
                {
                    "slot": i,
                    "mean": round(float(mean), 4),
                    "confidence": round(float(confidence), 4),
                    "observations": observations,
                }
            )
        return results

    def fit_from_history(
        self,
        notification_history: list[dict[str, Any]],
    ) -> None:
        """
        Batch-update from historical notification data.

        Each record must have:
          - sent_hour (int 0-23)
          - opened_at (non-None = success, None = failure)
        """
        for record in notification_history:
            slot = int(record.get("sent_hour", 0))
            opened = record.get("opened_at") is not None
            self.update(slot, opened)

    def get_top_slots(self, n: int = 3) -> list[dict[str, Any]]:
        """Return top-n slots by posterior mean, with confidence."""
        dist = self.get_distribution()
        sorted_dist = sorted(dist, key=lambda d: d["mean"], reverse=True)
        return sorted_dist[:n]
