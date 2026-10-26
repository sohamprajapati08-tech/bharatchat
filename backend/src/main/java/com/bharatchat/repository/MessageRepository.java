package com.bharatchat.repository;

import com.bharatchat.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MessageRepository extends JpaRepository<Message, UUID> {

    @Query("SELECT m FROM Message m WHERE ((m.senderId = :u1 AND m.receiverId = :u2) OR (m.senderId = :u2 AND m.receiverId = :u1)) AND m.isDeletedForEveryone = false ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query(value = "SELECT DISTINCT CASE WHEN sender_id = :userId THEN receiver_id ELSE sender_id END AS contact_id FROM messages WHERE sender_id = :userId OR receiver_id = :userId", nativeQuery = true)
    List<UUID> findActiveConversationPartnerIds(@Param("userId") UUID userId);

    @Query("SELECT m FROM Message m WHERE ((m.senderId = :u1 AND m.receiverId = :u2) OR (m.senderId = :u2 AND m.receiverId = :u1)) AND m.isDeletedForEveryone = false ORDER BY m.createdAt DESC LIMIT 1")
    Optional<Message> findLatestMessageBetween(@Param("u1") UUID u1, @Param("u2") UUID u2);

    @Query("SELECT COUNT(m) FROM Message m WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.status != 'read'")
    long countUnreadMessages(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);

    @Modifying
    @Transactional
    @Query("UPDATE Message m SET m.status = 'read' WHERE m.senderId = :senderId AND m.receiverId = :receiverId AND m.status != 'read'")
    int markConversationAsRead(@Param("senderId") UUID senderId, @Param("receiverId") UUID receiverId);
}
