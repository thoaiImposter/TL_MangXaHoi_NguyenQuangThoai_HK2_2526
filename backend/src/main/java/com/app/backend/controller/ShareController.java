package com.app.backend.controller;

import com.app.backend.dto.PostShareResponse;
import com.app.backend.dto.ShareRequest;
import com.app.backend.service.AuthenticatedUserService;
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
    private final AuthenticatedUserService authenticatedUserService;

    public ShareController(ShareService shareService, AuthenticatedUserService authenticatedUserService) {
        this.shareService = shareService;
        this.authenticatedUserService = authenticatedUserService;
    }

    /**
     * Ham chia se bai viet ve timeline ca nhan.
     */
    @PostMapping("/posts/{postId}/share")
    public ResponseEntity<?> sharePost(@PathVariable Long postId, @RequestParam(required = false) Long userId, @RequestBody ShareRequest request) {
        try {
            // Lay postId tren URL lam nguon dung duy nhat cho request.
            request.setPostId(postId);
            PostShareResponse response = shareService.sharePost(authenticatedUserService.getCurrentUserId(), request);
            return ResponseEntity.status(201).body(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Failed to share post: " + ex.getMessage());
        }
    }

    /**
     * Ham lay danh sach luot chia se cua mot bai.
     */
    @GetMapping("/posts/{postId}/shares")
    public List<PostShareResponse> getPostShares(@PathVariable Long postId,
                                                  @RequestParam(required = false) Long viewerId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return shareService.getPostShares(postId, viewerId, page, size);
    }

    /**
     * Ham dem so luot chia se cua bai.
     */
    @GetMapping("/posts/{postId}/shares/count")
    public Map<String, Long> getShareCount(@PathVariable Long postId) {
        Map<String, Long> response = new HashMap<>();
        response.put("count", shareService.getShareCount(postId));
        return response;
    }

    /**
     * Ham kiem tra user hien tai da chia se bai nay chua.
     */
    @GetMapping("/posts/{postId}/share/status")
    public Map<String, Boolean> getShareStatus(@PathVariable Long postId, @RequestParam(required = false) Long userId) {
        Map<String, Boolean> response = new HashMap<>();
        response.put("hasShared", shareService.hasUserShared(postId, authenticatedUserService.getCurrentUserId()));
        return response;
    }

    /**
     * Ham xoa mot bai chia se.
     */
    @DeleteMapping("/shares/{shareId}")
    public ResponseEntity<?> deleteShare(@PathVariable Long shareId, @RequestParam(required = false) Long userId) {
        try {
            shareService.deleteShare(shareId, authenticatedUserService.getCurrentUserId());
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    /**
     * Ham lay cac bai chia se trong bang tin.
     */
    @GetMapping("/feed/shares")
    public List<PostShareResponse> getSharesForFeed(@RequestParam(required = false) Long viewerId,
                                                     @RequestParam(defaultValue = "0") int page,
                                                     @RequestParam(defaultValue = "10") int size) {
        return shareService.getSharesForFeed(viewerId, page, size);
    }

    /**
     * Ham lay cac bai chia se trong nhom.
     */
    @GetMapping("/groups/{groupId}/shares")
    public List<PostShareResponse> getGroupShares(@PathVariable Long groupId,
                                                   @RequestParam(required = false) Long viewerId,
                                                   @RequestParam(defaultValue = "0") int page,
                                                   @RequestParam(defaultValue = "10") int size) {
        return shareService.getGroupShares(groupId, viewerId, page, size);
    }

    /**
     * Ham lay cac bai chia se cua mot user tren profile.
     */
    @GetMapping("/users/{userId}/shares")
    public List<PostShareResponse> getUserShares(@PathVariable Long userId,
                                                  @RequestParam(required = false) Long viewerId,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "10") int size) {
        return shareService.getUserShares(userId, viewerId, page, size);
    }
}
