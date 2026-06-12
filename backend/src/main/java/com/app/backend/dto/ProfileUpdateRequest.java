package com.app.backend.dto;

public class ProfileUpdateRequest {
    private String fullName;
    private String avatar;
    private String cover;
    private String bio;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getCover() { return cover; }
    public void setCover(String cover) { this.cover = cover; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
