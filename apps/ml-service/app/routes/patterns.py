"""
Habit pattern detection endpoint — Prophet time-series analysis.

POST /ml/patterns
  Body: { "userId": "uuid" }
  Response: { "patterns": [...], "forecast": [...], "dataPoints": int }
"""

from __future__ import annotations

import json
import logging
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import get_redis
from app.models.habit import HabitDetector
from app.services.data_loader import get_progress_snapshots

logger = logging.getLogger(__name__)

router = APIRouter(tags=["patterns"])

CACHE_PREFIX = "ml:patterns:"
CACHE_TTL_SECONDS = 1800  # 30 minutes


class PatternsRequest(BaseModel):
    userId: str = Field(..., min_length=1, description="User profile ID")
    days: int = Field(default=90, ge=7, le=365, description="Lookback period in days")


class PatternsResponse(BaseModel):
    patterns: list[dict[str, Any]]
    forecast: list[dict[str, Any]]
    dataPoints: int


@router.post("/patterns", response_model=PatternsResponse)
async def detect_patterns(body: PatternsRequest):
    """
    Detect productivity patterns and forecast next 7 days.

    Uses Prophet for time-series decomposition with fallback to simple stats.
    Cached for 30 minutes.
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

    # ── Load data & detect patterns ──────────────────────────────────────
    snapshots = get_progress_snapshots(user_id, days=body.days)

    detector = HabitDetector()
    patterns, forecast = detector.detect_patterns(snapshots)

    result = PatternsResponse(
        patterns=patterns,
        forecast=forecast,
        dataPoints=len(snapshots),
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
        logger.debug("Failed to cache patterns result", exc_info=True)

    return result
