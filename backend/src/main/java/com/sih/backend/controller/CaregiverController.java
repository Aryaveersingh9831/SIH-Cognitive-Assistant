package com.sih.backend.controller;

import com.sih.backend.dto.CaregiverPatientResponse;
import com.sih.backend.security.JwtUserPrincipal;
import com.sih.backend.service.CaregiverService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/caregiver")
public class CaregiverController {

    private final CaregiverService caregiverService;

    public CaregiverController(CaregiverService caregiverService) {
        this.caregiverService = caregiverService;
    }

    @GetMapping("/patients")
    public ResponseEntity<List<CaregiverPatientResponse>> getPatients(Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(caregiverService.getPatientsForCaregiver(principal.userId()));
    }
}
