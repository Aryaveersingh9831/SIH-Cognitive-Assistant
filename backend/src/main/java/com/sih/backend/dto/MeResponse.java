package com.sih.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

public class MeResponse {

    private final Long userId;
    private final String role;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String patientId;

    public MeResponse(Long userId, String role, String patientId) {
        this.userId = userId;
        this.role = role;
        this.patientId = patientId;
    }

    public Long getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    public String getPatientId() {
        return patientId;
    }
}
