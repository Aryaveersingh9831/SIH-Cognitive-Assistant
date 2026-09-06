package com.sih.backend.security;

public record JwtUserPrincipal(Long userId, String role) {
}
