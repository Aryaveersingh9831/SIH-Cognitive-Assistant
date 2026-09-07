package com.sih.backend.repository;

import com.sih.backend.entity.Reminder;
import com.sih.backend.entity.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRepository extends JpaRepository<Reminder, Long> {

    List<Reminder> findByUserOrderByScheduledAtAsc(User user);
}
