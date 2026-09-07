package com.sih.backend.service;

import com.sih.backend.dto.ProgressResponse;
import com.sih.backend.entity.GameResult;
import com.sih.backend.entity.User;
import com.sih.backend.exception.PatientNotFoundException;
import com.sih.backend.repository.GameResultRepository;
import com.sih.backend.repository.UserRepository;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Progress is a derived view over {@link GameResult} data; there is no separate
 * progress table. See {@link #calculateTrend(List)} for the trend algorithm.
 */
@Service
public class ProgressService {

    private static final int MIN_SESSIONS_FOR_TREND = 3;
    private static final double TREND_THRESHOLD = 0.05;
    private static final String TREND_INSUFFICIENT_DATA = "insufficient_data";
    private static final String TREND_IMPROVING = "improving";
    private static final String TREND_DECLINING = "declining";
    private static final String TREND_STABLE = "stable";

    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;
    private final CaregiverAuthorizationService caregiverAuthorizationService;

    public ProgressService(
            GameResultRepository gameResultRepository,
            UserRepository userRepository,
            CaregiverAuthorizationService caregiverAuthorizationService) {
        this.gameResultRepository = gameResultRepository;
        this.userRepository = userRepository;
        this.caregiverAuthorizationService = caregiverAuthorizationService;
    }

    @Transactional(readOnly = true)
    public ProgressResponse getProgressForPatient(Long authenticatedUserId, String requestedPatientId) {
        User authenticatedUser = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        // An unknown/malformed patientId is treated as 403, not 404, so this endpoint
        // never reveals whether a given patientId actually exists.
        User targetPatient = userRepository
                .findByPatientId(requestedPatientId)
                .orElseThrow(() -> new AccessDeniedException("You are not authorized to view this progress data"));

        if (!caregiverAuthorizationService.isAuthorized(authenticatedUser, targetPatient)) {
            throw new AccessDeniedException("You are not authorized to view this progress data");
        }

        List<GameResult> results = gameResultRepository.findByUserOrderByCreatedAtDesc(targetPatient);

        if (results.isEmpty()) {
            return new ProgressResponse(
                    requestedPatientId, 0, 0.0, targetPatient.getCurrentDifficulty(), null, TREND_INSUFFICIENT_DATA);
        }

        int totalSessions = results.size();
        double averageAccuracy = results.stream().mapToDouble(GameResult::getAccuracy).average().orElse(0.0);
        int currentDifficulty = targetPatient.getCurrentDifficulty();
        double averageDifficulty = results.stream().mapToInt(GameResult::getDifficulty).average().orElse(0.0);
        String trend = calculateTrend(results);

        return new ProgressResponse(
                requestedPatientId, totalSessions, averageAccuracy, currentDifficulty, averageDifficulty, trend);
    }

    /**
     * Deterministic trend algorithm: with fewer than {@value #MIN_SESSIONS_FOR_TREND}
     * sessions there isn't enough data. Otherwise, split the results (newest first)
     * into a "recent" half and the "previous" half immediately before it (the
     * single middle session is dropped for an odd count) and compare their average
     * accuracy. A difference greater than {@value #TREND_THRESHOLD} in either
     * direction is "improving"/"declining"; anything smaller is "stable".
     */
    private String calculateTrend(List<GameResult> resultsNewestFirst) {
        int size = resultsNewestFirst.size();
        if (size < MIN_SESSIONS_FOR_TREND) {
            return TREND_INSUFFICIENT_DATA;
        }

        int halfSize = size / 2;
        List<GameResult> recentGroup = resultsNewestFirst.subList(0, halfSize);
        List<GameResult> previousGroup = resultsNewestFirst.subList(halfSize, halfSize * 2);

        double recentAverage = recentGroup.stream().mapToDouble(GameResult::getAccuracy).average().orElse(0.0);
        double previousAverage = previousGroup.stream().mapToDouble(GameResult::getAccuracy).average().orElse(0.0);

        double difference = recentAverage - previousAverage;

        if (difference > TREND_THRESHOLD) {
            return TREND_IMPROVING;
        }
        if (difference < -TREND_THRESHOLD) {
            return TREND_DECLINING;
        }
        return TREND_STABLE;
    }
}
