package com.sih.backend.dto;

import java.time.LocalDateTime;

public class ReminderResponse {

    private final Long id;
    private final String patientId;
    private final String type;
    private final String title;
    private final LocalDateTime scheduledAt;
    private final boolean completed;
    private final LocalDateTime createdAt;
    private final LocalDateTime completedAt;

    public ReminderResponse(
            Long id,
            String patientId,
            String type,
            String title,
            LocalDateTime scheduledAt,
            boolean completed,
            LocalDateTime createdAt,
            LocalDateTime completedAt) {
        this.id = id;
        this.patientId = patientId;
        this.type = type;
        this.title = title;
        this.scheduledAt = scheduledAt;
        this.completed = completed;
        this.createdAt = createdAt;
        this.completedAt = completedAt;
    }

    public Long getId() {
        return id;
    }

    public String getPatientId() {
        return patientId;
    }

    public String getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public boolean isCompleted() {
        return completed;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }
}
