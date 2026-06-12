package com.app.backend.dto;

public class PostMediaResponse {
    private Long id;
    private String mediaType;
    private String mediaUrl;
    private String mediaName;
    private Long mediaSize;
    private Integer mediaOrder;

    public PostMediaResponse(Long id, String mediaType, String mediaUrl, Integer mediaOrder) {
        this.id = id;
        this.mediaType = mediaType;
        this.mediaUrl = mediaUrl;
        this.mediaOrder = mediaOrder;
    }

    public PostMediaResponse(Long id, String mediaType, String mediaUrl, String mediaName, Long mediaSize, Integer mediaOrder) {
        this.id = id;
        this.mediaType = mediaType;
        this.mediaUrl = mediaUrl;
        this.mediaName = mediaName;
        this.mediaSize = mediaSize;
        this.mediaOrder = mediaOrder;
    }

    public Long getId() { return id; }
    public String getMediaType() { return mediaType; }
    public String getMediaUrl() { return mediaUrl; }
    public String getMediaName() { return mediaName; }
    public Long getMediaSize() { return mediaSize; }
    public Integer getMediaOrder() { return mediaOrder; }
}
