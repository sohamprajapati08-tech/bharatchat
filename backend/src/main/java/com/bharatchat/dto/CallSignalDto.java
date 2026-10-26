package com.bharatchat.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CallSignalDto {
    private String type; // "offer", "answer", "candidate", "reject", "end", "ringing"
    private UUID callerId;
    private UUID receiverId;
    private String callerName;
    private String callerAvatar;
    private String callType; // "voice" or "video"
    private Object sdp;
    private Object candidate;
}
