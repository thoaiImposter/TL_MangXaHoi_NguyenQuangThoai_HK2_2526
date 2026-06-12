package com.app.backend.dto;

import java.time.LocalDateTime;

public class FriendshipResponse {
    private Long id;
    private Long requesterId;
    private String requesterName;
    private String requesterAvatar;
    private Long addresseeId;
    private String addresseeName;
    private String addresseeAvatar;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public FriendshipResponse(Long id, Long requesterId, String requesterName, String requesterAvatar,
                              Long addresseeId, String addresseeName, String addresseeAvatar,
                              String status, LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.requesterId = requesterId;
        this.requesterName = requesterName;
        this.requesterAvatar = requesterAvatar;
        this.addresseeId = addresseeId;
        this.addresseeName = addresseeName;
        this.addresseeAvatar = addresseeAvatar;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public Long getId() { return id; }
    public Long getRequesterId() { return requesterId; }
    public String getRequesterName() { return requesterName; }
    public String getRequesterAvatar() { return requesterAvatar; }
    public Long getAddresseeId() { return addresseeId; }
    public String getAddresseeName() { return addresseeName; }
    public String getAddresseeAvatar() { return addresseeAvatar; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
