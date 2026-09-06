"""
generate_data.py
-----------------
Generates a SYNTHETIC training dataset for the adaptive difficulty model.

No real patient/game telemetry exists yet, so this dataset is produced
from documented rules that approximate how difficulty should adapt to
performance. This is a hackathon prototype data source, not clinical or
real user data — see README.md for details on this limitation.

Columns match the API contract exactly (score, accuracy, reactionTime,
mistakes, currentDifficulty), plus the label (recommendedDifficulty).
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
N_ROWS = 6000


def _simulate_session(current_difficulty: int) -> dict:
    """Simulate one memory-game session's raw performance at a given difficulty."""
    base_accuracy = 0.95 - (current_difficulty - 1) * 0.08
    accuracy = float(np.clip(RNG.normal(base_accuracy, 0.12), 0.2, 1.0))

    base_reaction_ms = 1500 + (current_difficulty - 1) * 500
    reaction_time = float(np.clip(RNG.normal(base_reaction_ms, 600), 600, 6000))

    mistakes = int(np.clip(RNG.poisson(lam=max(0.2, (1 - accuracy) * 12)), 0, 10))

    score = int(np.clip(round(accuracy * 10 + RNG.normal(0, 1)), 0, 10))

    return {
        "gameType": "memory",
        "score": score,
        "accuracy": round(accuracy, 3),
        "reactionTime": round(reaction_time, 1),
        "mistakes": mistakes,
        "currentDifficulty": int(current_difficulty),
    }


def _label_recommended_difficulty(row: dict) -> int:
    """
    Rule-based ground truth for the NEXT difficulty level.
    Encodes the same logic a designer/clinician would apply manually;
    the model's job is to learn to reproduce (and later refine) this.
    """
    signal = 0.0
    signal += (row["accuracy"] - 0.7) * 10          # accuracy above/below 70%
    signal += (2500 - row["reactionTime"]) / 1000 * 1.5  # faster than 2.5s is good
    signal -= row["mistakes"] * 0.6
    signal += (row["score"] - 7) * 0.15
    signal += RNG.normal(0, 0.5)  # noise so the boundary isn't a hard step

    if signal >= 2.2:
        delta = 1
    elif signal <= -2.2:
        delta = -1
    else:
        delta = 0

    return int(np.clip(row["currentDifficulty"] + delta, 1, 5))


def build_dataset(n_rows: int = N_ROWS) -> pd.DataFrame:
    rows = []
    for _ in range(n_rows):
        current_difficulty = int(RNG.integers(1, 6))  # 1-5
        row = _simulate_session(current_difficulty)
        row["recommendedDifficulty"] = _label_recommended_difficulty(row)
        rows.append(row)
    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = build_dataset()
    print(f"Generated {len(df)} synthetic rows")
    print(df.head())
    print("\nLabel distribution:")
    print(df["recommendedDifficulty"].value_counts().sort_index())
