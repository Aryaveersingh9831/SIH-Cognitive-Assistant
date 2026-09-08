package com.sih.backend.dto;

public class LoginResponse {

    private final String token;
    private final String role;
    private final Long userId;
    private final String patientId;

    public LoginResponse(String token, String role, Long userId, String patientId) {
        this.token = token;
        this.role = role;
        this.userId = userId;
        this.patientId = patientId;
    }

    public String getToken() {
        return token;
    }

    public String getRole() {
        return role;
    }

    public Long getUserId() {
        return userId;
    }

    public String getPatientId() {
        return patientId;
    }
}