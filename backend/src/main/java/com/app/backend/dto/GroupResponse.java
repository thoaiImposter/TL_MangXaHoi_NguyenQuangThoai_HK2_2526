package com.app.backend.dto;

import java.time.LocalDateTime;

public record GroupResponse(
    Long id,
    String name,
    String description,
    String avatar,
    String cover,
    String privacy,
    Long creatorId,
    String creatorName,
    String creatorAvatar,
    Boolean approvalRequired,
    Long memberCount,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}