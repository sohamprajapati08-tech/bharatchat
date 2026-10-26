package com.bharatchat.controller;

import com.bharatchat.dto.ChatMessageDto;
import com.bharatchat.dto.RecentChatDto;
import com.bharatchat.security.JwtUtil;
import com.bharatchat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/chats")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ChatController {

    private final ChatService chatService;
    private final JwtUtil jwtUtil;

    @GetMapping("/recent")
    public ResponseEntity<List<RecentChatDto>> getRecentChats(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(chatService.getRecentChats(userId));
    }

    @GetMapping("/{contactId}/messages")
    public ResponseEntity<List<ChatMessageDto>> getConversation(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID contactId
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(chatService.getConversation(userId, contactId));
    }

    @PostMapping("/send")
    public ResponseEntity<ChatMessageDto> sendMessage(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody ChatMessageDto dto
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        ChatMessageDto saved = chatService.sendMessage(userId, dto);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/read/{senderId}")
    public ResponseEntity<Void> markAsRead(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable UUID senderId
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        chatService.markMessagesAsRead(senderId, userId);
        return ResponseEntity.ok().build();
    }
}
