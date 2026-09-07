package com.sih.backend.service;

import com.sih.backend.dto.ReminderRequest;
import com.sih.backend.dto.ReminderResponse;
import com.sih.backend.entity.Reminder;
import com.sih.backend.entity.ReminderType;
import com.sih.backend.entity.Role;
import com.sih.backend.entity.User;
import com.sih.backend.exception.InvalidReminderTypeException;
import com.sih.backend.exception.PatientNotFoundException;
import com.sih.backend.exception.ReminderNotFoundException;
import com.sih.backend.repository.ReminderRepository;
import com.sih.backend.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ownership today mirrors {@link GameResultService}/{@link ProgressService}: only the
 * authenticated PATIENT who owns a patientId may create/view/complete their own
 * reminders. There is no caregiver-patient relationship model yet, so CAREGIVER and
 * HEALTH_WORKER users currently receive 403 for any patientId, same as the existing
 * GameResult/Progress APIs. {@link #isOwner(User, String)} is the single place a future
 * caregiver-patient relationship check would be added without changing this API's
 * contract.
 */
@Service
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;

    public ReminderService(ReminderRepository reminderRepository, UserRepository userRepository) {
        this.reminderRepository = reminderRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReminderResponse createReminder(Long authenticatedUserId, ReminderRequest request) {
        User authenticatedUser = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        if (!isOwner(authenticatedUser, request.getPatientId())) {
            throw new AccessDeniedException("You are not authorized to create a reminder for this patient");
        }

        ReminderType type = parseType(request.getType());

        Reminder reminder =
                new Reminder(authenticatedUser, type, request.getTitle(), request.getScheduledAt(), LocalDateTime.now());
        reminderRepository.save(reminder);

        return toResponse(reminder);
    }

    @Transactional(readOnly = true)
    public List<ReminderResponse> getRemindersForPatient(Long authenticatedUserId, String requestedPatientId) {
        User authenticatedUser = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        if (!isOwner(authenticatedUser, requestedPatientId)) {
            throw new AccessDeniedException("You are not authorized to view these reminders");
        }

        return reminderRepository.findByUserOrderByScheduledAtAsc(authenticatedUser).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ReminderResponse completeReminder(Long authenticatedUserId, Long reminderId) {
        User authenticatedUser = userRepository.findById(authenticatedUserId)
                .orElseThrow(() -> new PatientNotFoundException("Patient not found"));

        Reminder reminder = reminderRepository
                .findById(reminderId)
                .orElseThrow(() -> new ReminderNotFoundException("Reminder not found"));

        if (!isOwner(authenticatedUser, reminder.getUser().getPatientId())) {
            throw new AccessDeniedException("You are not authorized to complete this reminder");
        }

        if (!reminder.isCompleted()) {
            reminder.markCompleted(LocalDateTime.now());
            reminderRepository.save(reminder);
        }

        return toResponse(reminder);
    }

    private boolean isOwner(User authenticatedUser, String requestedPatientId) {
        return authenticatedUser.getRole() == Role.PATIENT
                && authenticatedUser.getPatientId() != null
                && authenticatedUser.getPatientId().equals(requestedPatientId);
    }

    private ReminderType parseType(String rawType) {
        try {
            return ReminderType.valueOf(rawType.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new InvalidReminderTypeException("Unsupported reminder type");
        }
    }

    private ReminderResponse toResponse(Reminder reminder) {
        return new ReminderResponse(
                reminder.getId(),
                reminder.getUser().getPatientId(),
                reminder.getType().name().toLowerCase(),
                reminder.getTitle(),
                reminder.getScheduledAt(),
                reminder.isCompleted(),
                reminder.getCreatedAt(),
                reminder.getCompletedAt());
    }
}
