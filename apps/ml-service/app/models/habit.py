"""
Habit Pattern Detection — identifies weekly productivity patterns and trends.

Uses Facebook Prophet for time-series decomposition on daily task completion
counts. Extracts:
  - Weekly seasonality (best/worst days)
  - Trend direction (improving/declining/stable)
  - 7-day forecast

Falls back to simple statistics when Prophet cannot fit (too few data points,
constant series, etc.).
"""

from __future__ import annotations

import logging
from typing import Any

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)

# Minimum data points required for Prophet fitting
MIN_PROPHET_DAYS = 14


class HabitDetector:
    """Detects productivity patterns from daily completion data."""

    def detect_patterns(
        self,
        daily_completions: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """
        Analyse daily completion data and return (patterns, forecast).

        daily_completions: list of dicts with keys 'date' and
          'tasks_completed' (or 'y').
        Returns:
          patterns — list of detected pattern dicts
          forecast — 7-day predicted completions
        """
        if not daily_completions or len(daily_completions) < 3:
            return self._empty_patterns(), self._empty_forecast()

        try:
            return self._prophet_analysis(daily_completions)
        except Exception:
            logger.warning(
                "Prophet analysis failed, falling back to simple stats",
                exc_info=True,
            )
            return self._simple_analysis(daily_completions)

    # ── Prophet-based analysis ───────────────────────────────────────────

    def _prophet_analysis(
        self,
        daily_completions: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        from prophet import Prophet

        df = self._to_dataframe(daily_completions)

        if len(df) < MIN_PROPHET_DAYS:
            return self._simple_analysis(daily_completions)

        # Suppress Prophet's verbose cmdstanpy output
        model = Prophet(
            weekly_seasonality=True,
            daily_seasonality=False,
            yearly_seasonality=False,
            changepoint_prior_scale=0.05,
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=7)
        forecast = model.predict(future)

        patterns = self._extract_patterns(df, forecast, model)
        upcoming = self._extract_forecast(forecast)

        return patterns, upcoming

    def _extract_patterns(
        self,
        df: pd.DataFrame,
        forecast: pd.DataFrame,
        model: Any,
    ) -> list[dict[str, Any]]:
        patterns: list[dict[str, Any]] = []

        # ── Weekly peak day ──────────────────────────────────────────────
        try:
            forecast_with_day = forecast.copy()
            forecast_with_day["day_name"] = forecast_with_day["ds"].dt.day_name()
            day_effects = (
                forecast_with_day
                .groupby("day_name")["weekly"]
                .mean()
            )
            if not day_effects.empty and day_effects.std() > 0:
                best_day = day_effects.idxmax()
                worst_day = day_effects.idxmin()
                effect_range = day_effects.max() - day_effects.min()
                confidence = min(
                    abs(effect_range) / max(day_effects.std(), 0.01),
                    1.0,
                )
                patterns.append(
                    {
                        "type": "weekly_peak",
                        "description": f"Most productive on {best_day}s",
                        "best_day": best_day,
                        "worst_day": worst_day,
                        "confidence": round(float(confidence), 2),
                    }
                )
        except Exception:
            logger.debug("Could not extract weekly seasonality", exc_info=True)

        # ── Trend direction ──────────────────────────────────────────────
        try:
            trend_start = float(forecast["trend"].iloc[0])
            trend_end = float(forecast["trend"].iloc[-1])
            trend_change = trend_end - trend_start
            mean_level = float(forecast["trend"].mean())

            if mean_level > 0 and abs(trend_change) > 0.1 * mean_level:
                direction = "improving" if trend_change > 0 else "declining"
                magnitude = abs(trend_change) / max(mean_level, 0.01)
                patterns.append(
                    {
                        "type": "trend",
                        "description": (
                            f"Productivity is {direction} over the period"
                        ),
                        "direction": direction,
                        "magnitude": round(float(magnitude), 2),
                        "confidence": 0.75,
                    }
                )
            else:
                patterns.append(
                    {
                        "type": "trend",
                        "description": "Productivity is stable",
                        "direction": "stable",
                        "magnitude": 0.0,
                        "confidence": 0.6,
                    }
                )
        except Exception:
            logger.debug("Could not extract trend", exc_info=True)

        # ── Consistency check ────────────────────────────────────────────
        try:
            cv = float(df["y"].std() / max(df["y"].mean(), 0.01))
            if cv < 0.3:
                patterns.append(
                    {
                        "type": "consistency",
                        "description": "Very consistent daily output",
                        "coefficient_of_variation": round(cv, 2),
                        "confidence": 0.8,
                    }
                )
            elif cv > 1.0:
                patterns.append(
                    {
                        "type": "consistency",
                        "description": "Highly variable daily output",
                        "coefficient_of_variation": round(cv, 2),
                        "confidence": 0.7,
                    }
                )
        except Exception:
            pass

        return patterns

    def _extract_forecast(
        self,
        forecast: pd.DataFrame,
    ) -> list[dict[str, Any]]:
        tail = forecast.tail(7)
        return [
            {
                "date": row["ds"].strftime("%Y-%m-%d"),
                "predicted": round(float(max(row["yhat"], 0)), 1),
                "lower": round(float(max(row["yhat_lower"], 0)), 1),
                "upper": round(float(max(row["yhat_upper"], 0)), 1),
            }
            for _, row in tail.iterrows()
        ]

    # ── Simple fallback analysis ─────────────────────────────────────────

    def _simple_analysis(
        self,
        daily_completions: list[dict[str, Any]],
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        df = self._to_dataframe(daily_completions)
        patterns: list[dict[str, Any]] = []

        # Day-of-week pattern
        df["day_name"] = df["ds"].dt.day_name()
        day_means = df.groupby("day_name")["y"].mean()
        if not day_means.empty and day_means.std() > 0:
            best_day = day_means.idxmax()
            patterns.append(
                {
                    "type": "weekly_peak",
                    "description": f"Most productive on {best_day}s",
                    "best_day": best_day,
                    "confidence": 0.5,
                }
            )

        # Simple trend (first half vs second half)
        mid = len(df) // 2
        if mid > 0:
            first_half = float(df["y"].iloc[:mid].mean())
            second_half = float(df["y"].iloc[mid:].mean())
            if second_half > first_half * 1.1:
                patterns.append(
                    {
                        "type": "trend",
                        "description": "Productivity is improving",
                        "direction": "improving",
                        "confidence": 0.5,
                    }
                )
            elif second_half < first_half * 0.9:
                patterns.append(
                    {
                        "type": "trend",
                        "description": "Productivity is declining",
                        "direction": "declining",
                        "confidence": 0.5,
                    }
                )

        # Simple forecast: repeat recent 7-day average
        recent_mean = float(df["y"].tail(7).mean()) if len(df) >= 7 else float(df["y"].mean())
        last_date = df["ds"].max()
        forecast = [
            {
                "date": (last_date + pd.Timedelta(days=i + 1)).strftime(
                    "%Y-%m-%d"
                ),
                "predicted": round(recent_mean, 1),
                "lower": round(max(recent_mean * 0.7, 0), 1),
                "upper": round(recent_mean * 1.3, 1),
            }
            for i in range(7)
        ]

        return patterns, forecast

    # ── Helpers ──────────────────────────────────────────────────────────

    @staticmethod
    def _to_dataframe(
        daily_completions: list[dict[str, Any]],
    ) -> pd.DataFrame:
        """Convert raw records to a Prophet-compatible DataFrame."""
        df = pd.DataFrame(daily_completions)
        rename_map: dict[str, str] = {}
        if "date" in df.columns:
            rename_map["date"] = "ds"
        if "tasks_completed" in df.columns:
            rename_map["tasks_completed"] = "y"
        if rename_map:
            df = df.rename(columns=rename_map)

        df["ds"] = pd.to_datetime(df["ds"])
        df["y"] = pd.to_numeric(df["y"], errors="coerce").fillna(0)
        return df.sort_values("ds").reset_index(drop=True)

    @staticmethod
    def _empty_patterns() -> list[dict[str, Any]]:
        return [
            {
                "type": "insufficient_data",
                "description": "Not enough data to detect patterns yet",
                "confidence": 0.0,
            }
        ]

    @staticmethod
    def _empty_forecast() -> list[dict[str, Any]]:
        return []
