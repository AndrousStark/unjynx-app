"""
Task suggestion endpoint — LinUCB contextual bandit.

POST /ml/suggest-tasks
  Body: { "userId": "uuid", "context": {...}, "candidateTaskIds": [...] }
  Response: { "rankedTasks": [{ "taskId": ..., "score": ... }, ...] }

Context features (7-dim):
  hour      — current hour (0-23), normalised to [0, 1]
  day       — current day of week (0=Mon, 6=Sun), normalised
  energy    — user's current energy level (1-5), normalised
  tasksToday — tasks completed today (0-N), normalised
  streak    — current streak days (0-N), normalised
  priority  — task priority (1-4), normalised
  taskAge   — days since task creation (0-N), normalised
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.config import get_redis
from app.models.linucb import LinUCB
from app.services.data_loader import get_pending_tasks, get_task_completions

logger = logging.getLogger(__name__)

router = APIRouter(tags=["suggest-tasks"])

CACHE_PREFIX = "ml:suggest-tasks:"
CACHE_TTL_SECONDS = 300  # 5 minutes


class UserContext(BaseModel):
    hour: float = Field(default=12.0, ge=0, le=23, description="Current hour")
    day: float = Field(default=0.0, ge=0, le=6, description="Day of week (0=Mon)")
    energy: float = Field(default=3.0, ge=1, le=5, description="Energy level")
    tasksToday: float = Field(default=0.0, ge=0, description="Tasks done today")
    streak: float = Field(default=0.0, ge=0, description="Current streak days")


class SuggestTasksRequest(BaseModel):
    userId: str = Field(..., min_length=1, description="User profile ID")
    context: Optional[UserContext] = None
    candidateTaskIds: Optional[list[str]] = None
    limit: int = Field(default=10, ge=1, le=50, description="Max results")


class RankedTask(BaseModel):
    taskId: str
    score: float
    rank: int


class SuggestTasksResponse(BaseModel):
    rankedTasks: list[RankedTask]
    modelInfo: dict[str, Any]


def _build_context_vector(
    ctx: UserContext,
    priority: float,
    task_age_days: float,
) -> list[float]:
    """Normalise features into a 7-dim vector in [0, 1]."""
    return [
        ctx.hour / 23.0,
        ctx.day / 6.0,
        (ctx.energy - 1.0) / 4.0,
        min(ctx.tasksToday / 20.0, 1.0),
        min(ctx.streak / 30.0, 1.0),
        min(priority / 4.0, 1.0),
        min(task_age_days / 90.0, 1.0),
    ]


@router.post("/suggest-tasks", response_model=SuggestTasksResponse)
async def suggest_tasks(body: SuggestTasksRequest):
    """
    Rank candidate tasks for the user given current context.

    Uses LinUCB to learn per-task preferences from completion history.
    """
    user_id = body.userId
    ctx = body.context or UserContext()

    # ── Load pending tasks ───────────────────────────────────────────────
    if body.candidateTaskIds:
        # Caller provided explicit candidates — use them
        candidates = [
            {"task_id": tid, "priority": 2, "created_at": None}
            for tid in body.candidateTaskIds
        ]
    else:
        # Fetch from DB
        candidates = get_pending_tasks(user_id, limit=body.limit * 2)

    if not candidates:
        return SuggestTasksResponse(
            rankedTasks=[],
            modelInfo={"arms": 0, "historyPoints": 0},
        )

    # ── Train model on completion history ────────────────────────────────
    completions = get_task_completions(user_id, days=90)
    model = LinUCB(n_features=7, alpha=1.0)
    model.fit_from_completions(completions)

    # ── Score each candidate ─────────────────────────────────────────────
    now = datetime.now(timezone.utc)
    scored: list[tuple[str, float]] = []

    for task in candidates:
        task_id = str(task.get("task_id", ""))
        priority = float(task.get("priority", 2))
        created_at = task.get("created_at")

        if created_at and hasattr(created_at, "timestamp"):
            age_days = (now - created_at).total_seconds() / 86400.0
        else:
            age_days = 0.0

        context_vec = _build_context_vector(ctx, priority, age_days)
        arm_scores = model.predict(context_vec, [task_id])
        scored.append((task_id, arm_scores[0][1]))

    # Sort by score descending
    scored.sort(key=lambda s: s[1], reverse=True)

    ranked = [
        RankedTask(taskId=tid, score=round(score, 4), rank=i + 1)
        for i, (tid, score) in enumerate(scored[: body.limit])
    ]

    result = SuggestTasksResponse(
        rankedTasks=ranked,
        modelInfo={
            "arms": model.arm_count,
            "historyPoints": len(completions),
        },
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
        logger.debug("Failed to cache suggest-tasks result", exc_info=True)

    return result
