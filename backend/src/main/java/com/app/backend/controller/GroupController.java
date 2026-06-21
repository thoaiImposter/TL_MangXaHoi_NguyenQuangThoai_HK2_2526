package com.app.backend.controller;

import com.app.backend.dto.*;
import com.app.backend.entity.GroupMember;
import com.app.backend.entity.User;
import com.app.backend.repository.UserRepository;
import com.app.backend.service.GroupService;
import com.app.backend.service.AuthenticatedUserService;
import jakarta.mail.internet.MimeMessage;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final UserRepository userRepository;
    private final JavaMailSender mailSender;
    private final AuthenticatedUserService authenticatedUserService;

    @Value("${spring.mail.username:noreply@nlusocial.edu.vn}")
    private String fromEmail;

    public GroupController(GroupService groupService, UserRepository userRepository, JavaMailSender mailSender,
                           AuthenticatedUserService authenticatedUserService) {
        this.groupService = groupService;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
        this.authenticatedUserService = authenticatedUserService;
    }

    // ==================== Group CRUD ====================

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@RequestBody Map<String, Object> body) {
        Long userId = authenticatedUserService.getCurrentUserId();
        GroupRequest request = new GroupRequest(
            (String) body.get("name"),
            (String) body.get("description"),
            (String) body.get("avatar"),
            (String) body.get("cover"),
            (String) body.get("privacy"),
            (Boolean) body.get("approvalRequired")
        );
        GroupResponse response = groupService.createGroup(userId, request);
        return ResponseEntity.created(URI.create("/api/groups/" + response.id())).body(response);
    }

    @GetMapping("/{groupId}")
    public ResponseEntity<GroupResponse> getGroup(@PathVariable Long groupId) {
        return ResponseEntity.ok(groupService.getGroup(groupId));
    }

    @PutMapping("/{groupId}")
    public ResponseEntity<GroupResponse> updateGroup(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long userId = authenticatedUserService.getCurrentUserId();
        GroupRequest request = new GroupRequest(
            (String) body.get("name"),
            (String) body.get("description"),
            (String) body.get("avatar"),
            (String) body.get("cover"),
            (String) body.get("privacy"),
            body.get("approvalRequired") != null ? (Boolean) body.get("approvalRequired") : null
        );
        return ResponseEntity.ok(groupService.updateGroup(groupId, userId, request));
    }

    @DeleteMapping("/{groupId}")
    public ResponseEntity<Void> deleteGroup(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long userId) {
        groupService.deleteGroup(groupId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ==================== Group Discovery ====================

    @GetMapping("/public")
    public ResponseEntity<List<GroupResponse>> getPublicGroups(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(groupService.getPublicGroups(page, size));
    }

    @GetMapping("/my-groups")
    public ResponseEntity<List<GroupResponse>> getUserGroups(
            @RequestParam(required = false) Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(groupService.getUserGroups(authenticatedUserService.getCurrentUserId(), page, size));
    }

    @GetMapping("/search")
    public ResponseEntity<List<GroupResponse>> searchGroups(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(groupService.searchGroups(q, page, size));
    }

    // ==================== Member Management ====================

    @PostMapping("/{groupId}/join")
    public ResponseEntity<?> joinGroup(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long userId = authenticatedUserService.getCurrentUserId();
        GroupMemberResponse response = groupService.joinGroup(groupId, userId);
        if (response == null) {
            return ResponseEntity.accepted().body(Map.of("message", "Yêu cầu tham gia đã được gửi. Chờ phê duyệt."));
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long userId) {
        groupService.leaveGroup(groupId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{groupId}/members")
    public ResponseEntity<List<GroupMemberResponse>> getGroupMembers(
            @PathVariable Long groupId,
            @RequestParam(required = false) String role) {
        return ResponseEntity.ok(groupService.getGroupMembers(groupId, role));
    }

    @DeleteMapping("/{groupId}/members/{memberId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable Long groupId,
            @PathVariable Long memberId,
            @RequestParam(required = false) Long adminId) {
        groupService.removeMember(groupId, memberId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ==================== Join Requests ====================

    @GetMapping("/join-requests/pending")
    public ResponseEntity<List<GroupJoinRequestResponse>> getMyPendingJoinRequests(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(groupService.getPendingJoinRequestsByUser(authenticatedUserService.getCurrentUserId()));
    }

    @GetMapping("/{groupId}/join-requests")
    public ResponseEntity<List<GroupJoinRequestResponse>> getPendingJoinRequests(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long adminId) {
        return ResponseEntity.ok(groupService.getPendingJoinRequests(groupId, authenticatedUserService.getCurrentUserId()));
    }

    @PutMapping("/{groupId}/join-requests/{requestId}/approve")
    public ResponseEntity<GroupMemberResponse> approveJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long requestId,
            @RequestParam(required = false) Long adminId) {
        return ResponseEntity.ok(groupService.approveJoinRequest(groupId, requestId, authenticatedUserService.getCurrentUserId()));
    }

    @DeleteMapping("/{groupId}/join-requests/{requestId}")
    public ResponseEntity<Void> rejectJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long requestId,
            @RequestParam(required = false) Long adminId) {
        groupService.rejectJoinRequest(groupId, requestId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ==================== Role Management ====================

    @PutMapping("/{groupId}/members/{targetUserId}/grant-admin")
    public ResponseEntity<GroupMemberResponse> grantAdminRole(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @RequestParam(required = false) Long adminId) {
        return ResponseEntity.ok(groupService.grantAdminRole(groupId, targetUserId, authenticatedUserService.getCurrentUserId()));
    }

    @PutMapping("/{groupId}/members/{targetUserId}/revoke-admin")
    public ResponseEntity<GroupMemberResponse> revokeAdminRole(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @RequestParam(required = false) Long adminId) {
        return ResponseEntity.ok(groupService.revokeAdminRole(groupId, targetUserId, authenticatedUserService.getCurrentUserId()));
    }

    // ==================== Ban Management ====================

    @PostMapping("/{groupId}/bans")
    public ResponseEntity<Void> banUser(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long adminId = authenticatedUserService.getCurrentUserId();
        Long targetUserId = Long.parseLong(body.get("targetUserId").toString());
        String reason = (String) body.get("reason");
        groupService.banUser(groupId, targetUserId, adminId, reason);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/bans/{targetUserId}")
    public ResponseEntity<Void> unbanUser(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @RequestParam(required = false) Long adminId) {
        groupService.unbanUser(groupId, targetUserId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ==================== Group Posts ====================

    @PostMapping("/{groupId}/posts")
    public ResponseEntity<GroupPostResponse> createGroupPost(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long userId = authenticatedUserService.getCurrentUserId();
        PostRequest request = new PostRequest();
        request.setContent((String) body.get("content"));
        @SuppressWarnings("unchecked")
        List<java.util.Map<String, Object>> mediaList = (List<java.util.Map<String, Object>>) body.get("media");
        request.setMedia(mediaList);
        return ResponseEntity.status(201).body(groupService.createGroupPost(groupId, userId, request));
    }

    @PostMapping("/{groupId}/announcements")
    public ResponseEntity<GroupPostResponse> createGroupAnnouncement(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long userId = authenticatedUserService.getCurrentUserId();
        PostRequest request = new PostRequest();
        request.setContent((String) body.get("content"));
        @SuppressWarnings("unchecked")
        List<java.util.Map<String, Object>> mediaList = (List<java.util.Map<String, Object>>) body.get("media");
        request.setMedia(mediaList);
        return ResponseEntity.status(201).body(groupService.createGroupAnnouncement(groupId, userId, request));
    }

    @PostMapping("/{groupId}/posts/poll")
    public ResponseEntity<GroupPostResponse> createGroupPoll(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long userId = authenticatedUserService.getCurrentUserId();
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        @SuppressWarnings("unchecked")
        List<String> options = (List<String>) body.get("options");
        String endDate = body.get("endDate") != null ? (String) body.get("endDate") : null;
        boolean allowMultiple = body.get("allowMultiple") != null && Boolean.parseBoolean(body.get("allowMultiple").toString());
        return ResponseEntity.status(201).body(groupService.createGroupPoll(groupId, userId, title, content, options, endDate, allowMultiple));
    }

    @GetMapping("/{groupId}/posts")
    public ResponseEntity<List<GroupPostResponse>> getGroupPosts(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long viewerId,
            @RequestParam(required = false) String filter,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(groupService.getGroupPosts(groupId, viewerId, filter, page, size));
    }

    @PutMapping("/{groupId}/posts/{postId}/approve")
    public ResponseEntity<GroupPostResponse> approveGroupPost(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @RequestParam(required = false) Long adminId) {
        return ResponseEntity.ok(groupService.approveGroupPost(groupId, postId, authenticatedUserService.getCurrentUserId()));
    }

    @DeleteMapping("/{groupId}/posts/{postId}/reject")
    public ResponseEntity<Void> rejectGroupPost(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @RequestParam(required = false) Long adminId) {
        groupService.rejectGroupPost(groupId, postId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/posts/{postId}")
    public ResponseEntity<Void> deleteGroupPost(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @RequestParam(required = false) Long userId) {
        groupService.deleteGroupPost(groupId, postId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ==================== Post Interactions ====================

    @PostMapping("/{groupId}/posts/{postId}/likes")
    public ResponseEntity<PostLikeResponse> toggleLike(
            @PathVariable Long postId,
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(groupService.toggleLikeOnGroupPost(postId, authenticatedUserService.getCurrentUserId()));
    }

    @PostMapping("/{groupId}/posts/{postId}/comments")
    public ResponseEntity<PostCommentResponse> addComment(
            @PathVariable Long postId,
            @RequestBody Map<String, Object> body) {
        Long userId = authenticatedUserService.getCurrentUserId();
        PostCommentRequest request = new PostCommentRequest();
        request.setContent((String) body.get("content"));
        request.setParentCommentId(body.get("parentCommentId") != null ? Long.parseLong(body.get("parentCommentId").toString()) : null);
        request.setMedia((List<String>) body.get("media"));
        return ResponseEntity.status(201).body(groupService.addCommentToGroupPost(postId, userId, request));
    }

    // ==================== Group Notifications ====================

    @GetMapping("/notifications")
    public ResponseEntity<List<GroupNotificationResponse>> getGroupNotifications(
            @RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(groupService.getGroupNotifications(authenticatedUserService.getCurrentUserId()));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadGroupNotificationCount(
            @RequestParam(required = false) Long userId) {
        Map<String, Long> response = new HashMap<>();
        response.put("count", groupService.getUnreadGroupNotificationCount(authenticatedUserService.getCurrentUserId()));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Void> markNotificationRead(
            @PathVariable Long notificationId) {
        groupService.markGroupNotificationAsRead(notificationId, authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllNotificationsRead(
            @RequestParam(required = false) Long userId) {
        groupService.markAllGroupNotificationsAsRead(authenticatedUserService.getCurrentUserId());
        return ResponseEntity.noContent().build();
    }

    // ==================== Advisor Management ====================

    /**
     * Get list of advisors by faculty (for Đoàn khoa to pick from)
     */
    @GetMapping("/advisors")
    public ResponseEntity<List<UserResponse>> getAdvisorsByFaculty(
            @RequestParam(required = false) Long requesterId) {
        User requester = userRepository.findById(authenticatedUserService.getCurrentUserId())
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!"faculty_union".equals(requester.getRole()) || requester.getFaculty() == null) {
            throw new IllegalArgumentException("Chỉ Đoàn khoa được xem danh sách giảng viên thuộc khoa");
        }
        List<User> advisors = userRepository.findByRoleAndFaculty("advisor", requester.getFaculty());
        // Simple mapping without friend count for this endpoint
        List<UserResponse> responses = advisors.stream().map(u ->
            new UserResponse(
                u.getId(), u.getEmail(), u.getFullName(), u.getRole(),
                u.getAvatar(), u.getCover(), u.getBio(),
                u.getFaculty(), u.getClassName(), u.getAcademicYear(),
                u.getAcademicTitle(), u.getCreatedAt(), 0L, u.getAccountProtection()
            )
        ).toList();
        return ResponseEntity.ok(responses);
    }

    /**
     * Add an advisor to a group with silver_key role
     */
    @PostMapping("/{groupId}/add-advisor")
    public ResponseEntity<?> addAdvisorToGroup(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long adminId,
            @RequestParam Long advisorId) {
        try {
            GroupMemberResponse response = groupService.addAdvisorToGroup(groupId, advisorId, authenticatedUserService.getCurrentUserId());
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        }
    }

    /**
     * Send invite email to an advisor to join the group
     */
    @PostMapping("/{groupId}/invite-advisor")
    public ResponseEntity<?> inviteAdvisor(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long adminId,
            @RequestBody Map<String, String> body) {
        try {
            String advisorEmail = body.get("email");
            if (advisorEmail == null || advisorEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
            }
            groupService.validateAdvisorInvite(groupId, authenticatedUserService.getCurrentUserId(), advisorEmail);

            // Get group info
            GroupResponse group = groupService.getGroup(groupId);

            // Build invite link
            String frontendUrl = "http://localhost:5173";
            String inviteLink = frontendUrl + "/groups/" + groupId;
            String qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
                java.net.URLEncoder.encode(inviteLink, StandardCharsets.UTF_8);

            // Send email
            sendAdvisorInviteEmail(advisorEmail, group.name(), inviteLink, qrImageUrl);

            return ResponseEntity.ok(Map.of(
                "message", "Lời mời đã được gửi đến " + advisorEmail,
                "inviteLink", inviteLink,
                "qrImageUrl", qrImageUrl
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("message", "Không thể gửi lời mời: " + ex.getMessage()));
        }
    }

    private void sendAdvisorInviteEmail(String toEmail, String groupName, String inviteLink, String qrImageUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("📋 Lời mời tham gia nhóm: " + groupName);

            String html = "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>" +
                "<div style='background:#fff;border-radius:12px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,0.1)'>" +
                "<h2 style='color:#1e40af;text-align:center'>🎓 NLU Social</h2>" +
                "<p style='text-align:center;color:#64748b'>Mời tham gia nhóm lớp</p>" +
                "<hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0'>" +
                "<p>Bạn được mời tham gia nhóm:</p>" +
                "<div style='background:linear-gradient(135deg,#eff6ff,#dbeafe);border-radius:12px;padding:20px;text-align:center;margin:16px 0'>" +
                "<h3 style='color:#1e40af;margin:0'>" + groupName + "</h3>" +
                "<p style='color:#64748b;margin:8px 0 0'>Vai trò: <strong>Cố vấn học tập (Silver Key 🥈)</strong></p>" +
                "</div>" +
                "<div style='text-align:center;margin:24px 0'>" +
                "<a href='" + inviteLink + "' style='display:inline-block;background:#1e40af;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600'>" +
                "Tham gia nhóm</a>" +
                "</div>" +
                "<div style='text-align:center;margin:24px 0'>" +
                "<p style='color:#64748b;font-size:13px'>Hoặc quét mã QR:</p>" +
                "<img src='" + qrImageUrl + "' alt='QR Code' style='width:160px;height:160px'>" +
                "</div>" +
                "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:4px;margin:16px 0;font-size:13px'>" +
                "<strong>📋 Lưu ý:</strong> Nếu chưa có tài khoản, vui lòng đăng ký với vai trò <strong>Cố vấn học tập</strong> trước, sau đó nhấn link hoặc quét QR để tham gia nhóm." +
                "</div>" +
                "<p style='text-align:center;color:#94a3b8;font-size:12px;margin-top:24px'>© 2026 NLU Social - Email tự động, vui lòng không trả lời.</p>" +
                "</div></body></html>";

            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("✅ Invite email sent to: " + toEmail + " for group: " + groupName);
        } catch (Exception e) {
            System.err.println("❌ Failed to send invite email: " + e.getMessage());
            throw new RuntimeException("Không thể gửi email mời: " + e.getMessage());
        }
    }

    // ==================== Student Invite ====================

    /**
     * Ham doc file Excel, lay cot MSSV, them sinh vien da co tai khoan vao nhom
     * va gui email moi cho sinh vien chua dang ky.
     */
    @PostMapping("/{groupId}/bulk-invite-students")
    public ResponseEntity<?> bulkInviteStudents(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long adminId,
            @RequestParam("file") MultipartFile file) {
        try {
            Long currentAdminId = authenticatedUserService.getCurrentUserId();
            groupService.validateStudentManager(groupId, currentAdminId);

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File không được để trống"));
            }

            GroupResponse group = groupService.getGroup(groupId);
            String frontendUrl = "http://localhost:5173";

            // Doc danh sach MSSV hop le tu file Excel.
            List<String> mssvList = parseMssvFromExcel(file);
            if (mssvList.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "message", "Không tìm thấy MSSV hợp lệ trong file Excel"
                ));
            }

            int added = 0, skipped = 0, invited = 0, errors = 0;
            List<String> addedNames = new java.util.ArrayList<>();
            List<String> invitedEmails = new java.util.ArrayList<>();
            List<String> errorDetails = new java.util.ArrayList<>();

            for (String mssv : mssvList) {
                String email = mssv + "@st.hcmuaf.edu.vn";
                try {
                    // Doi MSSV thanh email truong de tim tai khoan sinh vien.
                    User student = userRepository.findByEmail(email).orElse(null);
                    if (student != null) {
                        // Neu da co tai khoan thi them vao nhom neu chua la thanh vien.
                        boolean alreadyMember = groupService.isMemberOfGroup(groupId, student.getId());
                        if (alreadyMember) {
                            skipped++;
                        } else {
                            groupService.addStudentToGroup(groupId, student.getId(), currentAdminId);
                            added++;
                            addedNames.add(student.getFullName() + " (" + mssv + ")");
                        }
                    } else {
                        // Neu chua co tai khoan thi gui email moi tham gia nhom.
                        String inviteLink = frontendUrl + "/groups/" + groupId;
                        String qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
                            java.net.URLEncoder.encode(inviteLink, java.nio.charset.StandardCharsets.UTF_8);
                        sendStudentInviteEmail(email, group.name(), inviteLink, qrImageUrl);
                        invited++;
                        invitedEmails.add(email);
                    }
                } catch (Exception e) {
                    errors++;
                    errorDetails.add(mssv + ": " + e.getMessage());
                }
            }

            Map<String, Object> result = new HashMap<>();
            result.put("message", String.format("Xử lý xong: %d đã thêm, %d đã trong nhóm, %d đã gửi mời, %d lỗi", added, skipped, invited, errors));
            result.put("added", added);
            result.put("skipped", skipped);
            result.put("invited", invited);
            result.put("errors", errors);
            result.put("addedNames", addedNames);
            result.put("invitedEmails", invitedEmails);
            result.put("errorDetails", errorDetails);
            result.put("total", mssvList.size());
            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi xử lý file: " + ex.getMessage()));
        }
    }

    /**
     * Ham doc cot MSSV trong Excel, chap nhan o dang chuoi hoac so.
     */
    private List<String> parseMssvFromExcel(MultipartFile file) throws Exception {
        List<String> mssvList = new java.util.ArrayList<>();
        String filename = file.getOriginalFilename();

        try (var inputStream = file.getInputStream()) {
            Workbook workbook;
            if (filename != null && filename.toLowerCase().endsWith(".xlsx")) {
                workbook = new XSSFWorkbook(inputStream);
            } else {
                workbook = new HSSFWorkbook(inputStream);
            }

            Sheet sheet = workbook.getSheetAt(0);
            if (sheet == null) return mssvList;

            // Tim vi tri cot co tieu de MSSV.
            Row headerRow = sheet.getRow(0);
            if (headerRow == null) return mssvList;

            int mssvColIndex = -1;
            for (int i = 0; i < headerRow.getLastCellNum(); i++) {
                Cell cell = headerRow.getCell(i);
                if (cell != null) {
                    String headerValue = getCellStringValue(cell).trim().toUpperCase();
                    if (headerValue.equals("MSSV") || headerValue.equals("mssv")) {
                        mssvColIndex = i;
                        break;
                    }
                }
            }

            if (mssvColIndex < 0) {
                throw new IllegalArgumentException("Không tìm thấy cột 'MSSV' trong file Excel");
            }

            // Doc tung dong va chi lay MSSV co dung 8 chu so.
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell cell = row.getCell(mssvColIndex);
                if (cell == null) continue;

                String value = getCellStringValue(cell).trim();
                if (value.isEmpty()) continue;

                // Loai ky tu thua de xu ly truong hop Excel doc thanh "22130273.0".
                String digitsOnly = value.replaceAll("[^0-9]", "");

                if (digitsOnly.length() == 8) {
                    mssvList.add(digitsOnly);
                }
            }

            workbook.close();
        }

        return mssvList;
    }

    /**
     * Ham chuyen moi kieu cell Excel ve chuoi de doc MSSV on dinh.
     */
    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                // So nguyen trong Excel duoc doi ve chuoi khong co .0.
                double numVal = cell.getNumericCellValue();
                if (numVal == Math.floor(numVal)) {
                    return String.valueOf((long) numVal);
                }
                return String.valueOf(numVal);
            case BOOLEAN:
                return String.valueOf(cell.getBooleanCellValue());
            case FORMULA:
                try {
                    return cell.getStringCellValue();
                } catch (Exception e) {
                    try {
                        double val = cell.getNumericCellValue();
                        if (val == Math.floor(val)) return String.valueOf((long) val);
                        return String.valueOf(val);
                    } catch (Exception e2) {
                        return "";
                    }
                }
            default:
                return "";
        }
    }

    /**
     * Ham moi mot sinh vien vao nhom bang email.
     */
    @PostMapping("/{groupId}/invite-student")
    public ResponseEntity<?> inviteStudent(
            @PathVariable Long groupId,
            @RequestParam(required = false) Long adminId,
            @RequestBody Map<String, String> body) {
        try {
            Long currentAdminId = authenticatedUserService.getCurrentUserId();
            GroupMember admin = groupService.validateStudentManager(groupId, currentAdminId);
            String studentEmail = body.get("email");
            if (studentEmail == null || studentEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
            }

            // Chi chap nhan email sinh vien dung mau MSSV@st.hcmuaf.edu.vn.
            if (!studentEmail.matches("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email sinh viên phải có dạng: MSSV@st.hcmuaf.edu.vn"));
            }

            GroupResponse group = groupService.getGroup(groupId);
            User registeredStudent = userRepository.findByEmail(studentEmail.toLowerCase()).orElse(null);
            if (registeredStudent != null) {
                if (!"student".equals(registeredStudent.getRole())) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Email này không thuộc tài khoản sinh viên"));
                }
                if ("faculty_union".equals(admin.getUser().getRole())
                        && (admin.getUser().getFaculty() == null || !admin.getUser().getFaculty().equals(registeredStudent.getFaculty()))) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Sinh viên không thuộc cùng khoa"));
                }
                if (!groupService.isMemberOfGroup(groupId, registeredStudent.getId())) {
                    groupService.addStudentToGroup(groupId, registeredStudent.getId(), currentAdminId);
                }
            }

            String frontendUrl = "http://localhost:5173";
            String inviteLink = frontendUrl + "/groups/" + groupId;
            String qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" +
                java.net.URLEncoder.encode(inviteLink, StandardCharsets.UTF_8);

            sendStudentInviteEmail(studentEmail, group.name(), inviteLink, qrImageUrl);

            return ResponseEntity.ok(Map.of(
                "message", "Lời mời đã được gửi đến " + studentEmail,
                "inviteLink", inviteLink,
                "qrImageUrl", qrImageUrl
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("message", "Không thể gửi lời mời: " + ex.getMessage()));
        }
    }

    private void sendStudentInviteEmail(String toEmail, String groupName, String inviteLink, String qrImageUrl) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("📋 Lời mời tham gia nhóm lớp: " + groupName);

            String html = "<!DOCTYPE html><html><body style='font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;'>" +
                "<div style='background:#fff;border-radius:12px;padding:30px;box-shadow:0 2px 8px rgba(0,0,0,0.1)'>" +
                "<h2 style='color:#1e40af;text-align:center'>🎓 NLU Social</h2>" +
                "<p style='text-align:center;color:#64748b'>Mời tham gia nhóm lớp</p>" +
                "<hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0'>" +
                "<p>Chào bạn,</p>" +
                "<p>Bạn được mời tham gia nhóm lớp:</p>" +
                "<div style='background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-radius:12px;padding:20px;text-align:center;margin:16px 0'>" +
                "<h3 style='color:#166534;margin:0'>" + groupName + "</h3>" +
                "<p style='color:#65676b;margin:8px 0 0'>Vai trò: <strong>Sinh viên (Thành viên)</strong></p>" +
                "</div>" +
                "<div style='text-align:center;margin:24px 0'>" +
                "<a href='" + inviteLink + "' style='display:inline-block;background:#16a34a;color:white;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600'>" +
                "Tham gia nhóm</a>" +
                "</div>" +
                "<div style='text-align:center;margin:24px 0'>" +
                "<p style='color:#64748b;font-size:13px'>Hoặc quét mã QR:</p>" +
                "<img src='" + qrImageUrl + "' alt='QR Code' style='width:160px;height:160px'>" +
                "</div>" +
                "<div style='background:#fef3c7;border-left:4px solid #f59e0b;padding:12px;border-radius:4px;margin:16px 0;font-size:13px'>" +
                "<strong>📋 Lưu ý:</strong> Nếu chưa có tài khoản NLU Social, vui lòng đăng ký với vai trò <strong>Sinh viên</strong> trước, sau đó nhấn link hoặc quét QR để tham gia nhóm." +
                "</div>" +
                "<p style='text-align:center;color:#94a3b8;font-size:12px;margin-top:24px'>© 2026 NLU Social - Email tự động, vui lòng không trả lời.</p>" +
                "</div></body></html>";

            helper.setText(html, true);
            mailSender.send(message);
            System.out.println("✅ Student invite email sent to: " + toEmail + " for group: " + groupName);
        } catch (Exception e) {
            System.err.println("❌ Failed to send student invite email: " + e.getMessage());
            throw new RuntimeException("Không thể gửi email mời sinh viên: " + e.getMessage());
        }
    }
}
