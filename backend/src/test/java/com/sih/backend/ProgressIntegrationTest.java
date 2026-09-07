package com.sih.backend;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
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
class ProgressIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String uniquePhone() {
        return "9" + String.valueOf(System.nanoTime()).substring(0, 9);
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

    private void submitResult(String token, int score, double accuracy, int reactionTime, int mistakes, int difficulty)
            throws Exception {
        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "gameType", "memory",
                                "score", score,
                                "accuracy", accuracy,
                                "reactionTime", reactionTime,
                                "mistakes", mistakes,
                                "difficulty", difficulty))))
                .andExpect(status().isCreated());
    }

    @Test
    void patientWithNoResultsGetsValidEmptyProgressWithDefaultCurrentDifficulty() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId", is(patientId)))
                .andExpect(jsonPath("$.totalSessions", is(0)))
                .andExpect(jsonPath("$.averageAccuracy", is(0.0)))
                .andExpect(jsonPath("$.currentDifficulty", is(1)))
                .andExpect(jsonPath("$.averageDifficulty", nullValue()))
                .andExpect(jsonPath("$.recentPerformanceTrend", is("insufficient_data")))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void patientWithOneResultGetsCorrectTotalsAndPersistentCurrentDifficulty() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        // GameResult.difficulty (3) is historical session data and must NOT leak into
        // the patient's persistent currentDifficulty, which starts at 1 and only
        // changes via a validated ML recommendation (see GameResultMlIntegrationTest).
        submitResult(token, 8, 0.8, 1200, 2, 3);

        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions", is(1)))
                .andExpect(jsonPath("$.averageAccuracy", is(0.8)))
                .andExpect(jsonPath("$.currentDifficulty", is(1)))
                .andExpect(jsonPath("$.averageDifficulty", is(3.0)))
                .andExpect(jsonPath("$.recentPerformanceTrend", is("insufficient_data")));
    }

    @Test
    void averageDifficultyReflectsResultsWhileCurrentDifficultyStaysPatientState() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        submitResult(token, 5, 0.5, 1500, 3, 1);
        submitResult(token, 7, 0.7, 1300, 2, 2);

        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions", is(2)))
                .andExpect(jsonPath("$.averageAccuracy", is(0.6)))
                .andExpect(jsonPath("$.currentDifficulty", is(1)))
                .andExpect(jsonPath("$.averageDifficulty", is(1.5)));
    }

    @Test
    void trendIsImprovingWhenRecentSessionsOutperformOlderOnes() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        submitResult(token, 4, 0.4, 1500, 5, 1);
        submitResult(token, 5, 0.4, 1500, 5, 1);
        submitResult(token, 8, 0.9, 1000, 1, 2);
        submitResult(token, 9, 0.9, 1000, 1, 2);

        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentPerformanceTrend", is("improving")));
    }

    @Test
    void trendIsDecliningWhenRecentSessionsWorseThanOlderOnes() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        submitResult(token, 9, 0.9, 1000, 1, 2);
        submitResult(token, 8, 0.9, 1000, 1, 2);
        submitResult(token, 5, 0.4, 1500, 5, 1);
        submitResult(token, 4, 0.4, 1500, 5, 1);

        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentPerformanceTrend", is("declining")));
    }

    @Test
    void trendIsStableWhenPerformanceDoesNotChangeMuch() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        submitResult(token, 7, 0.7, 1200, 2, 2);
        submitResult(token, 7, 0.7, 1200, 2, 2);
        submitResult(token, 7, 0.71, 1200, 2, 2);
        submitResult(token, 7, 0.71, 1200, 2, 2);

        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recentPerformanceTrend", is("stable")));
    }

    @Test
    void resultsAreCorrectlyAssociatedWithOwningPatientOnly() throws Exception {
        String phoneA = uniquePhone();
        String registerResponseA = registerPatient(phoneA);
        String patientIdA = patientIdFromRegisterResponse(registerResponseA);
        String tokenA = loginAndGetToken(phoneA);
        submitResult(tokenA, 8, 0.8, 1200, 2, 1);

        String phoneB = uniquePhone();
        String registerResponseB = registerPatient(phoneB);
        String patientIdB = patientIdFromRegisterResponse(registerResponseB);
        String tokenB = loginAndGetToken(phoneB);

        mockMvc.perform(get("/api/progress/patient/" + patientIdB).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions", is(0)));

        mockMvc.perform(get("/api/progress/patient/" + patientIdA).header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSessions", is(1)));
    }

    @Test
    void authenticatedPatientCanAccessOwnProgress() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void patientCannotAccessAnotherPatientsProgress() throws Exception {
        String phoneA = uniquePhone();
        String registerResponseA = registerPatient(phoneA);
        String patientIdA = patientIdFromRegisterResponse(registerResponseA);
        submitResult(loginAndGetToken(phoneA), 8, 0.8, 1200, 2, 1);

        String phoneB = uniquePhone();
        registerPatient(phoneB);
        String tokenB = loginAndGetToken(phoneB);

        mockMvc.perform(get("/api/progress/patient/" + patientIdA).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedAccessReturns401() throws Exception {
        mockMvc.perform(get("/api/progress/patient/PT-000001"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unknownOrMalformedPatientIdIsRejectedAsForbidden() throws Exception {
        String phone = uniquePhone();
        registerPatient(phone);
        String token = loginAndGetToken(phone);

        mockMvc.perform(get("/api/progress/patient/not-a-real-patient-id").header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }
}
