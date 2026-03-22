"""
Data loader — fetches user data from PostgreSQL for ML model training.

All functions return plain dicts so callers are decoupled from the DB layer.
Missing data is handled gracefully by returning empty lists.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import get_pg_connection, release_pg_connection

logger = logging.getLogger(__name__)


def _safe_query(query: str, params: tuple) -> list[dict[str, Any]]:
    """Execute a query and return rows as dicts, or [] on any error."""
    conn = None
    try:
        conn = get_pg_connection()
        with conn.cursor() as cur:
            cur.execute(query, params)
            columns = [desc[0] for desc in cur.description]
            return [dict(zip(columns, row)) for row in cur.fetchall()]
    except Exception:
        logger.exception("Database query failed")
        return []
    finally:
        if conn is not None:
            release_pg_connection(conn)


def get_notification_history(
    user_id: str,
    days: int = 90,
) -> list[dict[str, Any]]:
    """
    Fetch notification send/open times for Thompson Sampling.

    Returns list of dicts with keys: sent_at, sent_hour, opened_at.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query = """
        SELECT
            sent_at,
            EXTRACT(HOUR FROM sent_at) AS sent_hour,
            opened_at
        FROM notification_log
        WHERE profile_id = %s
          AND sent_at >= %s
        ORDER BY sent_at ASC
    """
    rows = _safe_query(query, (user_id, cutoff))
    return [
        {
            "sent_at": row["sent_at"],
            "sent_hour": int(row["sent_hour"]),
            "opened_at": row.get("opened_at"),
        }
        for row in rows
    ]


def get_task_completions(
    user_id: str,
    days: int = 90,
) -> list[dict[str, Any]]:
    """
    Fetch task completion history for suggestions and pattern detection.

    Returns list of dicts with keys: task_id, title, priority, completed_at,
    created_at, due_date.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query = """
        SELECT
            id AS task_id,
            title,
            priority,
            completed_at,
            created_at,
            due_date
        FROM tasks
        WHERE profile_id = %s
          AND completed_at IS NOT NULL
          AND completed_at >= %s
        ORDER BY completed_at ASC
    """
    return _safe_query(query, (user_id, cutoff))


def get_pomodoro_sessions(
    user_id: str,
    days: int = 90,
) -> list[dict[str, Any]]:
    """
    Fetch pomodoro/focus session data for energy flow estimation.

    Returns list of dicts with keys: started_at, ended_at, duration_min,
    focus_rating, hour.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query = """
        SELECT
            started_at,
            ended_at,
            EXTRACT(EPOCH FROM (ended_at - started_at)) / 60 AS duration_min,
            focus_rating,
            EXTRACT(HOUR FROM started_at) AS hour
        FROM pomodoro_sessions
        WHERE profile_id = %s
          AND started_at >= %s
        ORDER BY started_at ASC
    """
    rows = _safe_query(query, (user_id, cutoff))
    return [
        {
            "started_at": row["started_at"],
            "ended_at": row["ended_at"],
            "duration_min": float(row.get("duration_min", 0)),
            "focus_rating": row.get("focus_rating"),
            "hour": int(row.get("hour", 0)),
        }
        for row in rows
    ]


def get_progress_snapshots(
    user_id: str,
    days: int = 90,
) -> list[dict[str, Any]]:
    """
    Fetch daily progress snapshots for habit detection.

    Returns list of dicts with keys: date, tasks_completed, tasks_created,
    focus_minutes, streak_days.
    """
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    query = """
        SELECT
            snapshot_date AS date,
            tasks_completed,
            tasks_created,
            focus_minutes,
            streak_days
        FROM progress_snapshots
        WHERE profile_id = %s
          AND snapshot_date >= %s
        ORDER BY snapshot_date ASC
    """
    return _safe_query(query, (user_id, cutoff))


def get_pending_tasks(
    user_id: str,
    limit: int = 50,
) -> list[dict[str, Any]]:
    """
    Fetch current pending (incomplete) tasks for task suggestion.

    Returns list of dicts with keys: task_id, title, priority, created_at,
    due_date, project_id.
    """
    query = """
        SELECT
            id AS task_id,
            title,
            priority,
            created_at,
            due_date,
            project_id
        FROM tasks
        WHERE profile_id = %s
          AND completed_at IS NULL
          AND is_deleted = false
        ORDER BY priority DESC, due_date ASC NULLS LAST
        LIMIT %s
    """
    return _safe_query(query, (user_id, limit))
