"""
Energy flow forecast endpoint — Gaussian Process regression.

POST /ml/energy-forecast
  Body: { "userId": "uuid" }
  Response: { "forecast": [...], "peakHours": [...], "lowHours": [...] }
"""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import get_redis
from app.models.energy_flow import EnergyFlowEngine
from app.services.data_loader import get_pomodoro_sessions

logger = logging.getLogger(__name__)

router = APIRouter(tags=["energy"])

CACHE_PREFIX = "ml:energy:"
CACHE_TTL_SECONDS = 1800  # 30 minutes


class EnergyRequest(BaseModel):
    userId: str = Field(..., min_length=1, description="User profile ID")


class EnergyResponse(BaseModel):
    forecast: list[dict[str, Any]]
    peakHours: list[dict[str, Any]]
    lowHours: list[dict[str, Any]]
    dataPoints: int


@router.post("/energy-forecast", response_model=EnergyResponse)
async def energy_forecast(body: EnergyRequest):
    """
    Predict the user's energy curve over 24 hours.

    Uses GP regression on historical pomodoro/focus session data.
    Cached for 30 minutes (energy patterns change slowly).
    """
    user_id = body.userId

    # ── Check cache ──────────────────────────────────────────────────────
    try:
        r = get_redis()
        cached = r.get(f"{CACHE_PREFIX}{user_id}")
        if cached:
            return json.loads(cached)
    except Exception:
        logger.debug("Redis cache miss or unavailable", exc_info=True)

    # ── Load data & fit model ────────────────────────────────────────────
    sessions = get_pomodoro_sessions(user_id, days=90)

    engine = EnergyFlowEngine()
    hours, ratings = EnergyFlowEngine.aggregate_sessions(sessions)
    engine.fit(hours, ratings)

    forecast = engine.predict()
    peak_hours = engine.get_peak_hours(n=3)
    low_hours = engine.get_low_hours(n=3)

    result = EnergyResponse(
        forecast=forecast,
        peakHours=peak_hours,
        lowHours=low_hours,
        dataPoints=len(sessions),
    )

    # ── Cache result ─────────────────────────────────────────────────────
    try:
        r = get_redis()
        r.setex(
            f"{CACHE_PREFIX}{user_id}",
            CACHE_TTL_SECONDS,
            result.model_dump_json(),
        )
    except Exception:
        logger.debug("Failed to cache energy forecast", exc_info=True)

    return result
