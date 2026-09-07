package com.sih.backend.controller;

import com.sih.backend.dto.ReminderRequest;
import com.sih.backend.dto.ReminderResponse;
import com.sih.backend.security.JwtUserPrincipal;
import com.sih.backend.service.ReminderService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reminders")
public class ReminderController {

    private final ReminderService reminderService;

    public ReminderController(ReminderService reminderService) {
        this.reminderService = reminderService;
    }

    @PostMapping
    public ResponseEntity<ReminderResponse> createReminder(
            @Valid @RequestBody ReminderRequest request, Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        ReminderResponse response = reminderService.createReminder(principal.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<ReminderResponse>> getPatientReminders(
            @PathVariable String patientId, Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(reminderService.getRemindersForPatient(principal.userId(), patientId));
    }

    @PatchMapping("/{id}/complete")
    public ResponseEntity<ReminderResponse> completeReminder(
            @PathVariable Long id, Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(reminderService.completeReminder(principal.userId(), id));
    }
}
