package com.app.backend.controller;

import com.app.backend.dto.FriendshipResponse;
import com.app.backend.service.FriendshipService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class FriendshipController {

    private final FriendshipService friendshipService;

    public FriendshipController(FriendshipService friendshipService) {
        this.friendshipService = friendshipService;
    }

    // Friend request endpoints (RESTful: /users/{userId}/friend-requests)
    @PostMapping("/users/{userId}/friend-requests")
    public ResponseEntity<?> sendFriendRequest(@PathVariable Long userId, @RequestParam Long targetId) {
        try {
            return ResponseEntity.ok(friendshipService.sendRequest(userId, targetId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/users/{userId}/friend-requests/pending")
    public List<FriendshipResponse> getPendingFriendRequests(@PathVariable Long userId) {
        return friendshipService.getPendingRequests(userId);
    }

    @PutMapping("/friend-requests/{friendshipId}/accept")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long friendshipId, @RequestParam Long userId) {
        try {
            FriendshipResponse response = friendshipService.acceptRequestByFriendshipId(friendshipId, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/friend-requests/{friendshipId}")
    public ResponseEntity<?> rejectOrCancelFriendRequest(@PathVariable Long friendshipId, @RequestParam Long userId) {
        try {
            friendshipService.rejectOrCancelRequestByFriendshipId(friendshipId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Friendship endpoints (RESTful: /users/{userId}/friends)
    @GetMapping("/users/{userId}/friends")
    public List<FriendshipResponse> getFriends(@PathVariable Long userId) {
        return friendshipService.getFriends(userId);
    }

    @DeleteMapping("/friendships/{friendshipId}")
    public ResponseEntity<?> unfriend(@PathVariable Long friendshipId, @RequestParam Long userId) {
        try {
            friendshipService.unfriendByFriendshipId(friendshipId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Friendship status endpoint (RESTful: /users/{userId}/friendship-status/{targetId})
    @GetMapping("/users/{userId}/friendship-status/{targetId}")
    public ResponseEntity<Map<String, Object>> getFriendshipStatus(@PathVariable Long userId, @PathVariable Long targetId) {
        String status = friendshipService.getFriendshipStatus(userId, targetId);
        FriendshipResponse friendship = friendshipService.getFriendshipBetween(userId, targetId);
        Map<String, Object> response = new HashMap<>();
        response.put("status", status);
        response.put("friendshipId", friendship == null ? null : friendship.getId());
        return ResponseEntity.ok(response);
    }
}
