package com.sih.backend.service;

import com.sih.backend.entity.Role;
import com.sih.backend.entity.User;
import com.sih.backend.repository.CaregiverPatientRepository;
import org.springframework.stereotype.Service;

/**
 * Single place that decides whether an authenticated user may access a given patient's
 * data (progress, game results). Shared by {@link ProgressService} and
 * {@link GameResultService} so the authorization matrix isn't duplicated per controller.
 *
 * <ul>
 *   <li>PATIENT: authorized only for their own record.</li>
 *   <li>CAREGIVER: authorized only when a persisted {@code CaregiverPatient} link exists.</li>
 *   <li>Any other role (e.g. HEALTH_WORKER): never authorized here — least privilege
 *       until a health-worker-patient relationship model is defined.</li>
 * </ul>
 */
@Service
public class CaregiverAuthorizationService {

    private final CaregiverPatientRepository caregiverPatientRepository;

    public CaregiverAuthorizationService(CaregiverPatientRepository caregiverPatientRepository) {
        this.caregiverPatientRepository = caregiverPatientRepository;
    }

    public boolean isAuthorized(User authenticatedUser, User targetPatient) {
        if (authenticatedUser.getRole() == Role.PATIENT) {
            return authenticatedUser.getId().equals(targetPatient.getId());
        }
        if (authenticatedUser.getRole() == Role.CAREGIVER) {
            return caregiverPatientRepository.existsByCaregiverAndPatient(authenticatedUser, targetPatient);
        }
        return false;
    }
}
