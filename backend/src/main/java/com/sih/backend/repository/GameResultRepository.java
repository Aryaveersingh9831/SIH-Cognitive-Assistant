package com.sih.backend.repository;

import com.sih.backend.entity.GameResult;
import com.sih.backend.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GameResultRepository extends JpaRepository<GameResult, Long> {

    List<GameResult> findByUserOrderByCreatedAtDesc(User user);
}
