package com.app.backend.controller;

import com.app.backend.dto.PostShareResponse;
import com.app.backend.dto.ShareRequest;
import com.app.backend.service.ShareService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class ShareController {
    private final ShareService shareService;

    public ShareController(ShareService shareService) {
        this.shareService = shareService;
    }

    /**
     * Share a post
     * POST /api/posts/{postId}/share
     */
    @PostMapping("/posts/{postId}/share")
    public ResponseEntity<?> sharePost(@PathVariable Long postId, @RequestParam Long userId, @RequestBody ShareRequest request) {
        try {
            // Ensure the postId in path matches the one in request body
            request.setPostId(postId);
            PostShareResponse response = shareService.sharePost(userId, request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Failed to share post: " + ex.getMessage());
        }
    }

    /**
     * Get shares for a post
     * GET /api/posts/{postId}/shares
     */
    @GetMapping("/posts/{postId}/shares")
    public List<PostShareResponse> getPostShares(@PathVariable Long postId,
                                                  @RequestParam(required = false) Long viewerId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return shareService.getPostShares(postId, viewerId, page, size);
    }

    /**
     * Get share count for a post
     * GET /api/posts/{postId}/shares/count
     */
    @GetMapping("/posts/{postId}/shares/count")
    public Map<String, Long> getShareCount(@PathVariable Long postId) {
        Map<String, Long> response = new HashMap<>();
        response.put("count", shareService.getShareCount(postId));
        return response;
    }

    /**
     * Check if user has shared a post
     * GET /api/posts/{postId}/share/status
     */
    @GetMapping("/posts/{postId}/share/status")
    public Map<String, Boolean> getShareStatus(@PathVariable Long postId, @RequestParam Long userId) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasShared", shareService.hasUserShared(postId, userId));
        return response;
    }

    /**
     * Delete a share
     * DELETE /api/shares/{shareId}
     */
    @DeleteMapping("/shares/{shareId}")
    public ResponseEntity<?> deleteShare(@PathVariable Long shareId, @RequestParam Long userId) {
        try {
            shareService.deleteShare(shareId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    /**
     * Get shares in user's feed
     * GET /api/feed/shares
     */
    @GetMapping("/feed/shares")
    public List<PostShareResponse> getSharesForFeed(@RequestParam(required = false) Long viewerId,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return shareService.getSharesForFeed(viewerId, page, size);
    }

    /**
     * Get shares in a group
     * GET /api/groups/{groupId}/shares
     */
    @GetMapping("/groups/{groupId}/shares")
    public List<PostShareResponse> getGroupShares(@PathVariable Long groupId,
                                                   @RequestParam(required = false) Long viewerId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        return shareService.getGroupShares(groupId, viewerId, page, size);
    }

    /**
     * Get shares by a specific user (for user profile)
     * GET /api/users/{userId}/shares
     */
    @GetMapping("/users/{userId}/shares")
    public List<PostShareResponse> getUserShares(@PathVariable Long userId,
                                                  @RequestParam(required = false) Long viewerId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return shareService.getUserShares(userId, viewerId, page, size);
    }
}
