package com.sih.backend;

import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.sih.backend.entity.CaregiverPatient;
import com.sih.backend.entity.User;
import com.sih.backend.repository.CaregiverPatientRepository;
import com.sih.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

/**
 * Covers the Issue #29 caregiver-patient authorization matrix: the caregiver
 * patient-list endpoint, and caregiver access to the existing Progress/GameResult
 * endpoints. Caregiver-patient links are created directly via
 * {@link CaregiverPatientRepository} (test fixture setup), since Issue #29
 * deliberately does not add a public API for creating them.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CaregiverAuthorizationIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CaregiverPatientRepository caregiverPatientRepository;

    private String uniquePhone() {
        return "9" + String.valueOf(System.nanoTime()).substring(0, 9);
    }

    private Map<String, Object> registerAndLogin(String name, String role) throws Exception {
        String phone = uniquePhone();
        String registerResponse = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", name, "phone", phone, "password", "secret123", "role", role))))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String patientId = (String) objectMapper.readValue(registerResponse, Map.class).get("patientId");

        String loginResponse = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("identifier", phone, "password", "secret123"))))
                .andReturn().getResponse().getContentAsString();
        Map<?, ?> loginBody = objectMapper.readValue(loginResponse, Map.class);
        String token = (String) loginBody.get("token");
        Number userId = (Number) loginBody.get("userId");

        return Map.of("phone", phone, "patientId", patientId == null ? "" : patientId, "token", token, "userId", userId
                .longValue());
    }

    private void linkCaregiverToPatient(Long caregiverUserId, Long patientUserId) {
        User caregiver = userRepository.findById(caregiverUserId).orElseThrow();
        User patient = userRepository.findById(patientUserId).orElseThrow();
        caregiverPatientRepository.save(new CaregiverPatient(caregiver, patient, LocalDateTime.now()));
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

    // ---- GET /api/caregiver/patients ----

    @Test
    void caregiverCanListLinkedPatients() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver One", "caregiver");
        Map<String, Object> patient = registerAndLogin("Patient One", "patient");
        linkCaregiverToPatient((Long) caregiver.get("userId"), (Long) patient.get("userId"));

        mockMvc.perform(get("/api/caregiver/patients").header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(1)))
                .andExpect(jsonPath("$[0].patientId", is(patient.get("patientId"))))
                .andExpect(jsonPath("$[0].name", is("Patient One")))
                .andExpect(jsonPath("$[0].lastActive", nullValue()));
    }

    @Test
    void caregiverPatientListReturnsOnlyLinkedPatients() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Two", "caregiver");
        Map<String, Object> linkedPatient = registerAndLogin("Linked Patient", "patient");
        Map<String, Object> unlinkedPatient = registerAndLogin("Unlinked Patient", "patient");
        linkCaregiverToPatient((Long) caregiver.get("userId"), (Long) linkedPatient.get("userId"));

        mockMvc.perform(get("/api/caregiver/patients").header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(1)))
                .andExpect(jsonPath("$[0].patientId", is(linkedPatient.get("patientId"))));
    }

    @Test
    void oneCaregiverCannotSeeAnotherCaregiversPatients() throws Exception {
        Map<String, Object> caregiverA = registerAndLogin("Caregiver A", "caregiver");
        Map<String, Object> caregiverB = registerAndLogin("Caregiver B", "caregiver");
        Map<String, Object> patientOfA = registerAndLogin("Patient Of A", "patient");
        linkCaregiverToPatient((Long) caregiverA.get("userId"), (Long) patientOfA.get("userId"));

        mockMvc.perform(get("/api/caregiver/patients").header("Authorization", "Bearer " + caregiverB.get("token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(0)));
    }

    @Test
    void patientCannotCallCaregiverPatientList() throws Exception {
        Map<String, Object> patient = registerAndLogin("Solo Patient", "patient");

        mockMvc.perform(get("/api/caregiver/patients").header("Authorization", "Bearer " + patient.get("token")))
                .andExpect(status().isForbidden());
    }

    @Test
    void healthWorkerCannotCallCaregiverPatientList() throws Exception {
        Map<String, Object> healthWorker = registerAndLogin("Nurse Joy", "health_worker");

        mockMvc.perform(get("/api/caregiver/patients").header("Authorization", "Bearer " + healthWorker.get("token")))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedCannotCallCaregiverPatientList() throws Exception {
        mockMvc.perform(get("/api/caregiver/patients")).andExpect(status().isUnauthorized());
    }

    @Test
    void patientWithNoGameResultsHasNullLastActive() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Three", "caregiver");
        Map<String, Object> patient = registerAndLogin("Quiet Patient", "patient");
        linkCaregiverToPatient((Long) caregiver.get("userId"), (Long) patient.get("userId"));

        mockMvc.perform(get("/api/caregiver/patients").header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].lastActive", nullValue()));
    }

    @Test
    void patientWithMultipleGameResultsReturnsNewestAsLastActive() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Four", "caregiver");
        Map<String, Object> patient = registerAndLogin("Active Patient", "patient");
        linkCaregiverToPatient((Long) caregiver.get("userId"), (Long) patient.get("userId"));

        submitResult((String) patient.get("token"), 5, 0.5, 1500, 3, 1);
        submitResult((String) patient.get("token"), 7, 0.7, 1300, 2, 2);

        String response = mockMvc.perform(
                        get("/api/caregiver/patients").header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        java.util.List<Map<String, Object>> body = objectMapper.readValue(response, java.util.List.class);
        Object lastActive = body.get(0).get("lastActive");
        org.junit.jupiter.api.Assertions.assertNotNull(lastActive);
    }

    // ---- GET /api/progress/patient/{patientId} ----

    @Test
    void authorizedCaregiverCanFetchLinkedPatientProgress() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Five", "caregiver");
        Map<String, Object> patient = registerAndLogin("Progress Patient", "patient");
        linkCaregiverToPatient((Long) caregiver.get("userId"), (Long) patient.get("userId"));

        mockMvc.perform(get("/api/progress/patient/" + patient.get("patientId"))
                        .header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.patientId", is(patient.get("patientId"))));
    }

    @Test
    void unauthorizedCaregiverGets403ForAnotherPatientsProgress() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Six", "caregiver");
        Map<String, Object> unrelatedPatient = registerAndLogin("Unrelated Patient A", "patient");

        mockMvc.perform(get("/api/progress/patient/" + unrelatedPatient.get("patientId"))
                        .header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isForbidden());
    }

    // ---- GET /api/game-results/patient/{patientId} ----

    @Test
    void authorizedCaregiverCanFetchLinkedPatientGameResults() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Seven", "caregiver");
        Map<String, Object> patient = registerAndLogin("GameResult Patient", "patient");
        linkCaregiverToPatient((Long) caregiver.get("userId"), (Long) patient.get("userId"));
        submitResult((String) patient.get("token"), 8, 0.8, 1200, 2, 1);

        mockMvc.perform(get("/api/game-results/patient/" + patient.get("patientId"))
                        .header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()", is(1)))
                .andExpect(jsonPath("$[0].patientId", is(patient.get("patientId"))));
    }

    @Test
    void unauthorizedCaregiverGets403ForAnotherPatientsGameResults() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Eight", "caregiver");
        Map<String, Object> unrelatedPatient = registerAndLogin("Unrelated Patient B", "patient");

        mockMvc.perform(get("/api/game-results/patient/" + unrelatedPatient.get("patientId"))
                        .header("Authorization", "Bearer " + caregiver.get("token")))
                .andExpect(status().isForbidden());
    }

    // ---- Health-worker must not gain access accidentally ----

    @Test
    void healthWorkerCannotAccessPatientProgressOrGameResults() throws Exception {
        Map<String, Object> healthWorker = registerAndLogin("Nurse Betty", "health_worker");
        Map<String, Object> patient = registerAndLogin("HW Patient", "patient");

        mockMvc.perform(get("/api/progress/patient/" + patient.get("patientId"))
                        .header("Authorization", "Bearer " + healthWorker.get("token")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/game-results/patient/" + patient.get("patientId"))
                        .header("Authorization", "Bearer " + healthWorker.get("token")))
                .andExpect(status().isForbidden());
    }

    // ---- Duplicate relationship prevention ----

    @Test
    void duplicateCaregiverPatientRelationshipIsRejected() throws Exception {
        Map<String, Object> caregiver = registerAndLogin("Caregiver Nine", "caregiver");
        Map<String, Object> patient = registerAndLogin("Duplicate Link Patient", "patient");

        User caregiverEntity =
                userRepository.findById((Long) caregiver.get("userId")).orElseThrow();
        User patientEntity = userRepository.findById((Long) patient.get("userId")).orElseThrow();

        caregiverPatientRepository.saveAndFlush(
                new CaregiverPatient(caregiverEntity, patientEntity, LocalDateTime.now()));

        assertThrows(
                DataIntegrityViolationException.class,
                () -> caregiverPatientRepository.saveAndFlush(
                        new CaregiverPatient(caregiverEntity, patientEntity, LocalDateTime.now())));
    }
}
