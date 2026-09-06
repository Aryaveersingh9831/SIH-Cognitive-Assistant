package com.sih.backend.repository;

import com.sih.backend.entity.Role;
import com.sih.backend.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByPatientId(String patientId);

    boolean existsByPhone(String phone);

    long countByRole(Role role);
}
