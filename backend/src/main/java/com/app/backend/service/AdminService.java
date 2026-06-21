package com.app.backend.service;

import com.app.backend.entity.*;
import com.app.backend.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Predicate;

@Service
public class AdminService {
    private final UserRepository users;
    private final GroupRepository groups;
    private final PostRepository posts;
    private final PostCommentRepository comments;
    private final GroupPostRepository groupPosts;
    private final ReportRepository reports;
    private final MessageRepository messages;
    private final OtpTokenRepository otpTokens;
    private final CloudinaryCleanupService cloudCleanup;

    public AdminService(UserRepository users, GroupRepository groups, PostRepository posts,
                        PostCommentRepository comments, GroupPostRepository groupPosts, ReportRepository reports,
                        MessageRepository messages, OtpTokenRepository otpTokens, CloudinaryCleanupService cloudCleanup) {
        this.users = users;
        this.groups = groups;
        this.posts = posts;
        this.comments = comments;
        this.groupPosts = groupPosts;
        this.reports = reports;
        this.messages = messages;
        this.otpTokens = otpTokens;
        this.cloudCleanup = cloudCleanup;
    }

    /**
     * Ham lay so lieu tong quan cho dashboard admin.
     */
    public Map<String, Long> stats(Long adminId) {
        requireAdmin(adminId);
        return Map.of(
            "users", users.count(),
            "groups", groups.count(),
            "posts", posts.count(),
            "comments", comments.count(),
            "pendingReports", reports.countByStatus("pending")
        );
    }

