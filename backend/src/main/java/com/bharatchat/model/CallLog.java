package com.bharatchat.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "calls")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallLog {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID callerId;

    @Column(nullable = false)
    private UUID receiverId;

    @Column(nullable = false, length = 20)
    private String callType; // voice, video

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "completed"; // missed, completed, rejected, busy

    @Builder.Default
    private Integer duration = 0; // seconds

    @CreationTimestamp
    private Instant createdAt;
}
