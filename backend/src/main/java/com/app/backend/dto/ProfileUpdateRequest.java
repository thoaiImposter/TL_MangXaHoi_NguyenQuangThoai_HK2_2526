package com.app.backend.dto;

public class ProfileUpdateRequest {
    private String fullName;
    private String avatar;
    private String cover;
    private String bio;
    private String faculty;
    private String className;
    private String academicYear;
    private String academicTitle;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getAvatar() { return avatar; }
    public void setAvatar(String avatar) { this.avatar = avatar; }
    public String getCover() { return cover; }
    public void setCover(String cover) { this.cover = cover; }
    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
    public String getFaculty() { return faculty; }
    public void setFaculty(String faculty) { this.faculty = faculty; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getAcademicYear() { return academicYear; }
    public void setAcademicYear(String academicYear) { this.academicYear = academicYear; }
    public String getAcademicTitle() { return academicTitle; }
    public void setAcademicTitle(String academicTitle) { this.academicTitle = academicTitle; }
}
