package com.sih.backend.controller;

import com.sih.backend.dto.GameResultRequest;
import com.sih.backend.dto.GameResultResponse;
import com.sih.backend.security.JwtUserPrincipal;
import com.sih.backend.service.GameResultService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/game-results")
public class GameResultController {

    private final GameResultService gameResultService;

    public GameResultController(GameResultService gameResultService) {
        this.gameResultService = gameResultService;
    }

    @PostMapping
    public ResponseEntity<GameResultResponse> submitResult(
            @Valid @RequestBody GameResultRequest request, Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        GameResultResponse response = gameResultService.submitResult(principal.userId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<List<GameResultResponse>> getPatientResults(
            @PathVariable String patientId, Authentication authentication) {
        JwtUserPrincipal principal = (JwtUserPrincipal) authentication.getPrincipal();
        return ResponseEntity.ok(gameResultService.getResultsForPatient(principal.userId(), patientId));
    }
}
