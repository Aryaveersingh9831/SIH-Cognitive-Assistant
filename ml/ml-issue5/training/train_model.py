"""
train_model.py
----------------
Trains a RandomForestClassifier to predict recommendedDifficulty (1-5)
from a game session's performance features, using the synthetic dataset
from generate_data.py.

This is deliberately NOT run at import time — call train_and_save()
explicitly (the FastAPI service does this automatically on first
startup if no model artifact exists yet; see app/model_service.py).

Model artifacts are NOT committed to git (see .gitignore) — training is
fast (a few seconds) and fully reproducible from this script, so we
prefer regenerating over shipping binary blobs in the repo.
"""

import os

import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split

from training.generate_data import build_dataset

FEATURE_COLS = ["score", "accuracy", "reactionTime", "mistakes", "currentDifficulty"]
LABEL_COL = "recommendedDifficulty"

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "difficulty_model.joblib")


def train_and_save(n_rows: int = 6000, verbose: bool = True) -> str:
    df = build_dataset(n_rows=n_rows)
    X = df[FEATURE_COLS]
    y = df[LABEL_COL]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        random_state=42,
        class_weight="balanced",
    )
    model.fit(X_train, y_train)

    if verbose:
        preds = model.predict(X_test)
        print("Test accuracy:", accuracy_score(y_test, preds))
        print(classification_report(y_test, preds))

    os.makedirs(MODEL_DIR, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    if verbose:
        print(f"Saved model to {MODEL_PATH}")

    return MODEL_PATH


if __name__ == "__main__":
    train_and_save()
