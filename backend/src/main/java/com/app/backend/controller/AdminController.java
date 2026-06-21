package com.app.backend.controller;

import com.app.backend.service.AuthenticatedUserService;
import com.app.backend.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final AdminService service;
    private final AuthenticatedUserService authenticatedUserService;

    public AdminController(AdminService service, AuthenticatedUserService authenticatedUserService) {
        this.service = service;
        this.authenticatedUserService = authenticatedUserService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(@RequestParam(required = false) Long adminId) { return execute(() -> service.stats(authenticatedUserService.getCurrentUserId())); }
    @GetMapping("/users")
    public ResponseEntity<?> users(@RequestParam(required = false) Long adminId, @RequestParam(defaultValue = "") String q,
        @RequestParam(defaultValue = "all") String role, @RequestParam(defaultValue = "all") String status,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "30") int size) {
        return execute(() -> service.listUsers(authenticatedUserService.getCurrentUserId(), q, role, status, page, size));
    }
    @GetMapping("/groups")
    public ResponseEntity<?> groups(@RequestParam(required = false) Long adminId, @RequestParam(defaultValue = "") String q,
        @RequestParam(defaultValue = "all") String privacy, @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "30") int size) {
        return execute(() -> service.listGroups(authenticatedUserService.getCurrentUserId(), q, privacy, page, size));
    }
    @GetMapping("/posts")
    public ResponseEntity<?> posts(@RequestParam(required = false) Long adminId, @RequestParam(defaultValue = "") String q,
        @RequestParam(defaultValue = "all") String visibility, @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "30") int size) {
        return execute(() -> service.listPosts(authenticatedUserService.getCurrentUserId(), q, visibility, page, size));
    }
    @GetMapping("/comments")
    public ResponseEntity<?> comments(@RequestParam(required = false) Long adminId, @RequestParam(defaultValue = "") String q,
        @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "30") int size) {
        return execute(() -> service.listComments(authenticatedUserService.getCurrentUserId(), q, page, size));
    }
    @PatchMapping("/users/{id}/lock")
    public ResponseEntity<?> lock(@RequestParam(required = false) Long adminId, @PathVariable Long id, @RequestParam boolean locked) {
        return execute(() -> service.setUserLocked(authenticatedUserService.getCurrentUserId(), id, locked));
    }
    @DeleteMapping("/users/{id}") public ResponseEntity<?> deleteUser(@RequestParam(required = false) Long adminId, @PathVariable Long id) { return remove(() -> service.deleteUser(authenticatedUserService.getCurrentUserId(), id)); }
    @DeleteMapping("/groups/{id}") public ResponseEntity<?> deleteGroup(@RequestParam(required = false) Long adminId, @PathVariable Long id) { return remove(() -> service.deleteGroup(authenticatedUserService.getCurrentUserId(), id)); }
    @DeleteMapping("/posts/{id}") public ResponseEntity<?> deletePost(@RequestParam(required = false) Long adminId, @PathVariable Long id) { return remove(() -> service.deletePost(authenticatedUserService.getCurrentUserId(), id)); }
    @DeleteMapping("/comments/{id}") public ResponseEntity<?> deleteComment(@RequestParam(required = false) Long adminId, @PathVariable Long id) { return remove(() -> service.deleteComment(authenticatedUserService.getCurrentUserId(), id)); }

    private ResponseEntity<?> execute(Action action) {
        try { return ResponseEntity.ok(action.run()); }
        catch (IllegalArgumentException ex) { return ResponseEntity.badRequest().body(ex.getMessage()); }
    }
    private ResponseEntity<?> remove(VoidAction action) {
        try { action.run(); return ResponseEntity.noContent().build(); }
        catch (IllegalArgumentException ex) { return ResponseEntity.badRequest().body(ex.getMessage()); }
    }
    private interface Action { Object run(); }
    private interface VoidAction { void run(); }
}
