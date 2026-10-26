package com.bharatchat.controller;

import com.bharatchat.dto.CallSignalDto;
import com.bharatchat.dto.ChatMessageDto;
import com.bharatchat.service.CallService;
import com.bharatchat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class WebSocketChatController {

    private final ChatService chatService;
    private final CallService callService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void handleChatMessage(@Payload ChatMessageDto message) {
        if (message.getSenderId() != null && message.getReceiverId() != null) {
            chatService.sendMessage(message.getSenderId(), message);
        }
    }

    @MessageMapping("/call.signal")
    public void handleCallSignal(@Payload CallSignalDto signal) {
        callService.processCallSignal(signal);
    }

    @MessageMapping("/chat.typing")
    public void handleTypingIndicator(@Payload Map<String, Object> typingEvent) {
        Object receiverId = typingEvent.get("receiverId");
        if (receiverId != null) {
            messagingTemplate.convertAndSend("/topic/typing." + receiverId.toString(), typingEvent);
        }
    }
}
