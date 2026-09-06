# ML Difficulty Prediction API (Issue #5)

Scope: **only** the ML difficulty prediction service. No Spring Boot
integration, no frontend, no GameResult/Progress/reminder/dashboard/auth
changes — those are separate issues.

## ⚠️ Prototype disclaimer

- The model is trained on **synthetic data** (`training/generate_data.py`),
  generated from documented rules, not real patient or game sessions.
- This is a **hackathon prototype**, not a clinically validated tool. It
  must not be presented or used as a medical/diagnostic system.
- `currentDifficulty` is accepted as input by design — the backend
  (Issue #6) owns persisting and updating the patient's actual difficulty
  state using this service's recommendation.

## Setup

```bash
cd ml
pip install -r requirements.txt
```

## Run the service

```bash
uvicorn app.main:app --reload --port 8001
```

No separate training step is required — the service auto-trains the
model on first startup if no artifact exists yet (takes a few seconds).
To retrain manually instead:

```bash
python -m training.train_model
```

Model artifacts and generated data are intentionally **not committed**
to git (see `.gitignore`) — training is fast and fully reproducible from
`training/generate_data.py` + `training/train_model.py`.

## Run tests

```bash
pytest
```

## API contract

**POST** `/predict-difficulty`

Request:
```json
{
  "gameType": "memory",
  "score": 8,
  "accuracy": 0.8,
  "reactionTime": 1200,
  "mistakes": 2,
  "currentDifficulty": 2
}
```

Response:
```json
{
  "recommendedDifficulty": 3
}
```

Field rules:
- `accuracy`: 0.0–1.0
- `reactionTime`: milliseconds
- `mistakes`: >= 0
- `currentDifficulty`: 1–5
- `recommendedDifficulty`: always clamped to 1–5
- `gameType`: string; only `"memory"` is supported in this iteration

**GET** `/health` — returns `{"status": "ok", "model_loaded": true}` for
service/liveness checks.
