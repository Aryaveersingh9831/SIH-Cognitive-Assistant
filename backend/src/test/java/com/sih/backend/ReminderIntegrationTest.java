package com.sih.backend;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class ReminderIntegrationTest {

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

    private Map<String, Object> reminderPayload(String patientId, String type, String title, String scheduledAt) {
        return Map.of(
                "patientId", patientId,
                "type", type,
                "title", title,
                "scheduledAt", scheduledAt);
    }

    private Long createReminderAndGetId(String token, String patientId) throws Exception {
        String response = mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientId, "medicine", "Take morning medicine", "2026-09-08T09:00:00"))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        Number id = (Number) objectMapper.readValue(response, Map.class).get("id");
        return id.longValue();
    }

    @Test
    void patientCanCreateReminderForThemselves() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientId, "medicine", "Take morning medicine", "2026-09-08T09:00:00"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.patientId", is(patientId)))
                .andExpect(jsonPath("$.type", is("medicine")))
                .andExpect(jsonPath("$.title", is("Take morning medicine")))
                .andExpect(jsonPath("$.scheduledAt", is("2026-09-08T09:00:00")))
                .andExpect(jsonPath("$.completed", is(false)))
                .andExpect(jsonPath("$.createdAt", notNullValue()))
                .andExpect(jsonPath("$.completedAt", nullValue()));
    }

    @Test
    void unsupportedReminderTypeIsRejected() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientId, "sleep", "Take a nap", "2026-09-08T09:00:00"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void blankTitleIsRejected() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientId, "medicine", "", "2026-09-08T09:00:00"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingPatientIdIsRejected() throws Exception {
        String phone = uniquePhone();
        registerPatient(phone);
        String token = loginAndGetToken(phone);

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("type", "medicine");
        payload.put("title", "Take morning medicine");
        payload.put("scheduledAt", "2026-09-08T09:00:00");

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void missingScheduledAtIsRejected() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        Map<String, Object> payload = new java.util.HashMap<>();
        payload.put("patientId", patientId);
        payload.put("type", "medicine");
        payload.put("title", "Take morning medicine");

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void invalidScheduledAtFormatIsRejected() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientId, "medicine", "Take morning medicine", "not-a-date"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void patientCanRetrieveOwnRemindersSortedByScheduledAtAscending() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientId, "medicine", "Evening medicine", "2026-09-08T20:00:00"))))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientId, "hydration", "Drink water", "2026-09-08T08:00:00"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/reminders/patient/" + patientId).header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(2)))
                .andExpect(jsonPath("$[0].title", is("Drink water")))
                .andExpect(jsonPath("$[1].title", is("Evening medicine")));
    }

    @Test
    void patientCannotAccessAnotherPatientsReminders() throws Exception {
        String phoneA = uniquePhone();
        String registerResponseA = registerPatient(phoneA);
        String patientIdA = patientIdFromRegisterResponse(registerResponseA);
        String tokenA = loginAndGetToken(phoneA);

        mockMvc.perform(post("/api/reminders")
                        .header("Authorization", "Bearer " + tokenA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload(patientIdA, "medicine", "Take morning medicine", "2026-09-08T09:00:00"))))
                .andExpect(status().isCreated());

        String phoneB = uniquePhone();
        registerPatient(phoneB);
        String tokenB = loginAndGetToken(phoneB);

        mockMvc.perform(get("/api/reminders/patient/" + patientIdA).header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    void completingNonExistentReminderReturns404() throws Exception {
        String phone = uniquePhone();
        registerPatient(phone);
        String token = loginAndGetToken(phone);

        mockMvc.perform(patch("/api/reminders/999999/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    void patientCanCompleteOwnReminder() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);
        Long reminderId = createReminderAndGetId(token, patientId);

        mockMvc.perform(patch("/api/reminders/" + reminderId + "/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(reminderId.intValue())))
                .andExpect(jsonPath("$.completed", is(true)))
                .andExpect(jsonPath("$.completedAt", notNullValue()));
    }

    @Test
    void patientCannotCompleteAnotherPatientsReminder() throws Exception {
        String phoneA = uniquePhone();
        String registerResponseA = registerPatient(phoneA);
        String patientIdA = patientIdFromRegisterResponse(registerResponseA);
        String tokenA = loginAndGetToken(phoneA);
        Long reminderId = createReminderAndGetId(tokenA, patientIdA);

        String phoneB = uniquePhone();
        registerPatient(phoneB);
        String tokenB = loginAndGetToken(phoneB);

        mockMvc.perform(patch("/api/reminders/" + reminderId + "/complete").header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isForbidden());
    }

    @Test
    void reCompletingAlreadyCompletedReminderIsSafeAndKeepsFirstCompletionTime() throws Exception {
        String phone = uniquePhone();
        String registerResponse = registerPatient(phone);
        String patientId = patientIdFromRegisterResponse(registerResponse);
        String token = loginAndGetToken(phone);
        Long reminderId = createReminderAndGetId(token, patientId);

        String firstCompletion = mockMvc.perform(
                        patch("/api/reminders/" + reminderId + "/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(true)))
                .andReturn().getResponse().getContentAsString();
        String firstCompletedAt = (String) objectMapper.readValue(firstCompletion, Map.class).get("completedAt");

        mockMvc.perform(patch("/api/reminders/" + reminderId + "/complete").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completed", is(true)))
                .andExpect(jsonPath("$.completedAt", is(firstCompletedAt)));
    }

    @Test
    void unauthenticatedCreateIsRejected() throws Exception {
        mockMvc.perform(post("/api/reminders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                reminderPayload("PT-000001", "medicine", "Take morning medicine", "2026-09-08T09:00:00"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedGetIsRejected() throws Exception {
        mockMvc.perform(get("/api/reminders/patient/PT-000001")).andExpect(status().isUnauthorized());
    }

    @Test
    void unauthenticatedCompleteIsRejected() throws Exception {
        mockMvc.perform(patch("/api/reminders/1/complete")).andExpect(status().isUnauthorized());
    }
}
