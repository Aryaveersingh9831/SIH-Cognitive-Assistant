package com.sih.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public class ReminderRequest {

    @NotBlank(message = "Patient ID is required")
    private String patientId;

    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Title is required")
    private String title;

    @NotNull(message = "Scheduled time is required")
    private LocalDateTime scheduledAt;

    public String getPatientId() {
        return patientId;
    }

    public void setPatientId(String patientId) {
        this.patientId = patientId;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public LocalDateTime getScheduledAt() {
        return scheduledAt;
    }

    public void setScheduledAt(LocalDateTime scheduledAt) {
        this.scheduledAt = scheduledAt;
    }
}
