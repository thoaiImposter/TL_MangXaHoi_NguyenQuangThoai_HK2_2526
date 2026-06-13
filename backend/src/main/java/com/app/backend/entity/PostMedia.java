package com.app.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "post_media")
public class PostMedia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(nullable = false, length = 20)
    private String mediaType; // image, video, file

    @Column(nullable = false, length = 2048)
    private String mediaUrl;

    @Column(length = 255)
    private String mediaName;

    private Long mediaSize;

    private Integer mediaOrder;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getMediaUrl() { return mediaUrl; }
    public void setMediaUrl(String mediaUrl) { this.mediaUrl = mediaUrl; }
    public String getMediaName() { return mediaName; }
    public void setMediaName(String mediaName) { this.mediaName = mediaName; }
    public Long getMediaSize() { return mediaSize; }
    public void setMediaSize(Long mediaSize) { this.mediaSize = mediaSize; }
    public Integer getMediaOrder() { return mediaOrder; }
    public void setMediaOrder(Integer mediaOrder) { this.mediaOrder = mediaOrder; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
