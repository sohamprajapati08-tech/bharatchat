package com.bharatchat.controller;

import com.bharatchat.dto.UserProfileDto;
import com.bharatchat.security.JwtUtil;
import com.bharatchat.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class UserController {

    private final UserService userService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<UserProfileDto>> getAllUsers(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "query", required = false) String query
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID currentUserId = jwtUtil.extractUserId(token);
        List<UserProfileDto> users = userService.searchUsers(query, currentUserId);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserProfileDto> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(userService.getProfile(id));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserProfileDto> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        UserProfileDto updated = userService.updateProfile(
                userId,
                body.get("name"),
                body.get("about"),
                body.get("avatar")
        );
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/status")
    public ResponseEntity<Void> updateStatus(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        userService.updateOnlineStatus(userId, body.getOrDefault("status", "online"));
        return ResponseEntity.ok().build();
    }
}
