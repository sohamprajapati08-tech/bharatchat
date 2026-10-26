package com.bharatchat.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 255)
    private String avatar;

    @Column(length = 255)
    @Builder.Default
    private String about = "At BharatChat 🇮🇳 India Ka Apna Messenger";

    @Column(length = 20)
    @Builder.Default
    private String status = "offline"; // online, offline, away

    @Builder.Default
    private Instant lastSeen = Instant.now();

    @Column(nullable = false)
    private String passwordHash;

    @CreationTimestamp
    private Instant createdAt;

    @UpdateTimestamp
    private Instant updatedAt;
}
