package com.app.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public class PostCommentResponse {
    private Long id;
    private Long postId;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private String content;
    private LocalDateTime createdAt;
    private Long parentCommentId;
    private List<CommentMediaResponse> media;
    private long likeCount;
    private boolean likedByMe;

    public PostCommentResponse(Long id, Long postId, Long authorId, String authorName, String authorAvatar, String content, LocalDateTime createdAt, Long parentCommentId, List<CommentMediaResponse> media, long likeCount, boolean likedByMe) {
        this.id = id;
        this.postId = postId;
        this.authorId = authorId;
        this.authorName = authorName;
        this.authorAvatar = authorAvatar;
        this.content = content;
        this.createdAt = createdAt;
        this.parentCommentId = parentCommentId;
        this.media = media;
        this.likeCount = likeCount;
        this.likedByMe = likedByMe;
    }

    public Long getId() { return id; }
    public Long getPostId() { return postId; }
    public Long getAuthorId() { return authorId; }
    public String getAuthorName() { return authorName; }
    public String getAuthorAvatar() { return authorAvatar; }
    public String getContent() { return content; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getParentCommentId() { return parentCommentId; }
    public List<CommentMediaResponse> getMedia() { return media; }
    public long getLikeCount() { return likeCount; }
    public boolean isLikedByMe() { return likedByMe; }
}
