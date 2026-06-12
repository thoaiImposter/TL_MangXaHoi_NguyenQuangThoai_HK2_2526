package com.app.backend.dto;

/**
 * Request DTO for sharing a post
 */
public class ShareRequest {
    private Long postId;
    private String shareContent;
    private String shareVisibility;
    private Long targetGroupId; // null if sharing to own timeline

    public ShareRequest() {}

    public ShareRequest(Long postId, String shareContent, String shareVisibility, Long targetGroupId) {
        this.postId = postId;
        this.shareContent = shareContent;
        this.shareVisibility = shareVisibility;
        this.targetGroupId = targetGroupId;
    }

    public Long getPostId() { return postId; }
    public void setPostId(Long postId) { this.postId = postId; }

    public String getShareContent() { return shareContent; }
    public void setShareContent(String shareContent) { this.shareContent = shareContent; }

    public String getShareVisibility() { return shareVisibility; }
    public void setShareVisibility(String shareVisibility) { this.shareVisibility = shareVisibility; }

    public Long getTargetGroupId() { return targetGroupId; }
    public void setTargetGroupId(Long targetGroupId) { this.targetGroupId = targetGroupId; }
}