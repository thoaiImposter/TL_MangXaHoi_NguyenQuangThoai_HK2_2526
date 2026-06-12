package com.app.backend.dto;

import java.time.LocalDateTime;

public record GroupMemberResponse(
    Long id,
    Long groupId,
    Long userId,
    String userName,
    String userAvatar,
    String role,
    String status,
    LocalDateTime joinedAt
) {}