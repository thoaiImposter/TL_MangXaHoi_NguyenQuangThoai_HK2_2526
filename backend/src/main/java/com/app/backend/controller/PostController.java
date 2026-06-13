package com.app.backend.controller;

import com.app.backend.dto.*;
import com.app.backend.service.PostService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class PostController {
    private final PostService postService;

    public PostController(PostService postService) {
        this.postService = postService;
    }

    // Feed endpoints
    @GetMapping("/feed")
    public List<PostFeedResponse> getFeed(@RequestParam(required = false) Long viewerId,
                                          @RequestParam(defaultValue = "0") int page,
                                          @RequestParam(defaultValue = "10") int size) {
        return postService.getFeed(viewerId, page, size);
    }

    // User posts endpoints (RESTful: /users/{userId}/posts)
    @GetMapping("/users/{userId}/posts")
    public List<PostFeedResponse> getUserPosts(@PathVariable Long userId,
                                               @RequestParam(required = false) Long viewerId,
                                               @RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "10") int size,
                                               @RequestParam(defaultValue = "false") boolean personalOnly) {
        return postService.getPostsByUser(userId, viewerId, page, size, personalOnly);
    }

    @PostMapping("/users/{userId}/posts")
    public ResponseEntity<?> createPost(@PathVariable Long userId, @RequestBody PostRequest request) {
        try {
            return ResponseEntity.ok(postService.createPost(userId, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Post CRUD endpoints
    @GetMapping("/posts/{postId}")
    public ResponseEntity<?> getPost(@PathVariable Long postId, @RequestParam(required = false) Long viewerId) {
        try {
            return ResponseEntity.ok(postService.getPost(postId, viewerId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(404).body(ex.getMessage());
        }
    }

    @PutMapping("/posts/{postId}")
    public ResponseEntity<?> updatePost(@PathVariable Long postId, @RequestParam Long userId, @RequestBody PostRequest request) {
        try {
            return ResponseEntity.ok(postService.updatePost(postId, userId, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<?> deletePost(@PathVariable Long postId, @RequestParam Long userId) {
        try {
            postService.deletePost(postId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Post comments endpoints (RESTful: /posts/{postId}/comments)
    @GetMapping("/posts/{postId}/comments")
    public List<PostCommentResponse> getComments(@PathVariable Long postId, @RequestParam(required = false) Long viewerId) {
        return postService.getComments(postId, viewerId);
    }

    @PostMapping("/posts/{postId}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long postId, @RequestParam Long userId, @RequestBody PostCommentRequest request) {
        try {
            return ResponseEntity.ok(postService.addComment(postId, userId, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/posts/{postId}/comments/{commentId}/replies")
    public ResponseEntity<?> replyComment(@PathVariable Long postId, @PathVariable Long commentId, @RequestParam Long userId, @RequestBody PostCommentRequest request) {
        try {
            request.setParentCommentId(commentId);
            return ResponseEntity.ok(postService.addComment(postId, userId, request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/posts/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long commentId, @RequestParam Long userId, @RequestBody PostCommentRequest request) {
        try {
            return ResponseEntity.ok(postService.updateComment(commentId, userId, request.getContent()));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/posts/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, @RequestParam Long userId) {
        try {
            postService.deleteComment(commentId, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Post likes endpoints (RESTful: /posts/{postId}/likes)
    @PostMapping("/posts/{postId}/likes")
    public ResponseEntity<?> toggleLike(@PathVariable Long postId, @RequestParam Long userId) {
        try {
            return ResponseEntity.ok(postService.toggleLike(postId, userId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    // Comment likes endpoints (RESTful: /posts/comments/{commentId}/likes)
    @PostMapping("/posts/comments/{commentId}/likes")
    public ResponseEntity<?> toggleCommentLike(@PathVariable Long commentId, @RequestParam Long userId) {
        try {
            return ResponseEntity.ok(postService.toggleCommentLike(commentId, userId));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
