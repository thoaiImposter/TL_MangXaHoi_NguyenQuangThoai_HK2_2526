package com.app.backend.controller;

import com.app.backend.dto.*;
import com.app.backend.service.AuthenticatedUserService;
import com.app.backend.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class ReportController {
    private final ReportService reportService;
    private final AuthenticatedUserService authenticatedUserService;

    public ReportController(ReportService reportService, AuthenticatedUserService authenticatedUserService) {
        this.reportService = reportService;
        this.authenticatedUserService = authenticatedUserService;
    }

    @PostMapping("/reports")
    public ResponseEntity<?> create(@RequestParam(required = false) Long reporterId, @RequestBody ReportRequest request) {
        try { return ResponseEntity.status(201).body(reportService.create(authenticatedUserService.getCurrentUserId(), request)); }
        catch (IllegalArgumentException ex) { return ResponseEntity.badRequest().body(ex.getMessage()); }
    }

    @GetMapping("/admin/reports")
    public ResponseEntity<?> list(@RequestParam(required = false) Long adminId, @RequestParam(defaultValue = "pending") String status,
                                  @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "30") int size) {
        try { return ResponseEntity.ok(reportService.list(authenticatedUserService.getCurrentUserId(), status, page, size)); }
        catch (IllegalArgumentException ex) { return ResponseEntity.status(403).body(ex.getMessage()); }
    }

    @GetMapping("/admin/reports/stats")
    public ResponseEntity<?> stats(@RequestParam(required = false) Long adminId) {
        try { return ResponseEntity.ok(reportService.stats(authenticatedUserService.getCurrentUserId())); }
        catch (IllegalArgumentException ex) { return ResponseEntity.status(403).body(ex.getMessage()); }
    }

    @PutMapping("/admin/reports/{reportId}")
    public ResponseEntity<?> resolve(@PathVariable Long reportId, @RequestParam(required = false) Long adminId, @RequestBody ReportResolveRequest request) {
        try { return ResponseEntity.ok(reportService.resolve(reportId, authenticatedUserService.getCurrentUserId(), request)); }
        catch (IllegalArgumentException ex) { return ResponseEntity.badRequest().body(ex.getMessage()); }
    }
}
