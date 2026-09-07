"""
Basic test coverage for Issue #5:
 - health check
 - a valid prediction
 - invalid input rejected with 422
 - difficulty boundaries (currentDifficulty = 1 and = 5)
 - recommendedDifficulty always within 1-5
"""

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID_PAYLOAD = {
    "gameType": "memory",
    "score": 8,
    "accuracy": 0.8,
    "reactionTime": 1200,
    "mistakes": 2,
    "currentDifficulty": 2,
}


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True


def test_valid_prediction_returns_expected_shape():
    response = client.post("/predict-difficulty", json=VALID_PAYLOAD)
    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"recommendedDifficulty"}
    assert isinstance(body["recommendedDifficulty"], int)
    assert 1 <= body["recommendedDifficulty"] <= 5


@pytest.mark.parametrize(
    "field,bad_value",
    [
        ("accuracy", 1.5),          # accuracy must be 0.0-1.0
        ("accuracy", -0.1),
        ("reactionTime", -100),     # must be > 0
        ("mistakes", -1),           # must be >= 0
        ("currentDifficulty", 0),   # must be 1-5
        ("currentDifficulty", 6),
        ("gameType", "attention"),  # unsupported game type in this iteration
    ],
)
def test_invalid_input_rejected(field, bad_value):
    payload = dict(VALID_PAYLOAD)
    payload[field] = bad_value
    response = client.post("/predict-difficulty", json=payload)
    assert response.status_code == 422


def test_reaction_time_zero_is_valid():
    """reactionTime is non-negative per Issue #5's contract, so 0 must be accepted."""
    payload = dict(VALID_PAYLOAD)
    payload["reactionTime"] = 0
    response = client.post("/predict-difficulty", json=payload)
    assert response.status_code == 200
    recommended = response.json()["recommendedDifficulty"]
    assert 1 <= recommended <= 5


def test_missing_field_rejected():
    payload = dict(VALID_PAYLOAD)
    del payload["accuracy"]
    response = client.post("/predict-difficulty", json=payload)
    assert response.status_code == 422


@pytest.mark.parametrize("boundary_difficulty", [1, 5])
def test_difficulty_boundaries_stay_in_range(boundary_difficulty):
    payload = dict(VALID_PAYLOAD)
    payload["currentDifficulty"] = boundary_difficulty
    response = client.post("/predict-difficulty", json=payload)
    assert response.status_code == 200
    recommended = response.json()["recommendedDifficulty"]
    assert 1 <= recommended <= 5


def test_recommendation_never_out_of_range_across_extreme_inputs():
    """Sweep extreme but individually-valid inputs to confirm the 1-5
    clamp holds regardless of what the underlying model predicts."""
    extreme_cases = [
        {"score": 10, "accuracy": 1.0, "reactionTime": 600, "mistakes": 0, "currentDifficulty": 5},
        {"score": 0, "accuracy": 0.0, "reactionTime": 6000, "mistakes": 10, "currentDifficulty": 1},
        {"score": 0, "accuracy": 0.0, "reactionTime": 6000, "mistakes": 10, "currentDifficulty": 5},
        {"score": 10, "accuracy": 1.0, "reactionTime": 600, "mistakes": 0, "currentDifficulty": 1},
    ]
    for case in extreme_cases:
        payload = {"gameType": "memory", **case}
        response = client.post("/predict-difficulty", json=payload)
        assert response.status_code == 200
        recommended = response.json()["recommendedDifficulty"]
        assert 1 <= recommended <= 5
