package com.app.backend.controller;

import com.app.backend.service.AuthenticatedUserService;
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
    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    /**
     * Ham tao bai viet dang binh chon.
     */
    @PostMapping
    public ResponseEntity<?> createPoll(@RequestBody Map<String, Object> request) {
        try {
            Long authorId = authenticatedUserService.getCurrentUserId();
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
     * Ham ghi nhan lua chon cua user trong poll.
     */
    @PostMapping("/{postId}/vote")
    public ResponseEntity<?> vote(@PathVariable Long postId, @RequestBody Map<String, Object> request) {
        try {
            Long userId = authenticatedUserService.getCurrentUserId();
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
     * Ham lay ket qua hien tai cua poll.
     */
    @GetMapping("/{postId}/results")
    public ResponseEntity<?> getPollResults(@PathVariable Long postId, @RequestParam(required = false) Long userId) {
        try {
            Map<String, Object> result = pollService.getPollResults(postId, authenticatedUserService.getCurrentUserId());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to get poll results"));
        }
    }

    /**
     * Ham huy vote cua user trong poll.
     */
    @DeleteMapping("/{postId}/vote")
    public ResponseEntity<?> removeVote(@PathVariable Long postId, @RequestParam(required = false) Long userId) {
        try {
            pollService.removeVote(postId, authenticatedUserService.getCurrentUserId());
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to remove vote"));
        }
    }
}
