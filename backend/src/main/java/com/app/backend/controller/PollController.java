package com.app.backend.controller;

import com.app.backend.service.PollService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/polls")
@CrossOrigin(origins = "*")
public class PollController {

    @Autowired
    private PollService pollService;

    /**
     * Create a new poll post
     * POST /api/polls
     * Body: { authorId, title, content, visibility, options, endDate, allowMultiple }
     */
    @PostMapping
    public ResponseEntity<?> createPoll(@RequestBody Map<String, Object> request) {
        try {
            Long authorId = Long.parseLong(request.get("authorId").toString());
            String title = (String) request.get("title");
            String content = (String) request.get("content");
            String visibility = request.get("visibility") != null ? (String) request.get("visibility") : "public";
            @SuppressWarnings("unchecked")
            List<String> options = (List<String>) request.get("options");
            
            LocalDateTime endDate = null;
            if (request.get("endDate") != null) {
                endDate = LocalDateTime.parse(request.get("endDate").toString());
            }
            
            boolean allowMultiple = false;
            if (request.get("allowMultiple") != null) {
                allowMultiple = Boolean.parseBoolean(request.get("allowMultiple").toString());
            }

            var post = pollService.createPoll(authorId, title, content, visibility, options, endDate, allowMultiple);
            return ResponseEntity.ok(post);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to create poll"));
        }
    }

    /**
     * Vote in a poll
     * POST /api/polls/{postId}/vote
     * Body: { userId, optionIds }
     */
    @PostMapping("/{postId}/vote")
    public ResponseEntity<?> vote(@PathVariable Long postId, @RequestBody Map<String, Object> request) {
        try {
            Long userId = Long.parseLong(request.get("userId").toString());
            @SuppressWarnings("unchecked")
            List<Number> rawOptionIds = (List<Number>) request.get("optionIds");
            List<Long> optionIds = rawOptionIds.stream().map(Number::longValue).toList();

            Map<String, Object> result = pollService.vote(postId, userId, optionIds);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to vote"));
        }
    }

    /**
     * Get poll results
     * GET /api/polls/{postId}/results?userId=xxx
     */
    @GetMapping("/{postId}/results")
    public ResponseEntity<?> getPollResults(@PathVariable Long postId, @RequestParam Long userId) {
        try {
            Map<String, Object> result = pollService.getPollResults(postId, userId);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get poll results"));
        }
    }

    /**
     * Remove vote from a poll
     * DELETE /api/polls/{postId}/vote?userId=xxx
     */
    @DeleteMapping("/{postId}/vote")
    public ResponseEntity<?> removeVote(@PathVariable Long postId, @RequestParam Long userId) {
        try {
            pollService.removeVote(postId, userId);
            return ResponseEntity.ok(Map.of("message", "Vote removed successfully"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to remove vote"));
        }
    }
}