"""
main.py
--------
FastAPI service for adaptive difficulty prediction (Issue #5 scope only).

Run:
    uvicorn app.main:app --reload --port 8001

This is a hackathon PROTOTYPE trained on SYNTHETIC data. It is not
clinically validated and must not be presented as a medical or
diagnostic tool. See README.md for details.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.model_service import get_model, predict_difficulty
from app.schemas import (
    DifficultyPredictionRequest,
    DifficultyPredictionResponse,
    HealthResponse,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Triggers auto-training on first run if no model artifact exists yet.
    get_model()
    yield


app = FastAPI(
    title="ML Difficulty Prediction Service",
    description=(
        "Prototype adaptive-difficulty API trained on synthetic data. "
        "Not clinically validated."
    ),
    lifespan=lifespan,
)


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    model_loaded = get_model() is not None
    return HealthResponse(status="ok", model_loaded=model_loaded)


@app.post("/predict-difficulty", response_model=DifficultyPredictionResponse)
def predict(request: DifficultyPredictionRequest) -> DifficultyPredictionResponse:
    recommended = predict_difficulty(
        score=request.score,
        accuracy=request.accuracy,
        reaction_time=request.reaction_time,
        mistakes=request.mistakes,
        current_difficulty=request.current_difficulty,
    )
    return DifficultyPredictionResponse(recommended_difficulty=recommended)
