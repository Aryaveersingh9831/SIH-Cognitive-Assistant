package com.sih.backend.dto;

import java.time.LocalDateTime;

public class CaregiverPatientResponse {

    private final String patientId;
    private final String name;
    private final LocalDateTime lastActive;

    public CaregiverPatientResponse(String patientId, String name, LocalDateTime lastActive) {
        this.patientId = patientId;
        this.name = name;
        this.lastActive = lastActive;
    }

    public String getPatientId() {
        return patientId;
    }

    public String getName() {
        return name;
    }

    public LocalDateTime getLastActive() {
        return lastActive;
    }
}
