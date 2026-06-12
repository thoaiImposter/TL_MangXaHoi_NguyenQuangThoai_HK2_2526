package com.app.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 5000)
    private String content;

    @Column(nullable = false, length = 20)
    private String visibility = "public";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    // Poll fields
    @Column(nullable = false)
    private boolean isPoll = false;

    private LocalDateTime pollEndDate;

    @Column(nullable = false)
    private boolean pollAllowMultiple = false;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PollOption> pollOptions = new ArrayList<>();

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "originalPost", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostShare> shares = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getVisibility() { return visibility; }
    public void setVisibility(String visibility) { this.visibility = visibility; }
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    public boolean isPoll() { return isPoll; }
    public void setPoll(boolean poll) { isPoll = poll; }
    public LocalDateTime getPollEndDate() { return pollEndDate; }
    public void setPollEndDate(LocalDateTime pollEndDate) { this.pollEndDate = pollEndDate; }
    public boolean isPollAllowMultiple() { return pollAllowMultiple; }
    public void setPollAllowMultiple(boolean pollAllowMultiple) { this.pollAllowMultiple = pollAllowMultiple; }
    public List<PollOption> getPollOptions() { return pollOptions; }
    public void setPollOptions(List<PollOption> pollOptions) { this.pollOptions = pollOptions; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<PostShare> getShares() { return shares; }
    public void setShares(List<PostShare> shares) { this.shares = shares; }
}
