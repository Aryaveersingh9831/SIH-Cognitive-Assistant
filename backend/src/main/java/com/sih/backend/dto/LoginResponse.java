package com.sih.backend.dto;

public class LoginResponse {

    private final String token;
    private final String role;
    private final Long userId;

    public LoginResponse(String token, String role, Long userId) {
        this.token = token;
        this.role = role;
        this.userId = userId;
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
}
