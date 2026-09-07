package com.sih.backend.service;

import com.sih.backend.client.MlDifficultyClient;
import com.sih.backend.dto.GameResultRequest;
import com.sih.backend.dto.GameResultResponse;
import com.sih.backend.dto.MlDifficultyRequest;
import com.sih.backend.entity.GameResult;
import com.sih.backend.entity.User;
import com.sih.backend.exception.PatientNotFoundException;
import com.sih.backend.repository.GameResultRepository;
import com.sih.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GameResultService {

    private static final Logger log = LoggerFactory.getLogger(GameResultService.class);
    private static final int MIN_DIFFICULTY = 1;
    private static final int MAX_DIFFICULTY = 5;

    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;
    private final MlDifficultyClient mlDifficultyClient;
    private final CaregiverAuthorizationService caregiverAuthorizationService;

    public GameResultService(
            GameResultRepository gameResultRepository,
            UserRepository userRepository,
            MlDifficultyClient mlDifficultyClient,
            CaregiverAuthorizationService caregiverAuthorizationService) {
        this.gameResultRepository = gameResultRepository;
        this.userRepository = userRepository;
        this.mlDifficultyClient = mlDifficultyClient;
        this.caregiverAuthorizationService = caregiverAuthorizationService;
    }

    @Transactional
    public GameResultResponse submitResult(Long authenticatedUserId, GameResultRequest request) {
        User user = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        GameResult result = new GameResult(
                request.getGameType(),
                request.getScore(),
                request.getAccuracy(),
                request.getReactionTime(),
                request.getMistakes(),
                request.getDifficulty(),
                user,
                LocalDateTime.now());

        gameResultRepository.save(result);

        GameResultResponse response = toResponse(result);

        updateDifficultyFromMl(user, request);

        return response;
    }

    /**
     * Best-effort: an unreachable/misbehaving ML service must never fail the
     * GameResult submission that already succeeded above, so every failure
     * path here is swallowed (and logged) rather than propagated.
     */
    private void updateDifficultyFromMl(User user, GameResultRequest request) {
        try {
            MlDifficultyRequest mlRequest = new MlDifficultyRequest(
                    request.getGameType(),
                    request.getScore(),
                    request.getAccuracy(),
                    request.getReactionTime(),
                    request.getMistakes(),
                    user.getCurrentDifficulty());

            Integer recommended = mlDifficultyClient.recommendDifficulty(mlRequest);

            if (recommended == null) {
                return;
            }
            if (recommended < MIN_DIFFICULTY || recommended > MAX_DIFFICULTY) {
                log.warn("Ignoring out-of-range ML recommendation {} for user {}", recommended, user.getId());
                return;
            }

            user.setCurrentDifficulty(recommended);
            userRepository.save(user);
        } catch (Exception ex) {
            log.warn("Failed to update currentDifficulty from ML for user {}: {}", user.getId(), ex.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<GameResultResponse> getResultsForPatient(Long authenticatedUserId, String requestedPatientId) {
        User authenticatedUser = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        // An unknown/malformed patientId is treated as 403, not 404, so this endpoint
        // never reveals whether a given patientId actually exists.
        User targetPatient = userRepository
                .findByPatientId(requestedPatientId)
                .orElseThrow(() -> new AccessDeniedException("You are not authorized to view these results"));

        if (!caregiverAuthorizationService.isAuthorized(authenticatedUser, targetPatient)) {
            throw new AccessDeniedException("You are not authorized to view these results");
        }

        return gameResultRepository.findByUserOrderByCreatedAtDesc(targetPatient).stream()
                .map(this::toResponse)
                .toList();
    }

    private GameResultResponse toResponse(GameResult result) {
        return new GameResultResponse(
                result.getId(),
                result.getGameType(),
                result.getScore(),
                result.getAccuracy(),
                result.getReactionTime(),
                result.getMistakes(),
                result.getDifficulty(),
                result.getUser().getPatientId(),
                result.getCreatedAt());
    }
}
