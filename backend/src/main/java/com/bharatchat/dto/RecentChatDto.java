package com.bharatchat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecentChatDto {
    private UserProfileDto contact;
    private String lastMessage;
    private String lastMessageType;
    private Instant lastMessageTime;
    private String lastMessageStatus;
    private boolean isLastMessageFromMe;
    private long unreadCount;
    private boolean isPinned;
}
