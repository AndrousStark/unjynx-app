"""Integration tests for FastAPI routes (mocked data layer)."""

from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/ml/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "unjynx-ml"
    assert data["version"] == "1.0.0"


@patch("app.routes.optimal_time.get_notification_history")
@patch("app.routes.optimal_time.get_redis")
def test_optimal_time_empty_history(mock_redis, mock_history):
    mock_history.return_value = []
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/optimal-time",
        json={"userId": "test-user-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "optimalSlot" in data
    assert 0 <= data["optimalSlot"] < 24
    assert len(data["distribution"]) == 24


@patch("app.routes.optimal_time.get_notification_history")
@patch("app.routes.optimal_time.get_redis")
def test_optimal_time_with_history(mock_redis, mock_history):
    mock_history.return_value = [
        {"sent_hour": 9, "opened_at": "2026-01-01T10:00:00Z"},
        {"sent_hour": 9, "opened_at": "2026-01-02T10:00:00Z"},
        {"sent_hour": 14, "opened_at": None},
        {"sent_hour": 14, "opened_at": None},
    ]
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/optimal-time",
        json={"userId": "test-user-1"},
    )
    assert response.status_code == 200
    data = response.json()
    # Slot 9 should have higher mean than 14
    dist = {d["slot"]: d["mean"] for d in data["distribution"]}
    assert dist[9] > dist[14]


@patch("app.routes.suggest_tasks.get_pending_tasks")
@patch("app.routes.suggest_tasks.get_task_completions")
@patch("app.routes.suggest_tasks.get_redis")
def test_suggest_tasks_empty(mock_redis, mock_completions, mock_pending):
    mock_pending.return_value = []
    mock_completions.return_value = []
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/suggest-tasks",
        json={"userId": "test-user-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["rankedTasks"] == []


@patch("app.routes.suggest_tasks.get_pending_tasks")
@patch("app.routes.suggest_tasks.get_task_completions")
@patch("app.routes.suggest_tasks.get_redis")
def test_suggest_tasks_with_candidates(mock_redis, mock_completions, mock_pending):
    mock_completions.return_value = []
    mock_pending.return_value = [
        {"task_id": "t1", "priority": 4, "created_at": None},
        {"task_id": "t2", "priority": 1, "created_at": None},
    ]
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/suggest-tasks",
        json={"userId": "test-user-1", "limit": 5},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["rankedTasks"]) == 2
    assert data["rankedTasks"][0]["rank"] == 1


@patch("app.routes.energy.get_pomodoro_sessions")
@patch("app.routes.energy.get_redis")
def test_energy_forecast_empty(mock_redis, mock_sessions):
    mock_sessions.return_value = []
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/energy-forecast",
        json={"userId": "test-user-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["forecast"]) == 24
    assert data["dataPoints"] == 0


@patch("app.routes.energy.get_pomodoro_sessions")
@patch("app.routes.energy.get_redis")
def test_energy_forecast_with_data(mock_redis, mock_sessions):
    mock_sessions.return_value = [
        {"hour": 9, "focus_rating": 5.0},
        {"hour": 10, "focus_rating": 4.5},
        {"hour": 14, "focus_rating": 2.0},
        {"hour": 15, "focus_rating": 2.5},
    ]
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/energy-forecast",
        json={"userId": "test-user-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["forecast"]) == 24
    assert len(data["peakHours"]) == 3


@patch("app.routes.patterns.get_progress_snapshots")
@patch("app.routes.patterns.get_redis")
def test_patterns_empty(mock_redis, mock_snapshots):
    mock_snapshots.return_value = []
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/patterns",
        json={"userId": "test-user-1"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["patterns"][0]["type"] == "insufficient_data"


@patch("app.routes.patterns.get_progress_snapshots")
@patch("app.routes.patterns.get_redis")
def test_patterns_with_data(mock_redis, mock_snapshots):
    from datetime import datetime, timedelta

    start = datetime(2026, 1, 1)
    mock_snapshots.return_value = [
        {
            "date": (start + timedelta(days=i)).strftime("%Y-%m-%d"),
            "tasks_completed": 5 + (i % 7) * 0.5,
        }
        for i in range(10)
    ]
    mock_redis.side_effect = Exception("no redis")
    response = client.post(
        "/ml/patterns",
        json={"userId": "test-user-1", "days": 30},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["patterns"]) >= 1
    assert len(data["forecast"]) == 7


def test_optimal_time_missing_user_id():
    response = client.post("/ml/optimal-time", json={})
    assert response.status_code == 422


def test_suggest_tasks_missing_user_id():
    response = client.post("/ml/suggest-tasks", json={})
    assert response.status_code == 422
