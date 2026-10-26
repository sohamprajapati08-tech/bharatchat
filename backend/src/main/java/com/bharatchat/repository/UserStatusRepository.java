package com.bharatchat.repository;

import com.bharatchat.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public interface UserStatusRepository extends JpaRepository<UserStatus, UUID> {
    @Query("SELECT s FROM UserStatus s WHERE s.expiresAt > :now ORDER BY s.createdAt DESC")
    List<UserStatus> findActiveStatuses(@Param("now") Instant now);

    List<UserStatus> findByUserIdAndExpiresAtAfter(UUID userId, Instant now);
}
