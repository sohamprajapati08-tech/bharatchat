package com.bharatchat.service;

import com.bharatchat.dto.CallSignalDto;
import com.bharatchat.model.CallLog;
import com.bharatchat.repository.CallLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CallService {

    private final CallLogRepository callLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void processCallSignal(CallSignalDto signal) {
        // Broadcast WebRTC signal (offer, answer, candidate, reject, end) directly to receiver
        if (signal.getReceiverId() != null) {
            messagingTemplate.convertAndSend("/topic/calls." + signal.getReceiverId(), signal);
        }
    }

    public CallLog logCall(UUID callerId, UUID receiverId, String callType, String status, int duration) {
        CallLog callLog = CallLog.builder()
                .callerId(callerId)
                .receiverId(receiverId)
                .callType(callType)
                .status(status)
                .duration(duration)
                .build();
        return callLogRepository.save(callLog);
    }

    public List<CallLog> getUserCalls(UUID userId) {
        return callLogRepository.findUserCalls(userId);
    }
}
