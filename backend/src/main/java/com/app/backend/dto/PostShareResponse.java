package com.app.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for post share information
 */
public class PostShareResponse {
    private Long id;
    private Long originalPostId;
    private String originalPostTitle;
    private String originalPostContent;
    private String originalPostVisibility;
    private Long originalAuthorId;
    private String originalAuthorName;
    private String originalAuthorAvatar;
    private Long sharedPostId; // ID of the new post created for this share
    private String shareContent;
    private String shareVisibility;
    private Long sharedByUserId;
    private String sharedByUserName;
    private String sharedByUserAvatar;
    private Long sharedToGroupId;
    private String sharedToGroupName;
    private LocalDateTime createdAt;
    private boolean isOriginalPostAvailable;
    private boolean originalPostPoll;
    private LocalDateTime originalPostPollEndDate;
    private boolean originalPostPollAllowMultiple;
    private List<PostMediaResponse> originalPostMedia = List.of();

    public PostShareResponse() {}

    public PostShareResponse(Long id, Long originalPostId, String originalPostTitle, String originalPostContent, 
                            String originalPostVisibility, Long originalAuthorId, String originalAuthorName, 
                            String originalAuthorAvatar, Long sharedPostId, String shareContent, String shareVisibility,
                            Long sharedByUserId, String sharedByUserName, String sharedByUserAvatar,
                            Long sharedToGroupId, String sharedToGroupName, LocalDateTime createdAt, 
                            boolean isOriginalPostAvailable) {
        this.id = id;
        this.originalPostId = originalPostId;
        this.originalPostTitle = originalPostTitle;
        this.originalPostContent = originalPostContent;
        this.originalPostVisibility = originalPostVisibility;
        this.originalAuthorId = originalAuthorId;
        this.originalAuthorName = originalAuthorName;
        this.originalAuthorAvatar = originalAuthorAvatar;
        this.sharedPostId = sharedPostId;
        this.shareContent = shareContent;
        this.shareVisibility = shareVisibility;
        this.sharedByUserId = sharedByUserId;
        this.sharedByUserName = sharedByUserName;
        this.sharedByUserAvatar = sharedByUserAvatar;
        this.sharedToGroupId = sharedToGroupId;
        this.sharedToGroupName = sharedToGroupName;
        this.createdAt = createdAt;
        this.isOriginalPostAvailable = isOriginalPostAvailable;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getOriginalPostId() { return originalPostId; }
    public void setOriginalPostId(Long originalPostId) { this.originalPostId = originalPostId; }

    public String getOriginalPostTitle() { return originalPostTitle; }
    public void setOriginalPostTitle(String originalPostTitle) { this.originalPostTitle = originalPostTitle; }

    public String getOriginalPostContent() { return originalPostContent; }
    public void setOriginalPostContent(String originalPostContent) { this.originalPostContent = originalPostContent; }

    public String getOriginalPostVisibility() { return originalPostVisibility; }
    public void setOriginalPostVisibility(String originalPostVisibility) { this.originalPostVisibility = originalPostVisibility; }

    public Long getOriginalAuthorId() { return originalAuthorId; }
    public void setOriginalAuthorId(Long originalAuthorId) { this.originalAuthorId = originalAuthorId; }

    public String getOriginalAuthorName() { return originalAuthorName; }
    public void setOriginalAuthorName(String originalAuthorName) { this.originalAuthorName = originalAuthorName; }

    public String getOriginalAuthorAvatar() { return originalAuthorAvatar; }
    public void setOriginalAuthorAvatar(String originalAuthorAvatar) { this.originalAuthorAvatar = originalAuthorAvatar; }

    public Long getSharedPostId() { return sharedPostId; }
    public void setSharedPostId(Long sharedPostId) { this.sharedPostId = sharedPostId; }

    public String getShareContent() { return shareContent; }
    public void setShareContent(String shareContent) { this.shareContent = shareContent; }

    public String getShareVisibility() { return shareVisibility; }
    public void setShareVisibility(String shareVisibility) { this.shareVisibility = shareVisibility; }

    public Long getSharedByUserId() { return sharedByUserId; }
    public void setSharedByUserId(Long sharedByUserId) { this.sharedByUserId = sharedByUserId; }

    public String getSharedByUserName() { return sharedByUserName; }
    public void setSharedByUserName(String sharedByUserName) { this.sharedByUserName = sharedByUserName; }

    public String getSharedByUserAvatar() { return sharedByUserAvatar; }
    public void setSharedByUserAvatar(String sharedByUserAvatar) { this.sharedByUserAvatar = sharedByUserAvatar; }

    public Long getSharedToGroupId() { return sharedToGroupId; }
    public void setSharedToGroupId(Long sharedToGroupId) { this.sharedToGroupId = sharedToGroupId; }

    public String getSharedToGroupName() { return sharedToGroupName; }
    public void setSharedToGroupName(String sharedToGroupName) { this.sharedToGroupName = sharedToGroupName; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @JsonProperty("isOriginalPostAvailable")
    public boolean isOriginalPostAvailable() { return isOriginalPostAvailable; }
    public void setOriginalPostAvailable(boolean isOriginalPostAvailable) { this.isOriginalPostAvailable = isOriginalPostAvailable; }
    public boolean isOriginalPostPoll() { return originalPostPoll; }
    public void setOriginalPostPoll(boolean originalPostPoll) { this.originalPostPoll = originalPostPoll; }
    public LocalDateTime getOriginalPostPollEndDate() { return originalPostPollEndDate; }
    public void setOriginalPostPollEndDate(LocalDateTime originalPostPollEndDate) { this.originalPostPollEndDate = originalPostPollEndDate; }
    public boolean isOriginalPostPollAllowMultiple() { return originalPostPollAllowMultiple; }
    public void setOriginalPostPollAllowMultiple(boolean originalPostPollAllowMultiple) { this.originalPostPollAllowMultiple = originalPostPollAllowMultiple; }
    public List<PostMediaResponse> getOriginalPostMedia() { return originalPostMedia; }
    public void setOriginalPostMedia(List<PostMediaResponse> originalPostMedia) {
        this.originalPostMedia = originalPostMedia == null ? List.of() : originalPostMedia;
    }
}
