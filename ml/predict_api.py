"""
predict_api.py
-----------------
This is the piece that Person 5 (Spring Boot) or React Native calls
directly, or that Spring Boot proxies to. Keep the ML service completely
separate from Spring Boot — Spring Boot just makes an HTTP call to this
FastAPI app and forwards the JSON response.

Run:
    uvicorn predict_api:app --reload --port 8001

Then POST to http://localhost:8001/predict-difficulty with a body like:
{
  "accuracy": 82,
  "avg_reaction_time": 2.1,
  "mistakes": 1,
  "current_level": 2,
  "streak": 1,
  "game_type": "memory"
}
"""

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from cognitive_score import SessionMetrics, cognitive_score

app = FastAPI(title="Cognitive ML Service")

MODEL_PATH = "models/difficulty_model.joblib"
ENCODER_PATH = "models/game_type_encoder.joblib"

try:
    model = joblib.load(MODEL_PATH)
    encoder = joblib.load(ENCODER_PATH)
except FileNotFoundError:
    model = None
    encoder = None


class SessionInput(BaseModel):
    accuracy: float = Field(..., ge=0, le=100)
    avg_reaction_time: float = Field(..., gt=0)
    mistakes: int = Field(..., ge=0)
    current_level: int = Field(..., ge=1, le=5)
    streak: int = 0
    game_type: str = "memory"


class PredictionOutput(BaseModel):
    recommended_level: int
    cognitive_score: float
    confidence: float


@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": model is not None}


@app.post("/predict-difficulty", response_model=PredictionOutput)
def predict_difficulty(session: SessionInput):
    if model is None or encoder is None:
        raise HTTPException(
            status_code=503,
            detail="Model not trained yet. Run generate_data.py then train_model.py first.",
        )

    if session.game_type not in encoder.classes_:
        # unseen game type — fall back to the most common encoded value
        game_type_encoded = 0
    else:
        game_type_encoded = int(encoder.transform([session.game_type])[0])

    features = pd.DataFrame(
        [{
            "accuracy": session.accuracy,
            "avg_reaction_time": session.avg_reaction_time,
            "mistakes": session.mistakes,
            "current_level": session.current_level,
            "streak": session.streak,
            "game_type_encoded": game_type_encoded,
        }]
    )

    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]
    confidence = float(max(probabilities))

    score = cognitive_score(
        SessionMetrics(
            accuracy=session.accuracy,
            avg_reaction_time=session.avg_reaction_time,
            mistakes=session.mistakes,
            current_level=session.current_level,
        )
    )

    return PredictionOutput(
        recommended_level=int(prediction),
        cognitive_score=score,
        confidence=round(confidence, 3),
    )
