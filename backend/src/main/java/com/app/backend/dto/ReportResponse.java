package com.app.backend.dto;

import java.time.LocalDateTime;

public record ReportResponse(
    Long id, Long reporterId, String reporterName,
    String targetType, Long targetId, Long targetOwnerId,
    String targetTitle, String targetSnapshot, String targetUrl,
    String reason, String details, String status, String resolution, String adminNote,
    Long handledById, String handledByName, LocalDateTime createdAt, LocalDateTime handledAt
) {}
