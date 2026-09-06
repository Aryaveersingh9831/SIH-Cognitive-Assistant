package com.sih.backend.controller;

import com.sih.backend.dto.ProgressResponse;
import com.sih.backend.security.JwtUserPrincipal;
import com.sih.backend.service.ProgressService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<ProgressResponse> getPatientProgress(
            @PathVariable String patientId, Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(progressService.getProgressForPatient(principal.userId(), patientId));
    }
}
