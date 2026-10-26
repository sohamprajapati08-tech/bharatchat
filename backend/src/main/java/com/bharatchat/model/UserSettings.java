package com.bharatchat.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSettings {

    @Id
    private UUID userId;

    @Column(length = 20)
    @Builder.Default
    private String theme = "dark"; // dark, light, system

    @Column(length = 100)
    @Builder.Default
    private String wallpaper = "default";

    @Column(length = 20)
    @Builder.Default
    private String lastSeenPrivacy = "everyone"; // everyone, contacts, nobody

    @Column(length = 20)
    @Builder.Default
    private String profilePhotoPrivacy = "everyone";

    @Column(length = 20)
    @Builder.Default
    private String aboutPrivacy = "everyone";

    @Builder.Default
    private Boolean readReceipts = true;

    @Builder.Default
    private Boolean notificationsEnabled = true;

    @Column(length = 20)
    @Builder.Default
    private String appLanguage = "en"; // en, hi, gu

    @UpdateTimestamp
    private Instant updatedAt;
}
