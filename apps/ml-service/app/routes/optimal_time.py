"""
Optimal notification time endpoint — Thompson Sampling.

POST /ml/optimal-time
  Body: { "userId": "uuid" }
  Response: { "optimalSlot": 14, "topSlots": [...], "distribution": [...] }
"""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.config import get_redis
from app.models.thompson import ThompsonSampling
from app.services.data_loader import get_notification_history

logger = logging.getLogger(__name__)

router = APIRouter(tags=["optimal-time"])

CACHE_PREFIX = "ml:optimal-time:"
CACHE_TTL_SECONDS = 300  # 5 minutes


class OptimalTimeRequest(BaseModel):
    userId: str = Field(..., min_length=1, description="User profile ID")


class SlotInfo(BaseModel):
    slot: int
    mean: float
    confidence: float
    observations: int


class OptimalTimeResponse(BaseModel):
    optimalSlot: int
    optimalHour: str
    topSlots: list[dict[str, Any]]
    distribution: list[dict[str, Any]]
    dataPoints: int


@router.post("/optimal-time", response_model=OptimalTimeResponse)
async def get_optimal_time(body: OptimalTimeRequest):
    """
    Compute the best hour to send notifications for this user.

    Uses Thompson Sampling on notification open/ignore history.
    Results are cached in Redis for 5 minutes.
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
    history = get_notification_history(user_id, days=90)

    model = ThompsonSampling(n_slots=24)
    model.fit_from_history(history)

    optimal_slot = model.sample()
    top_slots = model.get_top_slots(n=3)
    distribution = model.get_distribution()

    result = OptimalTimeResponse(
        optimalSlot=optimal_slot,
        optimalHour=f"{optimal_slot:02d}:00",
        topSlots=top_slots,
        distribution=distribution,
        dataPoints=len(history),
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
        logger.debug("Failed to cache optimal-time result", exc_info=True)

    return result
