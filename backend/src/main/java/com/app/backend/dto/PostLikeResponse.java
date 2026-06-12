package com.app.backend.dto;

public class PostLikeResponse {
    private Long postId;
    private long likeCount;
    private boolean likedByMe;

    public PostLikeResponse(Long postId, long likeCount, boolean likedByMe) {
        this.postId = postId;
        this.likeCount = likeCount;
        this.likedByMe = likedByMe;
    }

    public Long getPostId() { return postId; }
    public long getLikeCount() { return likeCount; }
    public boolean isLikedByMe() { return likedByMe; }
}
