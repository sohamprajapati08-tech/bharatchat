package com.bharatchat.service;

import com.bharatchat.model.UserStatus;
import com.bharatchat.repository.UserStatusRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StatusService {

    private final UserStatusRepository statusRepository;

    public UserStatus postStatus(UUID userId, String type, String content, String bgColor) {
        return postStatus(userId, type, content, bgColor, null);
    }

    public UserStatus postStatus(UUID userId, String type, String content, String bgColor, String caption) {
        UserStatus status = UserStatus.builder()
                .userId(userId)
                .type(type != null ? type : "text")
                .content(content)
                .caption(caption)
                .backgroundColor(bgColor != null ? bgColor : "#008069")
                .viewers("[]")
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
        return statusRepository.save(status);
    }

    public List<UserStatus> getActiveStatuses() {
        return statusRepository.findActiveStatuses(Instant.now());
    }

    public List<UserStatus> getUserStatuses(UUID userId) {
        return statusRepository.findByUserIdAndExpiresAtAfter(userId, Instant.now());
    }
}
