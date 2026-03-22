"""Tests for LinUCB contextual bandit model."""

import pytest

from app.models.linucb import LinUCB


def test_initial_state():
    model = LinUCB(n_features=7, alpha=1.0)
    assert model.d == 7
    assert model.alpha == 1.0
    assert model.arm_count == 0


def test_predict_creates_arms():
    model = LinUCB(n_features=3, alpha=1.0)
    context = [0.5, 0.5, 0.5]
    scores = model.predict(context, ["task-1", "task-2"])
    assert model.arm_count == 2
    assert len(scores) == 2


def test_predict_returns_sorted():
    model = LinUCB(n_features=3, alpha=1.0)
    # Train task-1 with high reward
    model.update("task-1", [0.5, 0.5, 0.5], reward=1.0)
    model.update("task-1", [0.5, 0.5, 0.5], reward=1.0)
    # task-2 has no training
    scores = model.predict([0.5, 0.5, 0.5], ["task-1", "task-2"])
    # task-1 should have higher exploitation + lower exploration
    assert scores[0][0] in ("task-1", "task-2")
    assert scores[0][1] >= scores[1][1]


def test_update_changes_parameters():
    model = LinUCB(n_features=3, alpha=1.0)
    model.update("arm-x", [1.0, 0.0, 0.0], reward=1.0)
    assert model.arm_count == 1
    # A should no longer be identity
    import numpy as np
    assert not np.array_equal(model._A["arm-x"], np.eye(3))


def test_wrong_context_size_raises():
    model = LinUCB(n_features=3, alpha=1.0)
    with pytest.raises(ValueError, match="features"):
        model.predict([0.5, 0.5], ["arm-1"])
    with pytest.raises(ValueError, match="features"):
        model.update("arm-1", [0.5], reward=1.0)


def test_fit_from_completions():
    model = LinUCB(n_features=7, alpha=1.0)
    completions = [
        {"task_id": "t1", "priority": 3},
        {"task_id": "t2", "priority": 1},
        {"task_id": "t1", "priority": 3},
    ]
    model.fit_from_completions(completions)
    assert model.arm_count == 2  # t1 and t2


def test_empty_arms_returns_empty():
    model = LinUCB(n_features=3, alpha=1.0)
    scores = model.predict([0.5, 0.5, 0.5], [])
    assert scores == []
