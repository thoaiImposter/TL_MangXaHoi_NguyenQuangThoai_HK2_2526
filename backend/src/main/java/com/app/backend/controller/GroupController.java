package com.app.backend.controller;

import com.app.backend.dto.*;
import com.app.backend.entity.GroupMember;
import com.app.backend.entity.User;
import com.app.backend.repository.UserRepository;
import com.app.backend.service.GroupService;
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

    @Value("${spring.mail.username:noreply@nlusocial.edu.vn}")
    private String fromEmail;

    public GroupController(GroupService groupService, UserRepository userRepository, JavaMailSender mailSender) {
        this.groupService = groupService;
        this.userRepository = userRepository;
        this.mailSender = mailSender;
    }

    // ==================== Group CRUD ====================

    @PostMapping
    public ResponseEntity<GroupResponse> createGroup(@RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
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
        Long userId = Long.parseLong(body.get("userId").toString());
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
            @RequestParam Long userId) {
        groupService.deleteGroup(groupId, userId);
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
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(groupService.getUserGroups(userId, page, size));
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
        Long userId = Long.parseLong(body.get("userId").toString());
        GroupMemberResponse response = groupService.joinGroup(groupId, userId);
        if (response == null) {
            return ResponseEntity.accepted().body(Map.of("message", "Yêu cầu tham gia đã được gửi. Chờ phê duyệt."));
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{groupId}/leave")
    public ResponseEntity<Void> leaveGroup(
            @PathVariable Long groupId,
            @RequestParam Long userId) {
        groupService.leaveGroup(groupId, userId);
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
            @RequestParam Long adminId) {
        groupService.removeMember(groupId, memberId, adminId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Join Requests ====================

    @GetMapping("/{groupId}/join-requests")
    public ResponseEntity<List<GroupJoinRequestResponse>> getPendingJoinRequests(
            @PathVariable Long groupId,
            @RequestParam Long adminId) {
        return ResponseEntity.ok(groupService.getPendingJoinRequests(groupId, adminId));
    }

    @PutMapping("/{groupId}/join-requests/{requestId}/approve")
    public ResponseEntity<GroupMemberResponse> approveJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long requestId,
            @RequestParam Long adminId) {
        return ResponseEntity.ok(groupService.approveJoinRequest(groupId, requestId, adminId));
    }

    @DeleteMapping("/{groupId}/join-requests/{requestId}")
    public ResponseEntity<Void> rejectJoinRequest(
            @PathVariable Long groupId,
            @PathVariable Long requestId,
            @RequestParam Long adminId) {
        groupService.rejectJoinRequest(groupId, requestId, adminId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Role Management ====================

    @PutMapping("/{groupId}/members/{targetUserId}/grant-admin")
    public ResponseEntity<GroupMemberResponse> grantAdminRole(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @RequestParam Long adminId) {
        return ResponseEntity.ok(groupService.grantAdminRole(groupId, targetUserId, adminId));
    }

    @PutMapping("/{groupId}/members/{targetUserId}/revoke-admin")
    public ResponseEntity<GroupMemberResponse> revokeAdminRole(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @RequestParam Long adminId) {
        return ResponseEntity.ok(groupService.revokeAdminRole(groupId, targetUserId, adminId));
    }

    // ==================== Ban Management ====================

    @PostMapping("/{groupId}/bans")
    public ResponseEntity<Void> banUser(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long adminId = Long.parseLong(body.get("adminId").toString());
        Long targetUserId = Long.parseLong(body.get("targetUserId").toString());
        String reason = (String) body.get("reason");
        groupService.banUser(groupId, targetUserId, adminId, reason);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/bans/{targetUserId}")
    public ResponseEntity<Void> unbanUser(
            @PathVariable Long groupId,
            @PathVariable Long targetUserId,
            @RequestParam Long adminId) {
        groupService.unbanUser(groupId, targetUserId, adminId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Group Posts ====================

    @PostMapping("/{groupId}/posts")
    public ResponseEntity<GroupPostResponse> createGroupPost(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        PostRequest request = new PostRequest();
        request.setContent((String) body.get("content"));
        @SuppressWarnings("unchecked")
        List<java.util.Map<String, Object>> mediaList = (List<java.util.Map<String, Object>>) body.get("media");
        request.setMedia(mediaList);
        return ResponseEntity.ok(groupService.createGroupPost(groupId, userId, request));
    }

    @PostMapping("/{groupId}/posts/poll")
    public ResponseEntity<GroupPostResponse> createGroupPoll(
            @PathVariable Long groupId,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        String title = (String) body.get("title");
        String content = (String) body.get("content");
        @SuppressWarnings("unchecked")
        List<String> options = (List<String>) body.get("options");
        String endDate = body.get("endDate") != null ? (String) body.get("endDate") : null;
        boolean allowMultiple = body.get("allowMultiple") != null && Boolean.parseBoolean(body.get("allowMultiple").toString());
        return ResponseEntity.ok(groupService.createGroupPoll(groupId, userId, title, content, options, endDate, allowMultiple));
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
            @RequestParam Long adminId) {
        return ResponseEntity.ok(groupService.approveGroupPost(groupId, postId, adminId));
    }

    @DeleteMapping("/{groupId}/posts/{postId}/reject")
    public ResponseEntity<Void> rejectGroupPost(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @RequestParam Long adminId) {
        groupService.rejectGroupPost(groupId, postId, adminId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{groupId}/posts/{postId}")
    public ResponseEntity<Void> deleteGroupPost(
            @PathVariable Long groupId,
            @PathVariable Long postId,
            @RequestParam Long userId) {
        groupService.deleteGroupPost(groupId, postId, userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Post Interactions ====================

    @PostMapping("/{groupId}/posts/{postId}/likes")
    public ResponseEntity<PostLikeResponse> toggleLike(
            @PathVariable Long postId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(groupService.toggleLikeOnGroupPost(postId, userId));
    }

    @PostMapping("/{groupId}/posts/{postId}/comments")
    public ResponseEntity<PostCommentResponse> addComment(
            @PathVariable Long postId,
            @RequestBody Map<String, Object> body) {
        Long userId = Long.parseLong(body.get("userId").toString());
        PostCommentRequest request = new PostCommentRequest();
        request.setContent((String) body.get("content"));
        request.setParentCommentId(body.get("parentCommentId") != null ? Long.parseLong(body.get("parentCommentId").toString()) : null);
        request.setMedia((List<String>) body.get("media"));
        return ResponseEntity.ok(groupService.addCommentToGroupPost(postId, userId, request));
    }

    // ==================== Group Notifications ====================

    @GetMapping("/notifications")
    public ResponseEntity<List<GroupNotificationResponse>> getGroupNotifications(
            @RequestParam Long userId) {
        return ResponseEntity.ok(groupService.getGroupNotifications(userId));
    }

    @GetMapping("/notifications/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadGroupNotificationCount(
            @RequestParam Long userId) {
        Map<String, Long> response = new HashMap<>();
        response.put("count", groupService.getUnreadGroupNotificationCount(userId));
        return ResponseEntity.ok(response);
    }

    @PutMapping("/notifications/{notificationId}/read")
    public ResponseEntity<Void> markNotificationRead(
            @PathVariable Long notificationId) {
        groupService.markGroupNotificationAsRead(notificationId);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllNotificationsRead(
            @RequestParam Long userId) {
        groupService.markAllGroupNotificationsAsRead(userId);
        return ResponseEntity.noContent().build();
    }

    // ==================== Advisor Management (Step 3) ====================

    /**
     * Get list of advisors by faculty (for Đoàn khoa to pick from)
     */
    @GetMapping("/advisors")
    public ResponseEntity<List<UserResponse>> getAdvisorsByFaculty(
            @RequestParam(required = false) String faculty) {
        List<User> advisors;
        if (faculty != null && !faculty.isBlank()) {
            advisors = userRepository.findByRoleAndFaculty("advisor", faculty);
        } else {
            advisors = userRepository.findByRole("advisor");
        }
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
            @RequestParam Long adminId,
            @RequestParam Long advisorId) {
        try {
            GroupMemberResponse response = groupService.addAdvisorToGroup(groupId, advisorId, adminId);
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
            @RequestBody Map<String, String> body) {
        try {
            String advisorEmail = body.get("email");
            if (advisorEmail == null || advisorEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
            }

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

    // ==================== Student Invite (Step 4) ====================

    /**
     * Bulk invite students from Excel file.
     * Reads the "MSSV" column (case-insensitive), validates 8-digit codes,
     * adds registered students to group, sends email invites for unregistered ones.
     */
    @PostMapping("/{groupId}/bulk-invite-students")
    public ResponseEntity<?> bulkInviteStudents(
            @PathVariable Long groupId,
            @RequestParam Long adminId,
            @RequestParam("file") MultipartFile file) {
        try {
            // Validate admin is silver_key or gold_key
            GroupMember admin = groupService.getGroupMemberEntity(groupId, adminId);
            if (admin == null || (!"gold_key".equals(admin.getRole()) && !"silver_key".equals(admin.getRole()))) {
                return ResponseEntity.status(403).body(Map.of("message", "Chỉ cố vấn hoặc đoàn khoa mới có quyền mời sinh viên"));
            }

            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "File không được để trống"));
            }

            GroupResponse group = groupService.getGroup(groupId);
            String frontendUrl = "http://localhost:5173";

            // Parse Excel
            List<String> mssvList = parseMssvFromExcel(file);

            int added = 0, skipped = 0, invited = 0, errors = 0;
            List<String> addedNames = new java.util.ArrayList<>();
            List<String> invitedEmails = new java.util.ArrayList<>();
            List<String> errorDetails = new java.util.ArrayList<>();

            for (String mssv : mssvList) {
                String email = mssv + "@st.hcmuaf.edu.vn";
                try {
                    // Check if user exists
                    User student = userRepository.findByEmail(email).orElse(null);
                    if (student != null) {
                        // User exists - check if already in group
                        boolean alreadyMember = groupService.isMemberOfGroup(groupId, student.getId());
                        if (alreadyMember) {
                            skipped++;
                        } else {
                            // Add to group as member
                            groupService.addStudentToGroup(groupId, student.getId(), adminId);
                            added++;
                            addedNames.add(student.getFullName() + " (" + mssv + ")");
                        }
                    } else {
                        // User not registered - send invite email
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

        } catch (Exception ex) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi xử lý file: " + ex.getMessage()));
        }
    }

    /**
     * Parse MSSV column from Excel file (case-insensitive header match).
     * Handles both numeric and string cell types. Skips invalid rows.
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

            // Find MSSV column index (case-insensitive)
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

            // Read MSSV values from each row
            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;

                Cell cell = row.getCell(mssvColIndex);
                if (cell == null) continue;

                String value = getCellStringValue(cell).trim();
                if (value.isEmpty()) continue;

                // Extract only digits (handle cases like "22130273.0" or extra spaces)
                String digitsOnly = value.replaceAll("[^0-9]", "");

                // Validate: exactly 8 digits
                if (digitsOnly.length() == 8) {
                    mssvList.add(digitsOnly);
                }
                // Skip invalid rows silently
            }

            workbook.close();
        }

        return mssvList;
    }

    /**
     * Get string value from any cell type (handles numeric, string, formula, etc.)
     */
    private String getCellStringValue(Cell cell) {
        if (cell == null) return "";
        switch (cell.getCellType()) {
            case STRING:
                return cell.getStringCellValue();
            case NUMERIC:
                // Handle numeric - convert to string without decimal
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
     * Send invite email to a student to join the group
     */
    @PostMapping("/{groupId}/invite-student")
    public ResponseEntity<?> inviteStudent(
            @PathVariable Long groupId,
            @RequestBody Map<String, String> body) {
        try {
            String studentEmail = body.get("email");
            if (studentEmail == null || studentEmail.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email không được để trống"));
            }

            // Validate email is a student email
            if (!studentEmail.matches("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$")) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email sinh viên phải có dạng: MSSV@st.hcmuaf.edu.vn"));
            }

            GroupResponse group = groupService.getGroup(groupId);

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