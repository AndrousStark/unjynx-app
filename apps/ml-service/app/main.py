"""
UNJYNX ML Service — FastAPI application entry point.

Provides AI-powered endpoints for:
- Optimal notification time (Thompson Sampling)
- Task suggestions (LinUCB contextual bandits)
- Energy flow forecasting (Gaussian Process)
- Habit pattern detection (Prophet)
"""

from __future__ import annotations

from fastapi import FastAPI

from app.routes import energy, health, optimal_time, patterns, suggest_tasks

app = FastAPI(
    title="UNJYNX ML Service",
    version="1.0.0",
    description="Machine learning microservice for UNJYNX productivity app",
)

app.include_router(health.router, prefix="/ml")
app.include_router(optimal_time.router, prefix="/ml")
app.include_router(suggest_tasks.router, prefix="/ml")
app.include_router(energy.router, prefix="/ml")
app.include_router(patterns.router, prefix="/ml")
