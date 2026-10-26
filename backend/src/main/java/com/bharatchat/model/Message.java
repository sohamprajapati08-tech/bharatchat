package com.bharatchat.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(nullable = false)
    private UUID senderId;

    @Column(nullable = false)
    private UUID receiverId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 20)
    @Builder.Default
    private String type = "text"; // text, image, audio, video, document, call_notice

    @Column(columnDefinition = "TEXT")
    private String mediaUrl;

    @Column(length = 20)
    @Builder.Default
    private String status = "sent"; // sent, delivered, read

    @Column(columnDefinition = "TEXT")
    @Builder.Default
    private String reactions = "[]";

    @Builder.Default
    private Boolean isStarred = false;

    @Builder.Default
    private Boolean isDeletedForSender = false;

    @Builder.Default
    private Boolean isDeletedForEveryone = false;

    private UUID replyToId;

    @CreationTimestamp
    private Instant createdAt;
}
