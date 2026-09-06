# Cognitive ML Module (Person 3)

Covers: performance analysis, adaptive difficulty, cognitive activity scoring.

## Files
- `generate_data.py` — creates a synthetic but realistic dataset (`data/game_sessions.csv`) since no public dataset matches this exact schema (see note below).
- `cognitive_score.py` — explainable weighted formula for the 0-100 cognitive performance score. Not an ML model on purpose.
- `train_model.py` — trains a `RandomForestClassifier` to recommend the next difficulty level (1-5) and saves it with `joblib`.
- `predict_api.py` — FastAPI service exposing `/predict-difficulty` for Spring Boot / React Native to call.

## Run order
```bash
pip install -r requirements.txt
python generate_data.py
python train_model.py
uvicorn predict_api:app --reload --port 8001
```

## Swapping in real data later
Once P2's games are logging real sessions to MySQL, export them into the
same columns as `data/game_sessions.csv` (`accuracy, avg_reaction_time,
mistakes, current_level, streak, game_type, next_level`) and re-run
`train_model.py` — nothing else changes. `next_level` for real data can
initially still come from the same rule (`cognitive_score.py` logic) until
you have enough labeled sessions to trust caregiver-confirmed outcomes
instead.

## On the "pretrained dataset" question
There isn't a public dataset of "memory/attention game performance ->
recommended difficulty" for a dementia app — real dementia datasets on
Kaggle/DementiaBank are MRI, EEG, or speech-based (diagnosis-focused), not
this kind of game telemetry. Generating a synthetic dataset from
documented rules is the standard, defensible approach for this exact
situation and is what this module does.
