package com.sih.backend.dto;

/**
 * Response body from the ML service's POST /predict-difficulty (Issue #5 contract).
 */
public class MlDifficultyResponse {

    private Integer recommendedDifficulty;

    public MlDifficultyResponse() {
    }

    public Integer getRecommendedDifficulty() {
        return recommendedDifficulty;
    }

    public void setRecommendedDifficulty(Integer recommendedDifficulty) {
        this.recommendedDifficulty = recommendedDifficulty;
    }
}
