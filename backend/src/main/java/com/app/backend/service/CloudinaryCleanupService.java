package com.app.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class CloudinaryCleanupService {
    private static final Pattern VERSION = Pattern.compile("(^|/)v\\d+/");

    private final Cloudinary cloudinary;
    private final JdbcTemplate jdbc;

    public CloudinaryCleanupService(Cloudinary cloudinary, JdbcTemplate jdbc) {
        this.cloudinary = cloudinary;
        this.jdbc = jdbc;
    }

    /**
     * Ham gom va len lich xoa toan bo media lien quan den mot user.
     */
    public void scheduleUserAssets(Long userId) {
        Set<String> urls = new LinkedHashSet<>();
        urls.addAll(query("SELECT avatar FROM users WHERE id = ?", userId));
        urls.addAll(query("SELECT cover FROM users WHERE id = ?", userId));
        urls.addAll(query("SELECT avatar FROM `groups` WHERE creator_id = ?", userId));
        urls.addAll(query("SELECT cover FROM `groups` WHERE creator_id = ?", userId));
        urls.addAll(query("""
            SELECT pm.media_url FROM post_media pm JOIN posts p ON p.id = pm.post_id
            WHERE p.author_id = ? OR p.id IN (
                SELECT gp.post_id FROM group_posts gp JOIN `groups` g ON g.id = gp.group_id WHERE g.creator_id = ?
            )
            """, userId, userId));
        urls.addAll(query("""
            SELECT cm.media_url FROM comment_media cm JOIN post_comments pc ON pc.id = cm.comment_id
            WHERE pc.author_id = ? OR pc.post_id IN (
                SELECT p.id FROM posts p WHERE p.author_id = ?
                UNION SELECT gp.post_id FROM group_posts gp JOIN `groups` g ON g.id = gp.group_id WHERE g.creator_id = ?
            )
            """, userId, userId, userId));
        urls.addAll(query("""
            SELECT media_url FROM messages WHERE sender_id = ? OR receiver_id = ?
            OR group_id IN (SELECT id FROM `groups` WHERE creator_id = ?)
            """, userId, userId, userId));
        schedule(urls);
    }

    /**
     * Ham gom va len lich xoa media lien quan den mot nhom.
     */
    public void scheduleGroupAssets(Long groupId) {
        Set<String> urls = new LinkedHashSet<>();
        urls.addAll(query("SELECT avatar FROM `groups` WHERE id = ?", groupId));
        urls.addAll(query("SELECT cover FROM `groups` WHERE id = ?", groupId));
        urls.addAll(query("SELECT media_url FROM messages WHERE group_id = ?", groupId));
        urls.addAll(query("""
            SELECT pm.media_url FROM post_media pm JOIN group_posts gp ON gp.post_id = pm.post_id
            WHERE gp.group_id = ?
            """, groupId));
        urls.addAll(query("""
            SELECT cm.media_url FROM comment_media cm JOIN post_comments pc ON pc.id = cm.comment_id
            JOIN group_posts gp ON gp.post_id = pc.post_id WHERE gp.group_id = ?
            """, groupId));
        schedule(urls);
    }

    /**
     * Ham gom va len lich xoa media cua bai viet va comment trong bai.
     */
    public void schedulePostAssets(Long postId) {
        Set<String> urls = new LinkedHashSet<>();
        urls.addAll(query("SELECT media_url FROM post_media WHERE post_id = ?", postId));
        urls.addAll(query("""
            SELECT cm.media_url FROM comment_media cm JOIN post_comments pc ON pc.id = cm.comment_id
            WHERE pc.post_id = ?
            """, postId));
        schedule(urls);
    }

    /**
     * Ham gom va len lich xoa media cua comment va reply.
     */
    public void scheduleCommentAssets(Long commentId) {
        schedule(query("""
            SELECT cm.media_url FROM comment_media cm JOIN post_comments pc ON pc.id = cm.comment_id
            WHERE pc.id = ? OR pc.parent_comment_id = ?
            """, commentId, commentId));
    }

    /**
     * Ham len lich xoa URL Cloudinary sau khi transaction commit thanh cong.
     */
    public void schedule(Collection<String> urls) {
        Set<String> cleanUrls = new LinkedHashSet<>();
        if (urls != null) {
            urls.stream().filter(url -> url != null && !url.isBlank()).forEach(cleanUrls::add);
        }
        if (cleanUrls.isEmpty()) return;
        Runnable cleanup = () -> cleanUrls.forEach(this::destroyQuietly);
        if (TransactionSynchronizationManager.isActualTransactionActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override public void afterCommit() { cleanup.run(); }
            });
        } else {
            cleanup.run();
        }
    }

    /**
     * Ham query danh sach URL media tu database.
     */
    private List<String> query(String sql, Object... args) {
        return jdbc.query(sql, (rs, rowNum) -> rs.getString(1), args).stream()
            .filter(value -> value != null && !value.isBlank())
            .toList();
    }

    /**
     * Ham xoa mot asset Cloudinary, loi thi chi log de khong lam hong flow chinh.
     */
    private void destroyQuietly(String url) {
        CloudAsset asset = parse(url);
        if (asset == null) return;
        try {
            cloudinary.uploader().destroy(asset.publicId(), ObjectUtils.asMap(
                "resource_type", asset.resourceType(), "invalidate", true
            ));
        } catch (Exception ex) {
            System.err.println("[Cloudinary cleanup] Failed to delete " + asset.publicId() + ": " + ex.getMessage());
        }
    }

    /**
     * Ham tach Cloudinary publicId va resourceType tu URL media.
     */
    private CloudAsset parse(String url) {
        if (url == null || !url.contains("res.cloudinary.com/")) return null;
        for (String resourceType : List.of("image", "video", "raw")) {
            String marker = "/" + resourceType + "/upload/";
            int markerIndex = url.indexOf(marker);
            if (markerIndex < 0) continue;
            String tail = url.substring(markerIndex + marker.length()).split("[?#]", 2)[0];
            Matcher version = VERSION.matcher(tail);
            if (version.find()) tail = tail.substring(version.end());
            tail = URLDecoder.decode(tail, StandardCharsets.UTF_8);
            if (!"raw".equals(resourceType)) {
                int slash = tail.lastIndexOf('/');
                int dot = tail.lastIndexOf('.');
                if (dot > slash) tail = tail.substring(0, dot);
            }
            return tail.isBlank() ? null : new CloudAsset(tail, resourceType);
        }
        return null;
    }

    private record CloudAsset(String publicId, String resourceType) {}
}
