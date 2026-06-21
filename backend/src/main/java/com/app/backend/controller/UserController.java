package com.app.backend.controller;

import com.app.backend.dto.ProfileUpdateRequest;
import com.app.backend.dto.UserResponse;
import com.app.backend.service.AuthenticatedUserService;
import com.app.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;
    private final AuthenticatedUserService authenticatedUserService;

    public UserController(UserService userService, AuthenticatedUserService authenticatedUserService) {
        this.userService = userService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<UserResponse> getProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserResponse>> searchUsers(@RequestParam(required = false, defaultValue = "") String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }

    @GetMapping("/faculty-unions")
    public ResponseEntity<?> getFacultyUnions(@RequestParam(required = false) Long requesterId) {
        try {
            return ResponseEntity.ok(userService.getFacultyUnionsForSchoolUnion(authenticatedUserService.getCurrentUserId()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<?> updateProfile(@PathVariable Long userId, @RequestBody ProfileUpdateRequest request) {
        try {
            return ResponseEntity.ok(userService.updateProfile(userId, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{userId}/password")
    public ResponseEntity<?> changePassword(@PathVariable Long userId, @RequestBody Map<String, String> payload) {
        try {
            String oldPassword = payload.get("oldPassword");
            String newPassword = payload.get("newPassword");
            userService.changePassword(userId, oldPassword, newPassword);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PatchMapping("/{userId}/protection")
    public ResponseEntity<?> setProtection(@PathVariable Long userId, @RequestBody Map<String, Boolean> payload) {
        try {
            return ResponseEntity.ok(userService.setAccountProtection(userId, payload.get("enabled")));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
