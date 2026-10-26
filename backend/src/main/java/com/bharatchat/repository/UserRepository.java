package com.bharatchat.repository;

import com.bharatchat.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByPhone(String phone);
    boolean existsByPhone(String phone);

    @Query("SELECT u FROM User u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR u.phone LIKE CONCAT('%', :query, '%')")
    List<User> searchUsers(@Param("query") String query);

    @Query("SELECT u FROM User u WHERE u.id != :currentUserId ORDER BY u.name ASC")
    List<User> findAllExceptUser(@Param("currentUserId") UUID currentUserId);
}
