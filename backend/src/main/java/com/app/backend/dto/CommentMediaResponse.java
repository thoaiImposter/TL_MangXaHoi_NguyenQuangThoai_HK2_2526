package com.app.backend.dto;

public class CommentMediaResponse {
    private Long id;
    private String mediaUrl;
    private Integer mediaOrder;

    public CommentMediaResponse(Long id, String mediaUrl, Integer mediaOrder) {
        this.id = id;
        this.mediaUrl = mediaUrl;
        this.mediaOrder = mediaOrder;
    }

    public Long getId() { return id; }
    public String getMediaUrl() { return mediaUrl; }
    public Integer getMediaOrder() { return mediaOrder; }
}
