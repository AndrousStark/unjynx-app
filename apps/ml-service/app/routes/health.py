"""Health check endpoint for the ML service."""

from __future__ import annotations

import logging

from fastapi import APIRouter

from app.config import get_redis, get_settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():
    """
    Lightweight health check.

    Returns service status, version, and optional connectivity info.
    """
    status = "healthy"
    checks: dict[str, str] = {}

    # Redis connectivity (best-effort)
    try:
        r = get_redis()
        r.ping()
        checks["redis"] = "connected"
    except Exception:
        checks["redis"] = "unavailable"
        logger.debug("Redis health check failed", exc_info=True)

    return {
        "status": status,
        "service": "unjynx-ml",
        "version": "1.0.0",
        "checks": checks,
    }
