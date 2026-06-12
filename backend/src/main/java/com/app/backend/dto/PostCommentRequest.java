package com.app.backend.dto;

public class PostCommentRequest {
    private String content;
    private Long parentCommentId;
    private java.util.List<String> media;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public Long getParentCommentId() { return parentCommentId; }
    public void setParentCommentId(Long parentCommentId) { this.parentCommentId = parentCommentId; }
    public java.util.List<String> getMedia() { return media; }
    public void setMedia(java.util.List<String> media) { this.media = media; }
}
