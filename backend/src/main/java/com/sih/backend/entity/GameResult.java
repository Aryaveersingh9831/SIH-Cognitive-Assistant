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
import java.time.LocalDateTime;

@Entity
@Table(name = "game_results")
public class GameResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String gameType;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false)
    private Double accuracy;

    @Column(name = "reaction_time", nullable = false)
    private Integer reactionTime;

    @Column(nullable = false)
    private Integer mistakes;

    @Column(nullable = false)
    private Integer difficulty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    protected GameResult() {
    }

    public GameResult(
            String gameType,
            Integer score,
            Double accuracy,
            Integer reactionTime,
            Integer mistakes,
            Integer difficulty,
            User user,
            LocalDateTime createdAt) {
        this.gameType = gameType;
        this.score = score;
        this.accuracy = accuracy;
        this.reactionTime = reactionTime;
        this.mistakes = mistakes;
        this.difficulty = difficulty;
        this.user = user;
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getGameType() {
        return gameType;
    }

    public Integer getScore() {
        return score;
    }

    public Double getAccuracy() {
        return accuracy;
    }

    public Integer getReactionTime() {
        return reactionTime;
    }

    public Integer getMistakes() {
        return mistakes;
    }

    public Integer getDifficulty() {
        return difficulty;
    }

    public User getUser() {
        return user;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
}
