"""
cognitive_score.py
-------------------
"Cognitive Performance Score" is deliberately NOT a second ML model — the
ChatGPT plan you pasted calls this out, and it's the right call. A simple,
explainable weighted formula is easier to defend to judges ("here's exactly
why the score is 82"), easier to debug, and doesn't need a second training
pipeline. Keep ML for the one thing that actually benefits from it:
recommending the next difficulty level.

Score is 0-100, built from the same features the ML model uses, so both
pieces stay consistent with each other.
"""

from dataclasses import dataclass


@dataclass
class SessionMetrics:
    accuracy: float          # 0-100
    avg_reaction_time: float  # seconds
    mistakes: int
    current_level: int       # 1-5


def cognitive_score(m: SessionMetrics) -> float:
    """
    Weighted formula:
      - accuracy: 50% weight (most important signal)
      - reaction time: 30% weight, normalized against a 1-5s expected range
      - mistakes: 20% weight, penalized, capped so one bad session
        doesn't tank the score to zero
    """
    accuracy_component = m.accuracy  # already 0-100

    # reaction time: 1s -> ~100, 5s -> ~0 (clamped)
    reaction_component = max(0.0, min(100.0, (5.0 - m.avg_reaction_time) / 4.0 * 100))

    mistake_penalty = min(m.mistakes * 8, 40)  # cap penalty at 40 points
    mistake_component = 100 - mistake_penalty

    score = (
        0.5 * accuracy_component
        + 0.3 * reaction_component
        + 0.2 * mistake_component
    )
    return round(max(0.0, min(100.0, score)), 1)


def weekly_trend(scores: list[float]) -> str:
    """Simple up/down/flat trend label for the caregiver dashboard (Person 6)."""
    if len(scores) < 2:
        return "not enough data"
    delta = scores[-1] - scores[0]
    if delta > 5:
        return "improving"
    if delta < -5:
        return "declining"
    return "stable"


if __name__ == "__main__":
    example = SessionMetrics(accuracy=82, avg_reaction_time=2.1, mistakes=1, current_level=2)
    print("Example cognitive score:", cognitive_score(example))
