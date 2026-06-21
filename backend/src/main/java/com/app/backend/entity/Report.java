package com.app.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
public class Report {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "reporter_id", nullable = false)
    private User reporter;
    @Column(nullable = false, length = 20) private String targetType;
    @Column(nullable = false) private Long targetId;
    private Long targetOwnerId;
    @Column(length = 500) private String targetTitle;
    @Column(length = 3000) private String targetSnapshot;
    @Column(nullable = false, length = 50) private String reason;
    @Column(length = 1000) private String details;
    @Column(nullable = false, length = 20) private String status = "pending";
    @Column(length = 30) private String resolution;
    @Column(length = 1000) private String adminNote;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "handled_by_id")
    private User handledBy;
    @Column(nullable = false) private LocalDateTime createdAt;
    private LocalDateTime handledAt;

    @PrePersist protected void onCreate() { createdAt = LocalDateTime.now(); }
    public Long getId() { return id; }
    public User getReporter() { return reporter; }
    public void setReporter(User reporter) { this.reporter = reporter; }
    public String getTargetType() { return targetType; }
    public void setTargetType(String targetType) { this.targetType = targetType; }
    public Long getTargetId() { return targetId; }
    public void setTargetId(Long targetId) { this.targetId = targetId; }
    public Long getTargetOwnerId() { return targetOwnerId; }
    public void setTargetOwnerId(Long targetOwnerId) { this.targetOwnerId = targetOwnerId; }
    public String getTargetTitle() { return targetTitle; }
    public void setTargetTitle(String targetTitle) { this.targetTitle = targetTitle; }
    public String getTargetSnapshot() { return targetSnapshot; }
    public void setTargetSnapshot(String targetSnapshot) { this.targetSnapshot = targetSnapshot; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResolution() { return resolution; }
    public void setResolution(String resolution) { this.resolution = resolution; }
    public String getAdminNote() { return adminNote; }
    public void setAdminNote(String adminNote) { this.adminNote = adminNote; }
    public User getHandledBy() { return handledBy; }
    public void setHandledBy(User handledBy) { this.handledBy = handledBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getHandledAt() { return handledAt; }
    public void setHandledAt(LocalDateTime handledAt) { this.handledAt = handledAt; }
}
