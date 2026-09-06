package com.sih.backend.dto;

public class ProgressResponse {

    private final String patientId;
    private final int totalSessions;
    private final double averageAccuracy;
    private final Integer currentDifficulty;
    private final Double averageDifficulty;
    private final String recentPerformanceTrend;

    public ProgressResponse(
            String patientId,
            int totalSessions,
            double averageAccuracy,
            Integer currentDifficulty,
            Double averageDifficulty,
            String recentPerformanceTrend) {
        this.patientId = patientId;
        this.totalSessions = totalSessions;
        this.averageAccuracy = averageAccuracy;
        this.currentDifficulty = currentDifficulty;
        this.averageDifficulty = averageDifficulty;
        this.recentPerformanceTrend = recentPerformanceTrend;
    }

    public String getPatientId() {
        return patientId;
    }

    public int getTotalSessions() {
        return totalSessions;
    }

    public double getAverageAccuracy() {
        return averageAccuracy;
    }

    public Integer getCurrentDifficulty() {
        return currentDifficulty;
    }

    public Double getAverageDifficulty() {
        return averageDifficulty;
    }

    public String getRecentPerformanceTrend() {
        return recentPerformanceTrend;
    }
}
