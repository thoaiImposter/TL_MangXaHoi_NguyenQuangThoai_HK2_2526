package com.app.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PostFeedResponse {
    private Long id;
    private String title;
    private String content;
    private String visibility;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private long likeCount;
    private long commentCount;
    private long shareCount;
    private boolean likedByMe;
    private boolean hasSharedByMe;
    private List<PostCommentResponse> comments;
    private List<PostMediaResponse> media;
    private boolean isPoll;
    private LocalDateTime pollEndDate;
    private boolean pollAllowMultiple;

    public PostFeedResponse(Long id, String title, String content, String visibility, Long authorId, String authorName, String authorAvatar, LocalDateTime createdAt, LocalDateTime updatedAt, long likeCount, long commentCount, long shareCount, boolean likedByMe, boolean hasSharedByMe, List<PostCommentResponse> comments, List<PostMediaResponse> media, boolean isPoll, LocalDateTime pollEndDate, boolean pollAllowMultiple) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.visibility = visibility;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorAvatar = authorAvatar;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.likeCount = likeCount;
        this.commentCount = commentCount;
        this.shareCount = shareCount;
        this.likedByMe = likedByMe;
        this.hasSharedByMe = hasSharedByMe;
        this.comments = comments;
        this.media = media;
        this.isPoll = isPoll;
        this.pollEndDate = pollEndDate;
        this.pollAllowMultiple = pollAllowMultiple;
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getContent() { return content; }
    public String getVisibility() { return visibility; }
    public Long getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public String getAuthorAvatar() { return authorAvatar; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public long getLikeCount() { return likeCount; }
    public long getCommentCount() { return commentCount; }
    public long getShareCount() { return shareCount; }
    public boolean isLikedByMe() { return likedByMe; }
    public boolean hasSharedByMe() { return hasSharedByMe; }
    public List<PostCommentResponse> getComments() { return comments; }
    public List<PostMediaResponse> getMedia() { return media; }
    public boolean isPoll() { return isPoll; }
    public LocalDateTime getPollEndDate() { return pollEndDate; }
    public boolean isPollAllowMultiple() { return pollAllowMultiple; }
}
