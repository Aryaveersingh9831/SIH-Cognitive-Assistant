package com.sih.backend;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class GameResultIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String uniquePhone() {
        return "9" + String.valueOf(System.nanoTime()).substring(0, 9);
    }

    private Map<String, Object> validResultPayload() {
        return Map.of(
                "gameType", "memory",
                "score", 8,
                "accuracy", 0.8,
                "reactionTime", 1200,
                "mistakes", 2,
                "difficulty", 1);
    }

    private String registerPatient(String phone) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "name", "Test Patient", "phone", phone, "password", "secret123", "role", "patient"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
    }

    private String patientIdFromRegisterResponse(String registerResponse) {
        return (String) objectMapper.readValue(registerResponse, Map.class).get("patientId");
    }

    private String loginAndGetToken(String phone) throws Exception {
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("identifier", phone, "password", "secret123"))))
                .andReturn().getResponse().getContentAsString();
        return (String) objectMapper.readValue(loginResponse, Map.class).get("token");
    }

    @Test
    void authenticatedPatientCanSubmitResult() throws Exception {
        String phone = uniquePhone();
        registerPatient(phone);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validResultPayload())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.gameType", is("memory")))
                .andExpect(jsonPath("$.score", is(8)))
                .andExpect(jsonPath("$.accuracy", is(0.8)))
                .andExpect(jsonPath("$.reactionTime", is(1200)))
                .andExpect(jsonPath("$.mistakes", is(2)))
                .andExpect(jsonPath("$.difficulty", is(1)))
                .andExpect(jsonPath("$.patientId", notNullValue()))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    void resultIsAssignedToAuthenticatedPatientNotClientSuppliedId() throws Exception {
        String phoneA = uniquePhone();
        String registerResponseA = registerPatient(phoneA);
        String patientIdA = patientIdFromRegisterResponse(registerResponseA);
        String tokenA = loginAndGetToken(phoneA);

        String phoneB = uniquePhone();
        registerPatient(phoneB);

        Map<String, Object> payloadWithForeignPatientId = Map.of(
                "gameType", "memory",
                "score", 5,
                "accuracy", 0.5,
                "reactionTime", 900,
                "mistakes", 1,
                "difficulty", 1,
                "patientId", "PT-999999",
                "userId", 999999);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payloadWithForeignPatientId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.patientId", is(patientIdA)));
    }

    @Test
    void invalidAccuracyIsRejected() throws Exception {
        String phone = uniquePhone();
        registerPatient(phone);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "gameType", "memory",
                                "score", 8,
                                "accuracy", 1.5,
                                "reactionTime", 1200,
                                "mistakes", 2,
                                "difficulty", 1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void negativeReactionTimeIsRejected() throws Exception {
        String phone = uniquePhone();
        registerPatient(phone);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "gameType", "memory",
                                "score", 8,
                                "accuracy", 0.8,
                                "reactionTime", -100,
                                "mistakes", 2,
                                "difficulty", 1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void negativeMistakesIsRejected() throws Exception {
        String phone = uniquePhone();
        registerPatient(phone);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "gameType", "memory",
                                "score", 8,
                                "accuracy", 0.8,
                                "reactionTime", 1200,
                                "mistakes", -2,
                                "difficulty", 1))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unauthenticatedSubmissionIsRejected() throws Exception {
        mockMvc.perform(post("/api/game-results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validResultPayload())))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void patientCanRetrieveOwnResultsNewestFirst() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "gameType", "memory", "score", 8, "accuracy", 0.8,
                                "reactionTime", 1200, "mistakes", 2, "difficulty", 1))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "gameType", "memory", "score", 9, "accuracy", 0.9,
                                "reactionTime", 1000, "mistakes", 1, "difficulty", 2))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/game-results/patient/" + patientId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(2)))
                .andExpect(jsonPath("$[0].score", is(9)))
                .andExpect(jsonPath("$[1].score", is(8)))
                .andExpect(jsonPath("$[0].patientId", is(patientId)));
    }

    @Test
    void patientCannotRetrieveAnotherPatientsResults() throws Exception {
        String phoneA = uniquePhone();
        String registerResponseA = registerPatient(phoneA);
        String patientIdA = patientIdFromRegisterResponse(registerResponseA);
        String tokenA = loginAndGetToken(phoneA);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(validResultPayload())))
                .andExpect(status().isCreated());

        String phoneB = uniquePhone();
        registerPatient(phoneB);
        String tokenB = loginAndGetToken(phoneB);

        mockMvc.perform(get("/api/game-results/patient/" + patientIdA)
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    void gettingResultsWithoutTokenIsRejected() throws Exception {
        mockMvc.perform(get("/api/game-results/patient/PT-000001"))
                .andExpect(status().isUnauthorized());
    }
}
