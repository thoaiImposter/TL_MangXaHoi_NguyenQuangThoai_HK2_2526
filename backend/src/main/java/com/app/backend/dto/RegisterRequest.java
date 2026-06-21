package com.app.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class RegisterRequest {
    
    private String email;
    private String password;
    private String fullName;
    private String role;
    private String avatar;
    private String cover;
    private String bio;
    private String faculty;
    private String className;
    private String academicYear;
    private String academicTitle;
    private Long facultyId;
    private Long majorId;
    
    @JsonProperty("otp")
    private String otpCode;
    
    public RegisterRequest() {}
    
    public RegisterRequest(String email, String password, String fullName, String role, String avatar, 
                          String bio, String faculty, String className, String academicYear, 
                          String academicTitle, String otpCode) {
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.avatar = avatar;
        this.bio = bio;
        this.faculty = faculty;
        this.className = className;
        this.academicYear = academicYear;
        this.academicTitle = academicTitle;
        this.otpCode = otpCode;
    }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    
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
    public Long getFacultyId() { return facultyId; }
    public void setFacultyId(Long facultyId) { this.facultyId = facultyId; }
    public Long getMajorId() { return majorId; }
    public void setMajorId(Long majorId) { this.majorId = majorId; }
    
    public String getOtpCode() { return otpCode; }
    public void setOtpCode(String otpCode) { this.otpCode = otpCode; }
}
