package com.sih.backend.repository;

import com.sih.backend.entity.GameResult;
import com.sih.backend.entity.User;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {

    List<GameResult> findByUserOrderByCreatedAtDesc(User user);

    Optional<GameResult> findTopByUserOrderByCreatedAtDesc(User user);
}
