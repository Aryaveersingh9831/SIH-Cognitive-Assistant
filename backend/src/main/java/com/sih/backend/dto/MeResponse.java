package com.sih.backend.dto;

public class MeResponse {

    private final Long userId;
    private final String role;

    public MeResponse(Long userId, String role) {
        this.userId = userId;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }
}
