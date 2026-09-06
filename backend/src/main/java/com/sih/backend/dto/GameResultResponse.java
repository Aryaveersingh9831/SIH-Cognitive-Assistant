package com.sih.backend.dto;

import java.time.LocalDateTime;

public class GameResultResponse {

    private final Long id;
    private final String gameType;
    private final Integer score;
    private final Double accuracy;
    private final Integer reactionTime;
    private final Integer mistakes;
    private final Integer difficulty;
    private final String patientId;
    private final LocalDateTime createdAt;

    public GameResultResponse(
            Long id,
            String gameType,
            Integer score,
            Double accuracy,
            Integer reactionTime,
            Integer mistakes,
            Integer difficulty,
            String patientId,
            LocalDateTime createdAt) {
        this.id = id;
        this.gameType = gameType;
        this.score = score;
        this.accuracy = accuracy;
        this.reactionTime = reactionTime;
        this.mistakes = mistakes;
        this.difficulty = difficulty;
        this.patientId = patientId;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
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

    public Integer getDifficulty() {
        return difficulty;
    }

    public String getPatientId() {
        return patientId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
