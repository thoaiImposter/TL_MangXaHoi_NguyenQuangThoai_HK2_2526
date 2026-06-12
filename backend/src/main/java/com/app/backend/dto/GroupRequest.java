package com.app.backend.dto;

public record GroupRequest(
    String name,
    String description,
    String avatar,
    String cover,
    String privacy,
    Boolean approvalRequired
) {}