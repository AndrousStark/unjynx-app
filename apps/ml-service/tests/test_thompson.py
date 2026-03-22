"""Tests for Thompson Sampling model."""

from app.models.thompson import ThompsonSampling


def test_initial_state():
    model = ThompsonSampling(n_slots=24)
    assert model.n_slots == 24
    assert len(model.alphas) == 24
    assert len(model.betas) == 24
    # Prior is Beta(1, 1)
    assert model.alphas[0] == 1.0
    assert model.betas[0] == 1.0


def test_update_success():
    model = ThompsonSampling(n_slots=24)
    model.update(10, reward=True)
    assert model.alphas[10] == 2.0
    assert model.betas[10] == 1.0


def test_update_failure():
    model = ThompsonSampling(n_slots=24)
    model.update(10, reward=False)
    assert model.alphas[10] == 1.0
    assert model.betas[10] == 2.0


def test_update_out_of_range_ignored():
    model = ThompsonSampling(n_slots=24)
    model.update(-1, reward=True)
    model.update(24, reward=True)
    # All alphas should still be 1.0
    assert all(a == 1.0 for a in model.alphas)


def test_sample_returns_valid_slot():
    model = ThompsonSampling(n_slots=24)
    slot = model.sample()
    assert 0 <= slot < 24


def test_sample_prefers_rewarded_slot():
    model = ThompsonSampling(n_slots=24)
    # Heavily reward slot 14
    for _ in range(100):
        model.update(14, reward=True)
    # Sample many times — slot 14 should dominate
    counts = {i: 0 for i in range(24)}
    for _ in range(200):
        counts[model.sample()] += 1
    assert counts[14] > 100  # should be picked most often


def test_get_distribution():
    model = ThompsonSampling(n_slots=24)
    model.update(5, reward=True)
    model.update(5, reward=True)
    model.update(5, reward=False)
    dist = model.get_distribution()
    assert len(dist) == 24
    assert dist[5]["observations"] == 3
    assert dist[5]["mean"] > 0.5  # 3 alpha / (3 alpha + 2 beta) = 0.6


def test_fit_from_history():
    model = ThompsonSampling(n_slots=24)
    history = [
        {"sent_hour": 9, "opened_at": "2026-01-01T10:00:00Z"},
        {"sent_hour": 9, "opened_at": None},
        {"sent_hour": 14, "opened_at": "2026-01-01T15:00:00Z"},
    ]
    model.fit_from_history(history)
    assert model.alphas[9] == 2.0  # 1 prior + 1 open
    assert model.betas[9] == 2.0   # 1 prior + 1 ignore
    assert model.alphas[14] == 2.0  # 1 prior + 1 open


def test_get_top_slots():
    model = ThompsonSampling(n_slots=24)
    for _ in range(50):
        model.update(8, reward=True)
    for _ in range(40):
        model.update(14, reward=True)
    top = model.get_top_slots(n=2)
    assert len(top) == 2
    assert top[0]["slot"] == 8
    assert top[1]["slot"] == 14
