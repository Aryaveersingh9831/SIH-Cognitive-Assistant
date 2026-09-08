package com.sih.backend;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String uniquePhone() {
        return "9" + String.valueOf(System.nanoTime()).substring(0, 9);
    }

    private String register(String name, String phone, String password, String role) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", name, "phone", phone, "password", password, "role", role))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    @Test
    void registrationSucceeds() throws Exception {
        String phone = uniquePhone();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "Ramesh Das", "phone", phone, "password", "secret123", "role", "patient"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.message", is("Registration successful")))
                .andExpect(jsonPath("$.role", is("patient")))
                .andExpect(jsonPath("$.patientId", startsWith("PT-")));
    }

    @Test
    void caregiverRegistrationHasNoPatientId() throws Exception {
        String phone = uniquePhone();

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "Caregiver One", "phone", phone, "password", "secret123", "role", "caregiver"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role", is("caregiver")))
                .andExpect(jsonPath("$.patientId").doesNotExist());
    }

    @Test
    void duplicatePhoneRegistrationFails() throws Exception {
        String phone = uniquePhone();
        register("Ramesh Das", phone, "secret123", "patient");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "Another Name", "phone", phone, "password", "secret123", "role", "patient"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Phone number already registered")));
    }

    @Test
    void invalidRegistrationFails() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "", "phone", "", "password", "123", "role", ""))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void loginSucceedsAndReturnsJwt() throws Exception {
        String phone = uniquePhone();
        register("Ramesh Das", phone, "secret123", "patient");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("identifier", phone, "password", "secret123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("patient")))
                .andExpect(jsonPath("$.userId", notNullValue()));
    }

    @Test
    void loginWithWrongPasswordFails() throws Exception {
        String phone = uniquePhone();
        register("Ramesh Das", phone, "secret123", "patient");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("identifier", phone, "password", "wrongpassword"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid credentials")));
    }

    @Test
    void loginWithPatientIdSucceeds() throws Exception {
        String phone = uniquePhone();
        String registerResponse = register("Ramesh Das", phone, "secret123", "patient");
        String patientId = (String) objectMapper.readValue(registerResponse, Map.class).get("patientId");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("identifier", patientId, "password", "secret123"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("patient")));
    }

    @Test
    void meWithValidTokenSucceeds() throws Exception {
        String phone = uniquePhone();
        register("Ramesh Das", phone, "secret123", "patient");

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("identifier", phone, "password", "secret123"))))
                .andReturn().getResponse().getContentAsString();

        String token = (String) objectMapper.readValue(loginResponse, Map.class).get("token");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("patient")))
                .andExpect(jsonPath("$.userId", notNullValue()))
                .andExpect(jsonPath("$.patientId", startsWith("PT-")));
    }

    @Test
    void meForCaregiverOmitsPatientId() throws Exception {
        String phone = uniquePhone();
        register("Caregiver One", phone, "secret123", "caregiver");

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("identifier", phone, "password", "secret123"))))
                .andReturn().getResponse().getContentAsString();

        String token = (String) objectMapper.readValue(loginResponse, Map.class).get("token");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role", is("caregiver")))
                .andExpect(jsonPath("$.userId", notNullValue()))
                .andExpect(jsonPath("$.patientId").doesNotExist());
    }

    @Test
    void meWithoutTokenFails() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meWithInvalidTokenFails() throws Exception {
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer not-a-real-token"))
                .andExpect(status().isUnauthorized());
    }
}
