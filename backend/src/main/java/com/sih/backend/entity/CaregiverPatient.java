package com.sih.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

/**
 * Persistent link granting a CAREGIVER access to a PATIENT's data. A caregiver may be
 * linked to many patients and a patient may be linked to many caregivers; the unique
 * constraint below prevents the same pair being linked twice at the database level.
 * There is no public API in this issue for creating these links (see Issue #29) — they
 * are created directly via {@link com.sih.backend.repository.CaregiverPatientRepository}.
 */
@Entity
@Table(
        name = "caregiver_patients",
        uniqueConstraints = @UniqueConstraint(columnNames = {"caregiver_id", "patient_id"}))
public class CaregiverPatient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "caregiver_id", nullable = false)
    private User caregiver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private User patient;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected CaregiverPatient() {
    }

    public CaregiverPatient(User caregiver, User patient, LocalDateTime createdAt) {
        this.caregiver = caregiver;
        this.patient = patient;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public User getCaregiver() {
        return caregiver;
    }

    public User getPatient() {
        return patient;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
