package com.bharatchat.service;

import com.bharatchat.dto.AuthRequest;
import com.bharatchat.dto.AuthResponse;
import com.bharatchat.dto.RegisterRequest;
import com.bharatchat.dto.UserProfileDto;
import com.bharatchat.model.User;
import com.bharatchat.model.UserSettings;
import com.bharatchat.repository.UserRepository;
import com.bharatchat.repository.UserSettingsRepository;
import com.bharatchat.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserSettingsRepository userSettingsRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        String cleanPhone = normalizePhone(req.getPhone());
        if (userRepository.existsByPhone(cleanPhone)) {
            throw new IllegalArgumentException("Phone number already registered with BharatChat");
        }

        User user = User.builder()
                .phone(cleanPhone)
                .name(req.getName().trim())
                .passwordHash(passwordEncoder.encode(req.getPassword()))
                .avatar(req.getAvatar() != null ? req.getAvatar() : "")
                .about(req.getAbout() != null ? req.getAbout() : "At BharatChat 🇮🇳 India Ka Apna Messenger")
                .status("online")
                .lastSeen(Instant.now())
                .build();

        User savedUser = userRepository.save(user);

        // Initialize default user settings
        UserSettings defaultSettings = UserSettings.builder()
                .userId(savedUser.getId())
                .theme("dark")
                .wallpaper("default")
                .lastSeenPrivacy("everyone")
                .profilePhotoPrivacy("everyone")
                .aboutPrivacy("everyone")
                .readReceipts(true)
                .notificationsEnabled(true)
                .appLanguage("en")
                .build();
        userSettingsRepository.save(defaultSettings);

        String token = jwtUtil.generateToken(savedUser.getId(), savedUser.getPhone());
        return new AuthResponse(token, UserProfileDto.fromEntity(savedUser));
    }

    public AuthResponse login(AuthRequest req) {
        String cleanPhone = normalizePhone(req.getPhone());
        User user = userRepository.findByPhone(cleanPhone)
                .orElseThrow(() -> new BadCredentialsException("Invalid phone number or password"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Invalid phone number or password");
        }

        user.setStatus("online");
        user.setLastSeen(Instant.now());
        userRepository.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getPhone());
        return new AuthResponse(token, UserProfileDto.fromEntity(user));
    }

    public UserProfileDto getProfile(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        return UserProfileDto.fromEntity(user);
    }

    public List<UserProfileDto> searchUsers(String query, UUID currentUserId) {
        List<User> list;
        if (query == null || query.trim().isEmpty()) {
            list = userRepository.findAllExceptUser(currentUserId);
        } else {
            list = userRepository.searchUsers(query.trim());
        }
        return list.stream()
                .filter(u -> !u.getId().equals(currentUserId))
                .map(UserProfileDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserProfileDto updateProfile(UUID userId, String name, String about, String avatar) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (name != null && !name.trim().isEmpty()) user.setName(name.trim());
        if (about != null) user.setAbout(about.trim());
        if (avatar != null) user.setAvatar(avatar.trim());
        User updated = userRepository.save(user);
        return UserProfileDto.fromEntity(updated);
    }

    @Transactional
    public void updateOnlineStatus(UUID userId, String status) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setStatus(status);
            user.setLastSeen(Instant.now());
            userRepository.save(user);
        });
    }

    private String normalizePhone(String phone) {
        String digits = phone.replaceAll("[^0-9+]", "");
        if (!digits.startsWith("+") && digits.length() == 10) {
            digits = "+91" + digits; // Auto-format 10 digit Indian number to +91
        }
        return digits;
    }
}
