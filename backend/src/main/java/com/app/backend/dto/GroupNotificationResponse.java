package com.app.backend.dto;

import java.time.LocalDateTime;

public record GroupNotificationResponse(
    Long id,
    Long groupId,
    String groupName,
    Long userId,
    String type,
    String message,
    String targetType,
    Long targetId,
    Boolean isRead,
    LocalDateTime createdAt
) {}