package com.sih.backend.repository;

import com.sih.backend.entity.CaregiverPatient;
import com.sih.backend.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CaregiverPatientRepository extends JpaRepository<CaregiverPatient, Long> {

    List<CaregiverPatient> findByCaregiver(User caregiver);

    boolean existsByCaregiverAndPatient(User caregiver, User patient);
}
