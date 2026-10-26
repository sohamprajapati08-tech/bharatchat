package com.bharatchat.dto;

import com.bharatchat.model.User;
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
public class UserProfileDto {
    private UUID id;
    private String phone;
    private String name;
    private String avatar;
    private String about;
    private String status;
    private Instant lastSeen;
    private Instant createdAt;

    public static UserProfileDto fromEntity(User user) {
        if (user == null) return null;
        return UserProfileDto.builder()
                .id(user.getId())
                .phone(user.getPhone())
                .name(user.getName())
                .avatar(user.getAvatar())
                .about(user.getAbout())
                .status(user.getStatus())
                .lastSeen(user.getLastSeen())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
