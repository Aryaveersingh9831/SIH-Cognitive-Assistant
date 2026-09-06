package com.sih.backend.security;

import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

class PasswordEncoderTest {

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @Test
    void hashesPasswordAndVerifiesMatch() {
        String rawPassword = "secret123";
        String hash = encoder.encode(rawPassword);

        assertNotEquals(rawPassword, hash);
        assertTrue(encoder.matches(rawPassword, hash));
    }
}
