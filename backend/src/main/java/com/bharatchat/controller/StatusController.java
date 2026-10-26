package com.bharatchat.controller;

import com.bharatchat.model.UserStatus;
import com.bharatchat.security.JwtUtil;
import com.bharatchat.service.StatusService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/statuses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class StatusController {

    private final StatusService statusService;
    private final JwtUtil jwtUtil;

    @GetMapping
    public ResponseEntity<List<UserStatus>> getActiveStatuses() {
        return ResponseEntity.ok(statusService.getActiveStatuses());
    }

    @PostMapping
    public ResponseEntity<UserStatus> postStatus(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> body
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        UserStatus status = statusService.postStatus(
                userId,
                body.get("type"),
                body.get("content"),
                body.get("backgroundColor")
        );
        return ResponseEntity.ok(status);
    }
}
