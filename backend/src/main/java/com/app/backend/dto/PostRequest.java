package com.app.backend.dto;

public class PostRequest {
    private String content;
    private String visibility;
    private java.util.List<java.util.Map<String, Object>> media;

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public java.util.List<java.util.Map<String, Object>> getMedia() { return media; }
    public void setMedia(java.util.List<java.util.Map<String, Object>> media) { this.media = media; }
}
