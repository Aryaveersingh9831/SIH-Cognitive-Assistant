package com.sih.backend.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class GameResultRequest {

    @NotBlank(message = "Game type is required")
    private String gameType;

    @NotNull(message = "Score is required")
    @Min(value = 0, message = "Score must be non-negative")
    private Integer score;

    @NotNull(message = "Accuracy is required")
    @DecimalMin(value = "0.0", message = "Accuracy must be between 0.0 and 1.0")
    @DecimalMax(value = "1.0", message = "Accuracy must be between 0.0 and 1.0")
    private Double accuracy;

    @NotNull(message = "Reaction time is required")
    @Min(value = 0, message = "Reaction time must be non-negative")
    private Integer reactionTime;

    @NotNull(message = "Mistakes is required")
    @Min(value = 0, message = "Mistakes must be non-negative")
    private Integer mistakes;

    @NotNull(message = "Difficulty is required")
    @Min(value = 0, message = "Difficulty must be non-negative")
    private Integer difficulty;

    public String getGameType() {
        return gameType;
    }

    public void setGameType(String gameType) {
        this.gameType = gameType;
    }

    public Integer getScore() {
        return score;
    }

    public void setScore(Integer score) {
        this.score = score;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(Double accuracy) {
        this.accuracy = accuracy;
    }

    public Integer getReactionTime() {
        return reactionTime;
    }

    public void setReactionTime(Integer reactionTime) {
        this.reactionTime = reactionTime;
    }

    public Integer getMistakes() {
        return mistakes;
    }

    public void setMistakes(Integer mistakes) {
        this.mistakes = mistakes;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public void setDifficulty(Integer difficulty) {
        this.difficulty = difficulty;
    }
}
