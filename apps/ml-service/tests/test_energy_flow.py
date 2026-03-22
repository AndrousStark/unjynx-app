"""Tests for Energy Flow Engine (Gaussian Process)."""

from app.models.energy_flow import EnergyFlowEngine


def test_unfitted_returns_defaults():
    engine = EnergyFlowEngine()
    forecast = engine.predict()
    assert len(forecast) == 24
    for entry in forecast:
        assert entry["energy"] == 3.0
        assert entry["confidence"] == 0.0


def test_fit_and_predict():
    engine = EnergyFlowEngine()
    hours = [8.0, 10.0, 12.0, 14.0, 16.0, 18.0]
    ratings = [4.0, 5.0, 3.5, 2.0, 3.0, 4.0]
    engine.fit(hours, ratings)
    forecast = engine.predict()
    assert len(forecast) == 24
    # Hour 10 should have high energy (near 5.0)
    hour_10 = forecast[10]
    assert hour_10["energy"] > 3.5
    assert hour_10["confidence"] > 0.0


def test_fit_too_few_points():
    engine = EnergyFlowEngine()
    engine.fit([10.0], [4.0])
    forecast = engine.predict()
    # Should return defaults because < 2 points
    assert forecast[0]["energy"] == 3.0


def test_get_peak_hours():
    engine = EnergyFlowEngine()
    hours = [8.0, 10.0, 14.0, 20.0]
    ratings = [4.0, 5.0, 2.0, 3.0]
    engine.fit(hours, ratings)
    peaks = engine.get_peak_hours(n=2)
    assert len(peaks) == 2
    assert peaks[0]["energy"] >= peaks[1]["energy"]


def test_get_low_hours():
    engine = EnergyFlowEngine()
    hours = [8.0, 10.0, 14.0, 20.0]
    ratings = [4.0, 5.0, 2.0, 3.0]
    engine.fit(hours, ratings)
    lows = engine.get_low_hours(n=2)
    assert len(lows) == 2
    assert lows[0]["energy"] <= lows[1]["energy"]


def test_aggregate_sessions():
    sessions = [
        {"hour": 9, "focus_rating": 4.0},
        {"hour": 9, "focus_rating": 5.0},
        {"hour": 14, "focus_rating": 2.0},
        {"hour": 14, "focus_rating": None},  # should be skipped
    ]
    hours, ratings = EnergyFlowEngine.aggregate_sessions(sessions)
    assert len(hours) == 2
    assert hours[0] == 9.0
    assert ratings[0] == 4.5  # mean of 4 and 5
    assert hours[1] == 14.0
    assert ratings[1] == 2.0


def test_aggregate_empty_sessions():
    hours, ratings = EnergyFlowEngine.aggregate_sessions([])
    assert hours == []
    assert ratings == []
