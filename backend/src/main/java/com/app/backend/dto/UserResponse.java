package com.app.backend.dto;

import java.time.LocalDateTime;

public class UserResponse {
    private Long id;
    private String email;
    private String fullName;
    private String role;
    private String avatar;
    private String cover;
    private String bio;
    private String faculty;
    private String className;
    private String academicYear;
    private String academicTitle;
    private LocalDateTime createdAt;
    private Long friendCount;
    private Boolean accountProtection;

    public UserResponse(Long id, String email, String fullName, String avatar, String cover, String bio, LocalDateTime createdAt) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = "student";
        this.avatar = avatar;
        this.cover = cover;
        this.bio = bio;
        this.createdAt = createdAt;
    }

    public UserResponse(Long id, String email, String fullName, String avatar, String cover, String bio, LocalDateTime createdAt, Long friendCount) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = "student";
        this.avatar = avatar;
        this.cover = cover;
        this.bio = bio;
        this.createdAt = createdAt;
        this.friendCount = friendCount;
    }

    public UserResponse(Long id, String email, String fullName, String role, String avatar, String cover, String bio, String faculty, String className, String academicYear, String academicTitle, LocalDateTime createdAt, Long friendCount, Boolean accountProtection) {
        this.id = id;
        this.email = email;
        this.fullName = fullName;
        this.role = role;
        this.avatar = avatar;
        this.cover = cover;
        this.bio = bio;
        this.faculty = faculty;
        this.className = className;
        this.academicYear = academicYear;
        this.academicTitle = academicTitle;
        this.createdAt = createdAt;
        this.friendCount = friendCount;
        this.accountProtection = accountProtection;
    }

    public Long getId() { return id; }
    public String getEmail() { return email; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
    public String getAvatar() { return avatar; }
    public String getCover() { return cover; }
    public String getBio() { return bio; }
    public String getFaculty() { return faculty; }
    public String getClassName() { return className; }
    public String getAcademicYear() { return academicYear; }
    public String getAcademicTitle() { return academicTitle; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public Long getFriendCount() { return friendCount; }
    public Boolean getAccountProtection() { return accountProtection; }
}
