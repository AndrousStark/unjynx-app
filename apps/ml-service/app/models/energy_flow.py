"""
Energy Flow Engine — predicts user energy levels across the 24-hour day.

Uses a Gaussian Process Regressor with RBF + White noise kernel to produce
smooth energy curves with uncertainty estimates from sparse observations
(pomodoro focus ratings, task completion bursts, etc.).

Predictions are fast (<50ms for 24 points) since the GP fits on at most
~200 data points per user (aggregated hourly averages over 90 days).
"""

from __future__ import annotations

from typing import Any

import numpy as np
from sklearn.gaussian_process import GaussianProcessRegressor
from sklearn.gaussian_process.kernels import RBF, WhiteKernel


class EnergyFlowEngine:
    """Gaussian Process model for hourly energy level prediction."""

    __slots__ = ("_gp", "_is_fitted")

    def __init__(self) -> None:
        kernel = RBF(length_scale=3.0) + WhiteKernel(noise_level=0.1)
        self._gp = GaussianProcessRegressor(
            kernel=kernel,
            alpha=0.1,
            n_restarts_optimizer=3,
            normalize_y=True,
        )
        self._is_fitted = False

    def fit(self, hours: list[float], ratings: list[float]) -> None:
        """
        Fit the GP on observed (hour, energy_rating) pairs.

        hours: list of floats in [0, 23]
        ratings: list of floats in [1, 5] (or whatever scale the user uses)
        """
        if len(hours) < 2 or len(ratings) < 2:
            self._is_fitted = False
            return

        X = np.array(hours, dtype=np.float64).reshape(-1, 1)
        y = np.array(ratings, dtype=np.float64)
        self._gp.fit(X, y)
        self._is_fitted = True

    def predict(self) -> list[dict[str, Any]]:
        """
        Predict energy level for all 24 hours.

        Returns list of dicts with: hour, energy, confidence, std.
        If not fitted, returns a flat default curve.
        """
        X_pred = np.arange(24, dtype=np.float64).reshape(-1, 1)

        if not self._is_fitted:
            return [
                {
                    "hour": int(h),
                    "energy": 3.0,
                    "confidence": 0.0,
                    "std": 1.0,
                }
                for h in range(24)
            ]

        y_pred, y_std = self._gp.predict(X_pred, return_std=True)

        return [
            {
                "hour": int(h),
                "energy": round(float(e), 2),
                "confidence": round(float(max(0.0, 1.0 - s)), 2),
                "std": round(float(s), 3),
            }
            for h, e, s in zip(
                X_pred.flatten(), y_pred, y_std
            )
        ]

    def get_peak_hours(self, n: int = 3) -> list[dict[str, Any]]:
        """Return the top-n hours by predicted energy."""
        forecast = self.predict()
        sorted_hours = sorted(
            forecast, key=lambda d: d["energy"], reverse=True
        )
        return sorted_hours[:n]

    def get_low_hours(self, n: int = 3) -> list[dict[str, Any]]:
        """Return the bottom-n hours by predicted energy."""
        forecast = self.predict()
        sorted_hours = sorted(
            forecast, key=lambda d: d["energy"]
        )
        return sorted_hours[:n]

    @staticmethod
    def aggregate_sessions(
        sessions: list[dict[str, Any]],
    ) -> tuple[list[float], list[float]]:
        """
        Aggregate pomodoro sessions into hourly mean ratings.

        Returns (hours, ratings) suitable for fit().
        """
        hourly: dict[int, list[float]] = {}
        for session in sessions:
            hour = int(session.get("hour", 0))
            rating = session.get("focus_rating")
            if rating is not None:
                hourly.setdefault(hour, []).append(float(rating))

        if not hourly:
            return [], []

        hours: list[float] = []
        ratings: list[float] = []
        for h in sorted(hourly.keys()):
            hours.append(float(h))
            ratings.append(float(np.mean(hourly[h])))

        return hours, ratings
