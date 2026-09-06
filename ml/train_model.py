"""
train_model.py
----------------
Trains a RandomForestClassifier to predict the next difficulty level
(1-5) from a game session's performance features. Saves the trained
model + label encoder with joblib so FastAPI can load them without
retraining.

Run:
    python generate_data.py   # once, to create data/game_sessions.csv
    python train_model.py
"""

import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

DATA_PATH = "data/game_sessions.csv"
MODEL_PATH = "models/difficulty_model.joblib"
ENCODER_PATH = "models/game_type_encoder.joblib"

FEATURE_COLS = [
    "accuracy",
    "avg_reaction_time",
    "mistakes",
    "current_level",
    "streak",
    "game_type_encoded",
]


def load_and_prepare(path: str = DATA_PATH):
    df = pd.read_csv(path)

    encoder = LabelEncoder()
    df["game_type_encoded"] = encoder.fit_transform(df["game_type"])

    X = df[FEATURE_COLS]
    y = df["next_level"]
    return X, y, encoder


def train():
    X, y, encoder = load_and_prepare()

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

    preds = model.predict(X_test)
    print("Test accuracy:", accuracy_score(y_test, preds))
    print(classification_report(y_test, preds))

    print("\nFeature importances:")
    for col, importance in sorted(
        zip(FEATURE_COLS, model.feature_importances_), key=lambda x: -x[1]
    ):
        print(f"  {col:20s} {importance:.3f}")

    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoder, ENCODER_PATH)
    print(f"\nSaved model to {MODEL_PATH}")
    print(f"Saved encoder to {ENCODER_PATH}")


if __name__ == "__main__":
    train()
