package com.app.backend.dto;

public class CommentLikeResponse {
    private Long commentId;
    private long likeCount;
    private boolean likedByMe;

    public CommentLikeResponse(Long commentId, long likeCount, boolean likedByMe) {
        this.commentId = commentId;
        this.likeCount = likeCount;
        this.likedByMe = likedByMe;
    }

    public Long getCommentId() { return commentId; }
    public long getLikeCount() { return likeCount; }
    public boolean isLikedByMe() { return likedByMe; }
}
