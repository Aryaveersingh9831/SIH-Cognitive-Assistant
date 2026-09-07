package com.sih.backend.service;

import com.sih.backend.dto.CaregiverPatientResponse;
import com.sih.backend.entity.CaregiverPatient;
import com.sih.backend.entity.GameResult;
import com.sih.backend.entity.User;
import com.sih.backend.exception.PatientNotFoundException;
import com.sih.backend.repository.CaregiverPatientRepository;
import com.sih.backend.repository.GameResultRepository;
import com.sih.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CaregiverService {

    private final CaregiverPatientRepository caregiverPatientRepository;
    private final GameResultRepository gameResultRepository;
    private final UserRepository userRepository;

    public CaregiverService(
            CaregiverPatientRepository caregiverPatientRepository,
            GameResultRepository gameResultRepository,
            UserRepository userRepository) {
        this.caregiverPatientRepository = caregiverPatientRepository;
        this.gameResultRepository = gameResultRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CaregiverPatientResponse> getPatientsForCaregiver(Long authenticatedUserId) {
        User caregiver = userRepository
                .findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Caregiver not found"));

        return caregiverPatientRepository.findByCaregiver(caregiver).stream()
                .map(CaregiverPatient::getPatient)
                .map(this::toResponse)
                .sorted(Comparator
                        .comparing(
                                CaregiverPatientResponse::getLastActive,
                                Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(CaregiverPatientResponse::getName)
                        .thenComparing(CaregiverPatientResponse::getPatientId))
                .toList();
    }

    private CaregiverPatientResponse toResponse(User patient) {
        LocalDateTime lastActive = gameResultRepository
                .findTopByUserOrderByCreatedAtDesc(patient)
                .map(GameResult::getCreatedAt)
                .orElse(null);
        return new CaregiverPatientResponse(patient.getPatientId(), patient.getName(), lastActive);
    }
}
