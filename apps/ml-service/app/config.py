"""
Application configuration — reads DATABASE_URL and REDIS_URL from environment,
creates PostgreSQL connection pool and Redis client lazily.
"""

from __future__ import annotations

import os
from functools import lru_cache
from typing import Optional

import psycopg2
import psycopg2.pool
import redis
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Immutable settings loaded once from environment variables."""

    __slots__ = ("database_url", "redis_url", "log_level")

    def __init__(self) -> None:
        self.database_url: str = os.getenv(
            "DATABASE_URL",
            "postgresql://todoapp:todoapp_dev_password@localhost:5432/todoapp",
        )
        self.redis_url: str = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.log_level: str = os.getenv("LOG_LEVEL", "info")


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


# ── PostgreSQL connection pool (lazy) ────────────────────────────────────

_pg_pool: Optional[psycopg2.pool.ThreadedConnectionPool] = None


def get_pg_pool() -> psycopg2.pool.ThreadedConnectionPool:
    """Return a shared PostgreSQL connection pool, created on first call."""
    global _pg_pool
    if _pg_pool is None:
        settings = get_settings()
        _pg_pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=5,
            dsn=settings.database_url,
        )
    return _pg_pool


def get_pg_connection():
    """Borrow a connection from the pool. Caller must return it."""
    return get_pg_pool().getconn()


def release_pg_connection(conn) -> None:
    """Return a connection to the pool."""
    get_pg_pool().putconn(conn)


# ── Redis client (lazy) ──────────────────────────────────────────────────

_redis_client: Optional[redis.Redis] = None


def get_redis() -> redis.Redis:
    """Return a shared Redis client, created on first call."""
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        _redis_client = redis.from_url(
            settings.redis_url,
            decode_responses=True,
            socket_connect_timeout=5,
        )
    return _redis_client
