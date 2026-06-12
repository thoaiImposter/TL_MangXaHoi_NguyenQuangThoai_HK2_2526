package com.app.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class MessageResponse {
    private Long id;
    private Long senderId;
    private String senderName;
    private String senderAvatar;
    private Long receiverId;
    private String receiverName;
    private String receiverAvatar;
    private Long groupId;
    private String groupName;
    private String groupAvatar;
    private String content;
    private String mediaUrl;
    private Boolean isRead;
    private Boolean isRecalled;
    private String mentionedUserIds;
    private Boolean isAllMentioned;
    private LocalDateTime createdAt;

    public MessageResponse(Long id, Long senderId, String senderName, String senderAvatar,
                           Long receiverId, String receiverName, String receiverAvatar,
                           Long groupId, String groupName, String groupAvatar,
                           String content, String mediaUrl, Boolean isRead, Boolean isRecalled,
                           String mentionedUserIds, Boolean isAllMentioned, LocalDateTime createdAt) {
        this.id = id;
        this.senderId = senderId;
        this.senderName = senderName;
        this.senderAvatar = senderAvatar;
        this.receiverId = receiverId;
        this.receiverName = receiverName;
        this.receiverAvatar = receiverAvatar;
        this.groupId = groupId;
        this.groupName = groupName;
        this.groupAvatar = groupAvatar;
        this.content = content;
        this.mediaUrl = mediaUrl;
        this.isRead = isRead;
        this.isRecalled = isRecalled;
        this.mentionedUserIds = mentionedUserIds;
        this.isAllMentioned = isAllMentioned;
        this.createdAt = createdAt;
    }

    public Long getId() { return id; }
    public Long getSenderId() { return senderId; }
    public String getSenderName() { return senderName; }
    public String getSenderAvatar() { return senderAvatar; }
    public Long getReceiverId() { return receiverId; }
    public String getReceiverName() { return receiverName; }
    public String getReceiverAvatar() { return receiverAvatar; }
    public Long getGroupId() { return groupId; }
    public String getGroupName() { return groupName; }
    public String getGroupAvatar() { return groupAvatar; }
    public String getContent() { return content; }
    public String getMediaUrl() { return mediaUrl; }
    public Boolean getIsRead() { return isRead; }
    public Boolean getIsRecalled() { return isRecalled; }
    public String getMentionedUserIds() { return mentionedUserIds; }
    public Boolean getIsAllMentioned() { return isAllMentioned; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
