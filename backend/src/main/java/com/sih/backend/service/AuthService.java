package com.sih.backend.service;

import com.sih.backend.dto.LoginRequest;
import com.sih.backend.dto.LoginResponse;
import com.sih.backend.dto.MeResponse;
import com.sih.backend.dto.RegisterRequest;
import com.sih.backend.dto.RegisterResponse;
import com.sih.backend.entity.Role;
import com.sih.backend.entity.User;
import com.sih.backend.exception.DuplicatePhoneException;
import com.sih.backend.exception.InvalidCredentialsException;
import com.sih.backend.exception.InvalidRoleException;
import com.sih.backend.exception.PatientNotFoundException;
import com.sih.backend.repository.UserRepository;
import com.sih.backend.security.JwtService;
import java.util.Optional;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        Role role = parseRole(request.getRole());

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new DuplicatePhoneException("Phone number already registered");
        }

        String passwordHash = passwordEncoder.encode(request.getPassword());
        String patientId = role == Role.PATIENT ? generatePatientId() : null;

        User user = new User(request.getName(), request.getPhone(), passwordHash, role, patientId);
        userRepository.save(user);

        return new RegisterResponse("Registration successful", toApiRole(role), patientId);
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        User user = findByIdentifier(request.getIdentifier())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid credentials"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new InvalidCredentialsException("Invalid credentials");
        }

        String token = jwtService.generateToken(user.getId(), user.getRole().name());
        return new LoginResponse(token, toApiRole(user.getRole()), user.getId());
    }

    @Transactional(readOnly = true)
    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new PatientNotFoundException("User not found"));
        return new MeResponse(user.getId(), toApiRole(user.getRole()), user.getPatientId());
    }

    private Optional<User> findByIdentifier(String identifier) {
        return userRepository.findByPhone(identifier)
                .or(() -> userRepository.findByPatientId(identifier));
    }

    private Role parseRole(String rawRole) {
        try {
            return Role.valueOf(rawRole.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new InvalidRoleException("Invalid role");
        }
    }

    private String toApiRole(Role role) {
        return role.name().toLowerCase();
    }

    private String generatePatientId() {
        long sequence = userRepository.countByRole(Role.PATIENT) + 1;
        String candidate = String.format("PT-%06d", sequence);
        while (userRepository.findByPatientId(candidate).isPresent()) {
            sequence++;
            candidate = String.format("PT-%06d", sequence);
        }
        return candidate;
    }
}
