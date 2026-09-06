package com.sih.backend.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

public class RegisterResponse {

    private final String message;
    private final String role;

    @JsonInclude(JsonInclude.Include.NON_NULL)
    private final String patientId;

    public RegisterResponse(String message, String role, String patientId) {
        this.message = message;
        this.role = role;
        this.patientId = patientId;
    }

    public String getMessage() {
        return message;
    }

    public String getRole() {
        return role;
    }

    public String getPatientId() {
        return patientId;
    }
}
