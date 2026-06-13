package com.app.backend.service;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class AuthenticatedUserService {
    public Long getCurrentUserId() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        try {
            return Long.valueOf(String.valueOf(principal));
        } catch (Exception ex) {
            throw new IllegalArgumentException("Authentication is required");
        }
    }
}
