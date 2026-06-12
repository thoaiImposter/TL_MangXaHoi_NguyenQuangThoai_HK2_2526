package com.app.backend.dto;

import java.time.LocalDateTime;

public record GroupJoinRequestResponse(
    Long id,
    Long groupId,
    String groupName,
    Long userId,
    String userName,
    String userAvatar,
    String status,
    String message,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}