package com.sih.backend.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import javax.crypto.SecretKey;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private static final String SECRET = "unit-test-secret-key-not-for-production-abcdefg";

    private final JwtService jwtService = new JwtService(SECRET, 86400000L);

    @Test
    void generatesTokenContainingUserIdAndRole() {
        String token = jwtService.generateToken(42L, "PATIENT");

        assertTrue(jwtService.validateToken(token));
        assertEquals(42L, jwtService.extractUserId(token));
        assertEquals("PATIENT", jwtService.extractRole(token));
        assertTrue(jwtService.extractExpiration(token).after(new Date()));
    }

    @Test
    void rejectsExpiredToken() {
        SecretKey key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));
        Date past = new Date(System.currentTimeMillis() - 10_000);
        String expiredToken = Jwts.builder()
                .subject("1")
                .claim("role", "PATIENT")
                .issuedAt(new Date(past.getTime() - 1000))
                .expiration(past)
                .signWith(key)
                .compact();

        assertFalse(jwtService.validateToken(expiredToken));
    }

    @Test
    void rejectsMalformedToken() {
        assertFalse(jwtService.validateToken("not-a-real-jwt"));
    }
}
