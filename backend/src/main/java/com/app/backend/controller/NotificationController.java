package com.app.backend.controller;

import com.app.backend.dto.NotificationResponse;
import com.app.backend.service.NotificationService;
import com.app.backend.service.AuthenticatedUserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthenticatedUserService authenticatedUserService;

    public NotificationController(NotificationService notificationService, AuthenticatedUserService authenticatedUserService) {
        this.notificationService = notificationService;
        this.authenticatedUserService = authenticatedUserService;
    }

    // Notification endpoints (RESTful: /users/{userId}/notifications)
    @GetMapping("/users/{userId}/notifications")
    public List<NotificationResponse> getNotifications(@PathVariable Long userId) {
        return notificationService.getNotifications(userId);
    }

    @GetMapping("/users/{userId}/notifications/unread-count")
    public Map<String, Long> getUnreadCount(@PathVariable Long userId) {
        return Map.of("count", notificationService.getUnreadCount(userId));
    }

    @PutMapping("/notifications/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.ok().build();
    }

    @PutMapping("/users/{userId}/notifications/read-all")
    public ResponseEntity<?> markAllAsRead(@PathVariable Long userId) {
        notificationService.markAllAsRead(authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }
}
