package com.bharatchat.repository;

import com.bharatchat.model.CallLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CallLogRepository extends JpaRepository<CallLog, UUID> {
    @Query("SELECT c FROM CallLog c WHERE c.callerId = :userId OR c.receiverId = :userId ORDER BY c.createdAt DESC")
    List<CallLog> findUserCalls(@Param("userId") UUID userId);
}
