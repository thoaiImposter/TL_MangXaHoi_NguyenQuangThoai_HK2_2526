package com.app.backend.dto;

public class CommentMediaResponse {
    private Long id;
    private String mediaType;
    private String mediaUrl;
    private String mediaName;
    private Integer mediaOrder;

    public CommentMediaResponse(Long id, String mediaType, String mediaUrl, String mediaName, Integer mediaOrder) {
        this.id = id;
        this.mediaType = mediaType;
        this.mediaUrl = mediaUrl;
        this.mediaName = mediaName;
        this.mediaOrder = mediaOrder;
    }

    public Long getId() { return id; }
    public String getMediaType() { return mediaType; }
    public String getMediaUrl() { return mediaUrl; }
    public String getMediaName() { return mediaName; }
    public Integer getMediaOrder() { return mediaOrder; }
}
