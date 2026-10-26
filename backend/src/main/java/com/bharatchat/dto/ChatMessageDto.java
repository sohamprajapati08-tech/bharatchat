package com.bharatchat.dto;

import com.bharatchat.model.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private UUID id;
    private UUID senderId;
    private UUID receiverId;
    private String content;
    private String type; // text, image, audio, video, document, call_notice
    private String mediaUrl;
    private String status; // sent, delivered, read
    private String reactions;
    private Boolean isStarred;
    private UUID replyToId;
    private Instant createdAt;

    public static ChatMessageDto fromEntity(Message message) {
        if (message == null) return null;
        return ChatMessageDto.builder()
                .id(message.getId())
                .senderId(message.getSenderId())
                .receiverId(message.getReceiverId())
                .content(message.getContent())
                .type(message.getType())
                .mediaUrl(message.getMediaUrl())
                .status(message.getStatus())
                .reactions(message.getReactions())
                .isStarred(message.getIsStarred())
                .replyToId(message.getReplyToId())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
