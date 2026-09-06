"""
generate_data.py
-----------------
There is no public dataset of "memory/attention/pattern game performance ->
next difficulty level" for a dementia cognitive-training app — this is a
custom telemetry schema that only your own games produce. The standard,
accepted approach for a hackathon MVP (and honestly, the more defensible
one for judges) is to GENERATE a synthetic dataset using domain rules,
train the ML model on it, and then swap in real game logs once P1/P2's
games are producing real data. The model doesn't care where the rows came
from — only that the features/labels are structured the same way.

This script creates that synthetic dataset.

Features (per game session):
    accuracy        -> % correct (0-100)
    avg_reaction_time -> seconds, lower = faster/better
    mistakes        -> count of wrong attempts
    current_level   -> difficulty the session was played at (1-5)
    streak          -> consecutive sessions improving (can be negative)
    game_type       -> memory / attention / pattern / routine

Label:
    next_level      -> the difficulty level (1-5) the ML model recommends
                       for the *next* session

The labeling rule mimics what a human game designer would do: reward high
accuracy + fast reaction + few mistakes with a harder level next time, and
protect the patient from frustration by dropping the level when they
struggle. Randomized noise is added so the model has to learn a pattern
rather than memorize a lookup table.
"""

import numpy as np
import pandas as pd

RNG = np.random.default_rng(42)
GAME_TYPES = ["memory", "attention", "pattern", "routine"]
N_ROWS = 6000


def simulate_session(current_level: int) -> dict:
    """Simulate one game session's raw performance at a given difficulty."""
    # Higher levels are harder -> accuracy tends to drop, reaction time rises
    base_accuracy = 95 - (current_level - 1) * 8
    accuracy = np.clip(RNG.normal(base_accuracy, 12), 20, 100)

    base_reaction = 1.5 + (current_level - 1) * 0.5
    avg_reaction_time = np.clip(RNG.normal(base_reaction, 0.6), 0.6, 6.0)

    # mistakes correlate inversely with accuracy
    mistakes = np.clip(RNG.poisson(lam=max(0.2, (100 - accuracy) / 12)), 0, 10)

    streak = RNG.integers(-3, 4)
    game_type = RNG.choice(GAME_TYPES)

    return {
        "accuracy": round(float(accuracy), 1),
        "avg_reaction_time": round(float(avg_reaction_time), 2),
        "mistakes": int(mistakes),
        "current_level": int(current_level),
        "streak": int(streak),
        "game_type": game_type,
    }


def label_next_level(row: dict) -> int:
    """
    Rule-based ground truth for the difficulty the NEXT session should be.
    This encodes the same logic a caregiver/clinician would use manually —
    the ML model's job is to learn to reproduce (and later refine) this.
    """
    score = 0
    score += (row["accuracy"] - 70) / 10          # accuracy above/below 70%
    score += (2.5 - row["avg_reaction_time"]) * 1.5  # faster than 2.5s is good
    score -= row["mistakes"] * 0.6
    score += row["streak"] * 0.4

    # small random noise so the boundary isn't a hard step function
    score += RNG.normal(0, 0.5)

    if score >= 2.2:
        delta = 1
    elif score <= -2.2:
        delta = -1
    else:
        delta = 0

    next_level = row["current_level"] + delta
    return int(np.clip(next_level, 1, 5))


def build_dataset(n_rows: int = N_ROWS) -> pd.DataFrame:
    rows = []
    for _ in range(n_rows):
        current_level = RNG.integers(1, 6)  # 1-5
        row = simulate_session(current_level)
        row["next_level"] = label_next_level(row)
        rows.append(row)
    return pd.DataFrame(rows)


if __name__ == "__main__":
    df = build_dataset()
    out_path = "data/game_sessions.csv"
    df.to_csv(out_path, index=False)
    print(f"Wrote {len(df)} synthetic rows to {out_path}")
    print(df.head())
    print("\nLabel distribution:")
    print(df["next_level"].value_counts().sort_index())
