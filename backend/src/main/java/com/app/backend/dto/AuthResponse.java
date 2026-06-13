package com.app.backend.dto;

public record AuthResponse(UserResponse user, String token) {
}
