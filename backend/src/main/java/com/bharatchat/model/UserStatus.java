package com.bharatchat.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "statuses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(length = 20)
    @Builder.Default
    private String type = "text"; // text, image

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 30)
    @Builder.Default
    private String backgroundColor = "#008069";

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String viewers = "[]";

    @CreationTimestamp
    private Instant createdAt;

    @Builder.Default
    private Instant expiresAt = Instant.now().plus(24, ChronoUnit.HOURS);
}
