package com.sih.backend.dto;

/**
 * Request body for the ML service's POST /predict-difficulty (Issue #5 contract).
 * currentDifficulty must be the patient's persistent state, not the difficulty
 * the just-submitted GameResult was played at.
 */
public class MlDifficultyRequest {

    private final String gameType;
    private final Integer score;
    private final Double accuracy;
    private final Integer reactionTime;
    private final Integer mistakes;
    private final int currentDifficulty;

    public MlDifficultyRequest(
            String gameType,
            Integer score,
            Double accuracy,
            Integer reactionTime,
            Integer mistakes,
            int currentDifficulty) {
        this.gameType = gameType;
        this.score = score;
        this.accuracy = accuracy;
        this.reactionTime = reactionTime;
        this.mistakes = mistakes;
        this.currentDifficulty = currentDifficulty;
    }

    public String getGameType() {
        return gameType;
    }

    public Integer getScore() {
        return score;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public Integer getReactionTime() {
        return reactionTime;
    }

    public Integer getMistakes() {
        return mistakes;
    }

    public int getCurrentDifficulty() {
        return currentDifficulty;
    }
}
