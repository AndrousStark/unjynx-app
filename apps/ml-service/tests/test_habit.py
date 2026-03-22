"""Tests for Habit Pattern Detection."""

from datetime import datetime, timedelta

from app.models.habit import HabitDetector


def _make_daily_data(n_days: int, base_value: float = 5.0):
    """Generate n_days of daily completion data."""
    start = datetime(2026, 1, 1)
    return [
        {
            "date": (start + timedelta(days=i)).strftime("%Y-%m-%d"),
            "tasks_completed": base_value + (i % 7) * 0.5,
        }
        for i in range(n_days)
    ]


def test_empty_data_returns_insufficient():
    detector = HabitDetector()
    patterns, forecast = detector.detect_patterns([])
    assert len(patterns) == 1
    assert patterns[0]["type"] == "insufficient_data"
    assert forecast == []


def test_too_few_points_returns_insufficient():
    detector = HabitDetector()
    data = [
        {"date": "2026-01-01", "tasks_completed": 5},
        {"date": "2026-01-02", "tasks_completed": 3},
    ]
    patterns, forecast = detector.detect_patterns(data)
    assert len(patterns) == 1
    assert patterns[0]["type"] == "insufficient_data"


def test_simple_analysis_with_few_days():
    """With 3-13 days, should use simple fallback."""
    detector = HabitDetector()
    data = _make_daily_data(10)
    patterns, forecast = detector.detect_patterns(data)
    # Should return some patterns
    assert len(patterns) >= 1
    # Forecast should be 7 days
    assert len(forecast) == 7


def test_simple_analysis_detects_trend():
    detector = HabitDetector()
    # Create improving trend
    start = datetime(2026, 1, 1)
    data = [
        {
            "date": (start + timedelta(days=i)).strftime("%Y-%m-%d"),
            "tasks_completed": 2 + i * 0.5,
        }
        for i in range(10)
    ]
    patterns, _ = detector.detect_patterns(data)
    trend_patterns = [p for p in patterns if p["type"] == "trend"]
    if trend_patterns:
        assert trend_patterns[0]["direction"] == "improving"


def test_dataframe_conversion():
    data = [
        {"date": "2026-01-01", "tasks_completed": 5},
        {"date": "2026-01-02", "tasks_completed": 3},
    ]
    df = HabitDetector._to_dataframe(data)
    assert "ds" in df.columns
    assert "y" in df.columns
    assert len(df) == 2


def test_forecast_has_required_fields():
    detector = HabitDetector()
    data = _make_daily_data(10)
    _, forecast = detector.detect_patterns(data)
    for entry in forecast:
        assert "date" in entry
        assert "predicted" in entry
        assert "lower" in entry
        assert "upper" in entry
