package com.app.backend.controller;

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

    public BlockController(BlockService blockService) {
        this.blockService = blockService;
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
            blockService.blockUser(userId, blockedId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/users/{userId}/blocks/{blockedId}")
    public ResponseEntity<?> unblockUser(@PathVariable Long userId, @PathVariable Long blockedId) {
        try {
            blockService.unblockUser(userId, blockedId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}