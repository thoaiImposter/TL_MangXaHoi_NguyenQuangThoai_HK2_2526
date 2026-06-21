package com.app.backend.service;

import com.app.backend.dto.*;
import com.app.backend.entity.*;
import com.app.backend.repository.*;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Service
public class ReportService {
    private static final Set<String> TARGET_TYPES = Set.of("post", "comment", "user", "group");
    private static final Set<String> REASONS = Set.of("spam", "harassment", "hate", "violence", "nudity", "misinformation", "other");

    private final ReportRepository reportRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostCommentRepository commentRepository;
    private final GroupRepository groupRepository;
    private final PrivacyAccessService privacyAccessService;
    private final AdminService adminService;

    public ReportService(ReportRepository reportRepository, UserRepository userRepository, PostRepository postRepository,
                         PostCommentRepository commentRepository, GroupRepository groupRepository,
                         PrivacyAccessService privacyAccessService, AdminService adminService) {
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.commentRepository = commentRepository;
        this.groupRepository = groupRepository;
        this.privacyAccessService = privacyAccessService;
        this.adminService = adminService;
    }

    /**
     * Ham tao bao cao, chup snapshot doi tuong bi bao cao de admin xem lai.
     */
    @Transactional
    public ReportResponse create(Long reporterId, ReportRequest request) {
        User reporter = userRepository.findById(reporterId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        String type = clean(request.getTargetType()).toLowerCase();
        String reason = clean(request.getReason()).toLowerCase();
        if (!TARGET_TYPES.contains(type) || request.getTargetId() == null) throw new IllegalArgumentException("Đối tượng báo cáo không hợp lệ");
        if (!REASONS.contains(reason)) throw new IllegalArgumentException("Lý do báo cáo không hợp lệ");
        if (reportRepository.existsByReporterIdAndTargetTypeAndTargetIdAndStatus(reporterId, type, request.getTargetId(), "pending")) {
            throw new IllegalArgumentException("Bạn đã báo cáo nội dung này và báo cáo đang chờ xử lý");
        }

        TargetSnapshot target = inspectTarget(type, request.getTargetId(), reporterId);
        if (reporterId.equals(target.ownerId())) throw new IllegalArgumentException("Bạn không thể báo cáo nội dung của chính mình");

        Report report = new Report();
        report.setReporter(reporter);
        report.setTargetType(type);
        report.setTargetId(request.getTargetId());
        report.setTargetOwnerId(target.ownerId());
        report.setTargetTitle(limit(target.title(), 500));
        report.setTargetSnapshot(limit(target.snapshot(), 3000));
        report.setReason(reason);
        report.setDetails(limit(clean(request.getDetails()), 1000));
        return toResponse(reportRepository.save(report));
    }

    /**
     * Ham lay danh sach bao cao cho admin theo trang thai.
     */
    public List<ReportResponse> list(Long adminId, String status, int page, int size) {
        requireAdmin(adminId);
        int safeSize = Math.max(1, Math.min(size, 50));
        var pageable = PageRequest.of(Math.max(0, page), safeSize);
        var reports = status == null || status.isBlank() || "all".equals(status)
            ? reportRepository.findAllByOrderByCreatedAtDesc(pageable)
            : reportRepository.findByStatusOrderByCreatedAtDesc(status, pageable);
        return reports.stream().map(this::toResponse).toList();
    }

    /**
     * Ham dem so bao cao theo tung trang thai.
     */
    public java.util.Map<String, Long> stats(Long adminId) {
        requireAdmin(adminId);
        return java.util.Map.of(
            "all", reportRepository.count(),
            "pending", reportRepository.countByStatus("pending"),
            "resolved", reportRepository.countByStatus("resolved"),
            "rejected", reportRepository.countByStatus("rejected")
        );
    }

    /**
     * Ham xu ly bao cao: bo qua, danh dau da xu ly, hoac xoa doi tuong bi bao cao.
     */
    @Transactional
    public ReportResponse resolve(Long reportId, Long adminId, ReportResolveRequest request) {
        User admin = requireAdmin(adminId);
        Report report = reportRepository.findById(reportId).orElseThrow(() -> new IllegalArgumentException("Report not found"));
        if (!"pending".equals(report.getStatus())) throw new IllegalArgumentException("Báo cáo này đã được xử lý");
        String action = clean(request.getAction()).toLowerCase();
        if (!Set.of("dismiss", "resolve", "delete_target").contains(action)) throw new IllegalArgumentException("Hành động xử lý không hợp lệ");

        if ("delete_target".equals(action)) deleteTarget(report, adminId);
        report.setStatus("dismiss".equals(action) ? "rejected" : "resolved");
        report.setResolution(action);
        report.setAdminNote(limit(clean(request.getAdminNote()), 1000));
        report.setHandledBy(admin);
        report.setHandledAt(LocalDateTime.now());
        return toResponse(reportRepository.save(report));
    }

    /**
     * Ham lay thong tin doi tuong bi bao cao va kiem tra reporter co quyen xem doi tuong do.
     */
    private TargetSnapshot inspectTarget(String type, Long id, Long viewerId) {
        return switch (type) {
            case "post" -> {
                Post post = postRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bài viết không tồn tại"));
                privacyAccessService.requirePostAccess(post, viewerId);
                yield new TargetSnapshot(post.getAuthor().getId(), "Bài viết của " + post.getAuthor().getFullName(), post.getContent());
            }
            case "comment" -> {
                PostComment comment = commentRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Bình luận không tồn tại"));
                privacyAccessService.requirePostAccess(comment.getPost(), viewerId);
                yield new TargetSnapshot(comment.getAuthor().getId(), "Bình luận của " + comment.getAuthor().getFullName(), comment.getContent());
            }
            case "user" -> {
                User user = userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));
                yield new TargetSnapshot(user.getId(), user.getFullName(), user.getBio());
            }
            case "group" -> {
                Group group = groupRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Nhóm không tồn tại"));
                privacyAccessService.requireGroupAccess(group, viewerId);
                yield new TargetSnapshot(group.getCreator().getId(), group.getName(), group.getDescription());
            }
            default -> throw new IllegalArgumentException("Đối tượng báo cáo không hợp lệ");
        };
    }

    /**
     * Ham xoa doi tuong bi bao cao khi admin chon delete_target.
     */
    private void deleteTarget(Report report, Long adminId) {
        switch (report.getTargetType()) {
            case "post" -> adminService.deletePost(adminId, report.getTargetId());
            case "comment" -> adminService.deleteComment(adminId, report.getTargetId());
            case "group" -> adminService.deleteGroup(adminId, report.getTargetId());
            case "user" -> adminService.deleteUser(adminId, report.getTargetId());
            default -> throw new IllegalArgumentException("Đối tượng báo cáo không hợp lệ");
        }
    }

    /**
     * Ham kiem tra quyen admin cho cac API report.
     */
    private User requireAdmin(Long adminId) {
        User admin = userRepository.findById(adminId).orElseThrow(() -> new IllegalArgumentException("Admin not found"));
        if (!"admin".equals(admin.getRole())) throw new IllegalArgumentException("Bạn không có quyền quản trị");
        return admin;
    }

    /**
     * Ham chuyen Report entity sang ReportResponse.
     */
    private ReportResponse toResponse(Report report) {
        User handler = report.getHandledBy();
        return new ReportResponse(report.getId(), report.getReporter().getId(), report.getReporter().getFullName(),
            report.getTargetType(), report.getTargetId(), report.getTargetOwnerId(), report.getTargetTitle(),
            report.getTargetSnapshot(), targetUrl(report), report.getReason(), report.getDetails(), report.getStatus(),
            report.getResolution(), report.getAdminNote(), handler == null ? null : handler.getId(),
            handler == null ? null : handler.getFullName(), report.getCreatedAt(), report.getHandledAt());
    }

    /**
     * Ham tao URL de frontend dieu huong den doi tuong bi bao cao.
     */
    private String targetUrl(Report report) {
        return switch (report.getTargetType()) {
            case "post" -> "/post/" + report.getTargetId();
            case "comment" -> commentRepository.findById(report.getTargetId()).map(c -> "/post/" + c.getPost().getId()).orElse(null);
            case "user" -> "/users/" + report.getTargetId();
            case "group" -> "/groups/" + report.getTargetId();
            default -> null;
        };
    }

    private String clean(String value) { return value == null ? "" : value.trim(); }
    private String limit(String value, int max) { return value == null || value.isBlank() ? null : value.substring(0, Math.min(max, value.length())); }
    private record TargetSnapshot(Long ownerId, String title, String snapshot) {}
}
