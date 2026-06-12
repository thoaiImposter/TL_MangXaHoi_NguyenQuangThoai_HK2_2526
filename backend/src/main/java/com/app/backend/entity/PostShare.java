package com.app.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity representing a post share action.
 * Users can share posts to their own timeline or to groups they belong to.
 */
@Entity
@Table(name = "post_shares")
public class PostShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post originalPost;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_by_id", nullable = false)
    private User sharedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_to_group_id")
    private Group sharedToGroup;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shared_post_id")
    private Post sharedPost;

    @Column(nullable = false, length = 5000)
    private String shareContent;

    @Column(nullable = false, length = 20)
    private String shareVisibility = "public";

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Post getOriginalPost() { return originalPost; }
    public void setOriginalPost(Post originalPost) { this.originalPost = originalPost; }

    public User getSharedBy() { return sharedBy; }
    public void setSharedBy(User sharedBy) { this.sharedBy = sharedBy; }

    public Group getSharedToGroup() { return sharedToGroup; }
    public void setSharedToGroup(Group sharedToGroup) { this.sharedToGroup = sharedToGroup; }

    public Post getSharedPost() { return sharedPost; }
    public void setSharedPost(Post sharedPost) { this.sharedPost = sharedPost; }

    public String getShareContent() { return shareContent; }
    public void setShareContent(String shareContent) { this.shareContent = shareContent; }

    public String getShareVisibility() { return shareVisibility; }
    public void setShareVisibility(String shareVisibility) { this.shareVisibility = shareVisibility; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}