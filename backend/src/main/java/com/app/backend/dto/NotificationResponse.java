package com.app.backend.dto;

import java.time.LocalDateTime;

public class NotificationResponse {
    private Long id;
    private Long actorId;
    private String actorName;
    private String actorAvatar;
    private String type;
    private String message;
    private String targetType;
    private Long targetId;
    private Boolean isRead;
    private LocalDateTime createdAt;

    public NotificationResponse(Long id, Long actorId, String actorName, String actorAvatar,
                                String type, String message, String targetType, Long targetId,
                                Boolean isRead, LocalDateTime createdAt) {
        this.id = id;
        this.actorId = actorId;
        this.actorName = actorName;
        this.actorAvatar = actorAvatar;
        this.type = type;
        this.message = message;
        this.targetType = targetType;
        this.targetId = targetId;
        this.isRead = isRead;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getActorId() { return actorId; }
    public String getActorName() { return actorName; }
    public String getActorAvatar() { return actorAvatar; }
    public String getType() { return type; }
    public String getMessage() { return message; }
    public String getTargetType() { return targetType; }
    public Long getTargetId() { return targetId; }
    public Boolean getIsRead() { return isRead; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
