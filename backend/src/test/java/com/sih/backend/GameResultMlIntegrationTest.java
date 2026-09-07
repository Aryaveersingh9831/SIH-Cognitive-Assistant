package com.sih.backend;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sih.backend.client.MlDifficultyClient;
import com.sih.backend.dto.MlDifficultyRequest;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.http.HttpStatus;
import tools.jackson.databind.ObjectMapper;

/**
 * Covers the Spring Boot <-> ML difficulty service integration (Issue #6).
 * {@link MlDifficultyClient} is mocked here so these tests don't depend on a
 * running ML service; {@link MlDifficultyClient}'s own failure handling
 * (connection refused, timeouts, malformed responses) lives in the client
 * and is not re-tested against a real FastAPI process in this suite.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class GameResultMlIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private MlDifficultyClient mlDifficultyClient;

    private String uniquePhone() {
        return "9" + String.valueOf(System.nanoTime()).substring(0, 9);
    }

    private String registerPatient(String phone) throws Exception {
        return mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "Test Patient", "phone", phone, "password", "secret123", "role", "patient"))))
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

    private Map<String, Object> resultPayload(int score, double accuracy, int reactionTime, int mistakes, int difficulty) {
        return Map.of(
                "gameType", "memory",
                "score", score,
                "accuracy", accuracy,
                "reactionTime", reactionTime,
                "mistakes", mistakes,
                "difficulty", difficulty);
    }

    private void submitResult(String token, Map<String, Object> payload) throws Exception {
        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isCreated());
    }

    private void assertCurrentDifficulty(String token, String patientId, int expected) throws Exception {
        mockMvc.perform(get("/api/progress/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentDifficulty", is(expected)));
    }

    @Test
    void successfulMlRecommendationUpdatesCurrentDifficulty() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(2);

        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));

        assertCurrentDifficulty(token, patientId, 2);
    }

    @Test
    void mlRequestUsesPatientPersistentCurrentDifficultyNotSubmittedDifficulty() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(2);
        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));
        assertCurrentDifficulty(token, patientId, 2);

        ArgumentCaptor<MlDifficultyRequest> captor = ArgumentCaptor.forClass(MlDifficultyRequest.class);
        when(mlDifficultyClient.recommendDifficulty(captor.capture())).thenReturn(3);

        // Submitted GameResult.difficulty is 5 (stale/unrelated), but the ML request must
        // carry the patient's persistent currentDifficulty, which is now 2.
        submitResult(token, resultPayload(9, 0.9, 1000, 1, 5));

        MlDifficultyRequest sentRequest = captor.getValue();
        assertEquals("memory", sentRequest.getGameType());
        assertEquals(9, sentRequest.getScore());
        assertEquals(0.9, sentRequest.getAccuracy());
        assertEquals(1000, sentRequest.getReactionTime());
        assertEquals(1, sentRequest.getMistakes());
        assertEquals(2, sentRequest.getCurrentDifficulty());

        assertCurrentDifficulty(token, patientId, 3);
    }

    @Test
    void gameResultDifficultyIsPreservedWhileCurrentDifficultyIsUpdated() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(3);

        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resultPayload(8, 0.8, 1200, 2, 2))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.difficulty", is(2)));

        assertCurrentDifficulty(token, patientId, 3);
    }

    @Test
    void mlConnectionFailureStillSavesResultAndLeavesDifficultyUnchanged() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        when(mlDifficultyClient.recommendDifficulty(any()))
                .thenThrow(new ResourceAccessException("Connection refused"));

        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));

        assertCurrentDifficulty(token, patientId, 1);
    }

    @Test
    void mlHttpErrorStillSavesResultAndLeavesDifficultyUnchanged() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        doThrow(HttpServerErrorException.create(
                        HttpStatus.SERVICE_UNAVAILABLE, "Service Unavailable", null, null, null))
                .when(mlDifficultyClient)
                .recommendDifficulty(any());

        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));

        assertCurrentDifficulty(token, patientId, 1);
    }

    @Test
    void invalidRecommendationBelowRangeIsRejected() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(0);

        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));

        assertCurrentDifficulty(token, patientId, 1);
    }

    @Test
    void invalidRecommendationAboveRangeIsRejected() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(6);

        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));

        assertCurrentDifficulty(token, patientId, 1);
    }

    @Test
    void nullRecommendationLeavesDifficultyUnchanged() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(null);

        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));

        assertCurrentDifficulty(token, patientId, 1);
    }

    @Test
    void progressApiReflectsMlRecommendationAfterSubmission() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        assertCurrentDifficulty(token, patientId, 1);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(3);
        submitResult(token, resultPayload(8, 0.8, 1200, 2, 1));

        assertCurrentDifficulty(token, patientId, 3);
    }

    @Test
    void ownershipStillPreventsCrossPatientDifficultyUpdates() throws Exception {
        String phoneA = uniquePhone();
        String registerResponseA = registerPatient(phoneA);
        String patientIdA = patientIdFromRegisterResponse(registerResponseA);
        String tokenA = loginAndGetToken(phoneA);

        String phoneB = uniquePhone();
        String registerResponseB = registerPatient(phoneB);
        String patientIdB = patientIdFromRegisterResponse(registerResponseB);
        String tokenB = loginAndGetToken(phoneB);

        when(mlDifficultyClient.recommendDifficulty(any())).thenReturn(4);

        // Patient A submits a result carrying patient B's identifiers in the body;
        // ownership must be resolved from the authenticated JWT, not the body.
        mockMvc.perform(post("/api/game-results")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "gameType", "memory",
                                "score", 8,
                                "accuracy", 0.8,
                                "reactionTime", 1200,
                                "mistakes", 2,
                                "difficulty", 1,
                                "patientId", patientIdB))))
                .andExpect(status().isCreated());

        assertCurrentDifficulty(tokenA, patientIdA, 4);
        assertCurrentDifficulty(tokenB, patientIdB, 1);

        mockMvc.perform(get("/api/progress/patient/" + patientIdA).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

}
