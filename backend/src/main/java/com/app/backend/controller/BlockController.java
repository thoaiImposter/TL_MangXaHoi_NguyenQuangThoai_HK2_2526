package com.app.backend.controller;

import com.app.backend.service.AuthenticatedUserService;
import com.app.backend.service.BlockService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class BlockController {

    private final BlockService blockService;
    private final AuthenticatedUserService authenticatedUserService;

    public BlockController(BlockService blockService, AuthenticatedUserService authenticatedUserService) {
        this.blockService = blockService;
        this.authenticatedUserService = authenticatedUserService;
    }

    // Block endpoints (RESTful: /users/{userId}/blocks)
    @GetMapping("/users/{userId}/blocks")
    public ResponseEntity<?> getBlockedList(@PathVariable Long userId) {
        return ResponseEntity.ok(blockService.getBlockedList(userId));
    }

    @PostMapping("/users/{userId}/blocks")
    public ResponseEntity<?> blockUser(@PathVariable Long userId, @RequestBody Map<String, Long> payload) {
        try {
            Long blockedId = payload.get("blockedId");
            blockService.blockUser(authenticatedUserService.getCurrentUserId(), blockedId);
            return ResponseEntity.status(201).build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}/blocks/{blockedId}")
    public ResponseEntity<?> unblockUser(@PathVariable Long userId, @PathVariable Long blockedId) {
        try {
            blockService.unblockUser(authenticatedUserService.getCurrentUserId(), blockedId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
