"""
model_service.py
------------------
Loads the trained model, auto-training it on first run if no artifact
exists yet (keeps setup to a single `uvicorn app.main:app` command —
no separate manual training step required, though you can still run
`python -m training.train_model` directly if you want to retrain).
"""

import joblib
import pandas as pd

from training.train_model import MODEL_PATH, train_and_save

FEATURE_COLS = ["score", "accuracy", "reactionTime", "mistakes", "currentDifficulty"]

_model = None


def get_model():
    global _model
    if _model is not None:
        return _model

    try:
        _model = joblib.load(MODEL_PATH)
    except FileNotFoundError:
        train_and_save(verbose=False)
        _model = joblib.load(MODEL_PATH)

    return _model


def predict_difficulty(score: int, accuracy: float, reaction_time: float,
                        mistakes: int, current_difficulty: int) -> int:
    model = get_model()

    features = pd.DataFrame(
        [[score, accuracy, reaction_time, mistakes, current_difficulty]],
        columns=FEATURE_COLS,
    )
    prediction = int(model.predict(features)[0])

    # Model is trained on labels 1-5 so this should always hold, but the
    # contract guarantees it explicitly regardless of model behavior.
    return max(1, min(5, prediction))
