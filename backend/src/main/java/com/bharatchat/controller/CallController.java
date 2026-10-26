package com.bharatchat.controller;

import com.bharatchat.dto.CallSignalDto;
import com.bharatchat.model.CallLog;
import com.bharatchat.security.JwtUtil;
import com.bharatchat.service.CallService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/calls")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CallController {

    private final CallService callService;
    private final JwtUtil jwtUtil;

    @GetMapping("/history")
    public ResponseEntity<List<CallLog>> getCallHistory(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        UUID userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(callService.getUserCalls(userId));
    }

    @PostMapping("/log")
    public ResponseEntity<CallLog> logCall(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, Object> body
    ) {
        String token = authHeader.replace("Bearer ", "");
        UUID callerId = jwtUtil.extractUserId(token);
        UUID receiverId = UUID.fromString(body.get("receiverId").toString());
        String callType = body.getOrDefault("callType", "voice").toString();
        String status = body.getOrDefault("status", "completed").toString();
        int duration = Integer.parseInt(body.getOrDefault("duration", "0").toString());

        CallLog logged = callService.logCall(callerId, receiverId, callType, status, duration);
        return ResponseEntity.ok(logged);
    }

    @PostMapping("/signal")
    public ResponseEntity<Void> sendSignal(@RequestBody CallSignalDto signal) {
        callService.processCallSignal(signal);
        return ResponseEntity.ok().build();
    }
}
