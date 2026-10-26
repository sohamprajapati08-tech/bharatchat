package com.bharatchat.service;

import com.bharatchat.dto.ChatMessageDto;
import com.bharatchat.dto.RecentChatDto;
import com.bharatchat.dto.UserProfileDto;
import com.bharatchat.model.Message;
import com.bharatchat.model.User;
import com.bharatchat.repository.MessageRepository;
import com.bharatchat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public ChatMessageDto sendMessage(UUID senderId, ChatMessageDto dto) {
        Message message = Message.builder()
                .senderId(senderId)
                .receiverId(dto.getReceiverId())
                .content(dto.getContent())
                .type(dto.getType() != null ? dto.getType() : "text")
                .mediaUrl(dto.getMediaUrl())
                .status("sent")
                .reactions("[]")
                .isStarred(false)
                .isDeletedForSender(false)
                .isDeletedForEveryone(false)
                .replyToId(dto.getReplyToId())
                .build();

        Message saved = messageRepository.save(message);
        ChatMessageDto result = ChatMessageDto.fromEntity(saved);

        // Real-time broadcast via WebSocket STOMP
        messagingTemplate.convertAndSend("/topic/messages." + dto.getReceiverId(), result);
        messagingTemplate.convertAndSend("/topic/messages." + senderId, result);

        return result;
    }

    public List<ChatMessageDto> getConversation(UUID user1, UUID user2) {
        return messageRepository.findConversation(user1, user2)
                .stream()
                .map(ChatMessageDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<RecentChatDto> getRecentChats(UUID currentUserId) {
        // Only return users where conversations actually exist!
        List<UUID> partnerIds = messageRepository.findActiveConversationPartnerIds(currentUserId);

        List<RecentChatDto> list = new ArrayList<>();
        for (UUID partnerId : partnerIds) {
            Optional<User> partnerOpt = userRepository.findById(partnerId);
            if (partnerOpt.isEmpty()) continue;
            User partner = partnerOpt.get();

            Optional<Message> latestMsgOpt = messageRepository.findLatestMessageBetween(currentUserId, partnerId);
            if (latestMsgOpt.isEmpty()) continue;
            Message latest = latestMsgOpt.get();

            long unread = messageRepository.countUnreadMessages(partnerId, currentUserId);

            RecentChatDto recent = RecentChatDto.builder()
                    .contact(UserProfileDto.fromEntity(partner))
                    .lastMessage(latest.getContent())
                    .lastMessageType(latest.getType())
                    .lastMessageTime(latest.getCreatedAt())
                    .lastMessageStatus(latest.getStatus())
                    .isLastMessageFromMe(latest.getSenderId().equals(currentUserId))
                    .unreadCount(unread)
                    .isPinned(false)
                    .build();

            list.add(recent);
        }

        // Sort by most recent message at the top
        list.sort((a, b) -> {
            if (a.getLastMessageTime() == null) return 1;
            if (b.getLastMessageTime() == null) return -1;
            return b.getLastMessageTime().compareTo(a.getLastMessageTime());
        });

        return list;
    }

    @Transactional
    public void markMessagesAsRead(UUID senderId, UUID currentUserId) {
        messageRepository.markConversationAsRead(senderId, currentUserId);

        // Notify sender that their messages were read (blue tick update)
        Map<String, Object> readEvent = Map.of(
                "type", "READ_RECEIPT",
                "readerId", currentUserId.toString(),
                "senderId", senderId.toString()
        );
        messagingTemplate.convertAndSend("/topic/receipts." + senderId, readEvent);
    }
}