    /**
     * Ham lay danh sach user cho admin, co loc theo tu khoa/role/trang thai.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listUsers(Long adminId, String query, String role, String status, int page, int size) {
        requireAdmin(adminId);
        String q = clean(query);
        Predicate<User> filter = user -> (q.isBlank() || contains(user.getFullName(), q) || contains(user.getEmail(), q))
            && (clean(role).isBlank() || "all".equals(role) || role.equals(user.getRole()))
            && (clean(status).isBlank() || "all".equals(status)
                || ("locked".equals(status) && Boolean.TRUE.equals(user.getAccountLocked()))
                || ("active".equals(status) && !Boolean.TRUE.equals(user.getAccountLocked())));
        return page(users.findAll().stream().filter(filter).sorted(Comparator.comparing(User::getCreatedAt,
            Comparator.nullsLast(Comparator.reverseOrder()))).map(this::userMap).toList(), page, size);
    }

    /**
     * Ham lay danh sach nhom cho admin, co loc theo tu khoa/privacy.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listGroups(Long adminId, String query, String privacy, int page, int size) {
        requireAdmin(adminId);
        String q = clean(query);
        return page(groups.findAll().stream()
            .filter(group -> (q.isBlank() || contains(group.getName(), q) || contains(group.getDescription(), q))
                && (clean(privacy).isBlank() || "all".equals(privacy) || privacy.equals(group.getPrivacy())))
            .sorted(Comparator.comparing(Group::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::groupMap).toList(), page, size);
    }

    /**
     * Ham lay danh sach bai viet cho admin, co loc theo tu khoa/visibility.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listPosts(Long adminId, String query, String visibility, int page, int size) {
        requireAdmin(adminId);
        String q = clean(query);
        return page(posts.findAll().stream()
            .filter(post -> (q.isBlank() || contains(post.getContent(), q) || contains(post.getAuthor().getFullName(), q))
                && (clean(visibility).isBlank() || "all".equals(visibility) || visibility.equals(post.getVisibility())))
            .sorted(Comparator.comparing(Post::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::postMap).toList(), page, size);
    }

    /**
     * Ham lay danh sach binh luan cho admin.
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listComments(Long adminId, String query, int page, int size) {
        requireAdmin(adminId);
        String q = clean(query);
        return page(comments.findAll().stream()
            .filter(comment -> q.isBlank() || contains(comment.getContent(), q) || contains(comment.getAuthor().getFullName(), q))
            .sorted(Comparator.comparing(PostComment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
            .map(this::commentMap).toList(), page, size);
    }

    /**
     * Ham khoa hoac mo khoa tai khoan user, khong cho khoa admin.
     */
    @Transactional
    public Map<String, Object> setUserLocked(Long adminId, Long userId, boolean locked) {
        User admin = requireAdmin(adminId);
        User target = users.findById(userId).orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));
        if (target.getId().equals(admin.getId()) || "admin".equals(target.getRole())) {
            throw new IllegalArgumentException("Không thể khóa tài khoản quản trị");
        }
        target.setAccountLocked(locked);
        return userMap(users.save(target));
    }

    /**
     * Ham xoa user va don cac du lieu/phuong tien lien quan.
     */
    @Transactional public void deleteUser(Long adminId, Long id) {
        User admin = requireAdmin(adminId);
        User target = users.findById(id).orElseThrow(() -> new IllegalArgumentException("Tài khoản không tồn tại"));
        if (target.getId().equals(admin.getId()) || "admin".equals(target.getRole())) throw new IllegalArgumentException("Không thể xóa tài khoản quản trị");
        cloudCleanup.scheduleUserAssets(id);
        for (Group group : groups.findByCreatorId(id)) deleteGroupData(group);
        messages.deleteBySenderIdOrReceiverId(id, id);
        reports.deleteByTargetOwnerId(id);
        otpTokens.deleteByEmail(target.getEmail());
        users.delete(target);
        users.flush();
    }
    /**
     * Ham xoa nhom va cac bai viet thuoc nhom.
     */
    @Transactional public void deleteGroup(Long adminId, Long id) {
        requireAdmin(adminId);
        Group group = groups.findById(id).orElseThrow(() -> new IllegalArgumentException("Nhóm không tồn tại"));
        cloudCleanup.scheduleGroupAssets(id);
        deleteGroupData(group);
    }
    /**
     * Ham xoa bai viet theo quyen admin.
     */
    @Transactional public void deletePost(Long adminId, Long id) {
        requireAdmin(adminId);
        cloudCleanup.schedulePostAssets(id);
        posts.delete(posts.findById(id).orElseThrow(() -> new IllegalArgumentException("Bài viết không tồn tại")));
    }
    /**
     * Ham xoa binh luan theo quyen admin.
     */
    @Transactional public void deleteComment(Long adminId, Long id) {
        requireAdmin(adminId);
        cloudCleanup.scheduleCommentAssets(id);
        comments.delete(comments.findById(id).orElseThrow(() -> new IllegalArgumentException("Bình luận không tồn tại")));
    }

    /**
     * Ham xoa du lieu noi bo cua nhom truoc/sau khi xoa group.
     */
    private void deleteGroupData(Group group) {
        List<Long> postIds = groupPosts.findByGroupId(group.getId()).stream()
            .map(groupPost -> groupPost.getPost().getId()).toList();
        groups.delete(group);
        groups.flush();
        posts.deleteAllById(postIds);
    }

    /**
     * Ham kiem tra user hien tai co role admin.
     */
    private User requireAdmin(Long id) {
        User admin = users.findById(id).orElseThrow(() -> new IllegalArgumentException("Admin không tồn tại"));
        if (!"admin".equals(admin.getRole())) throw new IllegalArgumentException("Bạn không có quyền quản trị");
        return admin;
    }
    private Map<String, Object> userMap(User u) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", u.getId()); map.put("fullName", u.getFullName()); map.put("email", u.getEmail());
        map.put("role", u.getRole()); map.put("avatar", u.getAvatar()); map.put("locked", Boolean.TRUE.equals(u.getAccountLocked()));
        map.put("createdAt", u.getCreatedAt()); return map;
    }
    private Map<String, Object> groupMap(Group g) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", g.getId()); map.put("name", g.getName()); map.put("description", g.getDescription());
        map.put("avatar", g.getAvatar()); map.put("privacy", g.getPrivacy()); map.put("creatorName", g.getCreator().getFullName());
        map.put("memberCount", g.getMembers().stream().filter(m -> "active".equals(m.getStatus())).count()); map.put("createdAt", g.getCreatedAt()); return map;
    }
    private Map<String, Object> postMap(Post p) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", p.getId()); map.put("content", p.getContent()); map.put("visibility", p.getVisibility());
        map.put("authorName", p.getAuthor().getFullName()); map.put("commentCount", comments.countByPostId(p.getId()));
        groupPosts.findByPostId(p.getId()).ifPresent(gp -> { map.put("groupId", gp.getGroup().getId()); map.put("groupName", gp.getGroup().getName()); });
        map.put("createdAt", p.getCreatedAt()); return map;
    }
    private Map<String, Object> commentMap(PostComment c) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", c.getId()); map.put("content", c.getContent()); map.put("authorName", c.getAuthor().getFullName());
        map.put("postId", c.getPost().getId()); map.put("parentCommentId", c.getParentComment() == null ? null : c.getParentComment().getId());
        groupPosts.findByPostId(c.getPost().getId()).ifPresent(gp -> map.put("groupId", gp.getGroup().getId()));
        map.put("createdAt", c.getCreatedAt()); return map;
    }
    private <T> List<T> page(List<T> values, int page, int size) {
        int safeSize = Math.max(1, Math.min(size, 50)), from = Math.max(0, page) * safeSize;
        return from >= values.size() ? List.of() : values.subList(from, Math.min(values.size(), from + safeSize));
    }
    private String clean(String value) { return value == null ? "" : value.trim().toLowerCase(); }
    private boolean contains(String value, String q) { return value != null && value.toLowerCase().contains(q); }
}
