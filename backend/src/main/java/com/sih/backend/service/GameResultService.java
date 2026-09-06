package com.sih.backend.service;

import com.sih.backend.dto.GameResultRequest;
import com.sih.backend.dto.GameResultResponse;
import com.sih.backend.entity.GameResult;
import com.sih.backend.entity.Role;
import com.sih.backend.entity.User;
import com.sih.backend.exception.PatientNotFoundException;
import com.sih.backend.repository.GameResultRepository;
import com.sih.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GameResultService {

    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;

    public GameResultService(GameResultRepository gameResultRepository, UserRepository userRepository) {
        this.gameResultRepository = gameResultRepository;
        this.userRepository = userRepository;
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

        return toResponse(result);
    }

    @Transactional(readOnly = true)
    public List<GameResultResponse> getResultsForPatient(Long authenticatedUserId, String requestedPatientId) {
        User authenticatedUser = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        boolean isOwner = authenticatedUser.getRole() == Role.PATIENT
                && authenticatedUser.getPatientId() != null
                && authenticatedUser.getPatientId().equals(requestedPatientId);

        if (!isOwner) {
            throw new AccessDeniedException("You are not authorized to view these results");
        }

        return gameResultRepository.findByUserOrderByCreatedAtDesc(authenticatedUser).stream()
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
