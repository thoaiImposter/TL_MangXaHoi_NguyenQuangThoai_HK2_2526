package com.app.backend.service;

import com.app.backend.entity.Group;
import com.app.backend.entity.GroupMember;
import com.app.backend.entity.GroupPost;
import com.app.backend.entity.Post;
import com.app.backend.entity.PostShare;
import com.app.backend.entity.User;
import com.app.backend.repository.BlockRepository;
import com.app.backend.repository.FriendshipRepository;
import com.app.backend.repository.GroupMemberRepository;
import com.app.backend.repository.GroupPostRepository;
import com.app.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class PrivacyAccessService {
    public static final String PUBLIC = "public";
    public static final String FRIENDS = "friends";
    public static final String PRIVATE = "private";

    private final FriendshipRepository friendshipRepository;
    private final BlockRepository blockRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupPostRepository groupPostRepository;
    private final UserRepository userRepository;

    public PrivacyAccessService(FriendshipRepository friendshipRepository,
                                BlockRepository blockRepository,
                                GroupMemberRepository groupMemberRepository,
                                GroupPostRepository groupPostRepository,
                                UserRepository userRepository) {
        this.friendshipRepository = friendshipRepository;
        this.blockRepository = blockRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupPostRepository = groupPostRepository;
        this.userRepository = userRepository;
    }

    /**
     * Ham chuan hoa quyen rieng tu cua bai viet: public/friends/private.
     */
    public String normalizeScope(String scope, String fallback) {
        String normalized = scope == null ? fallback : scope.trim().toLowerCase();
        if (!PUBLIC.equals(normalized) && !FRIENDS.equals(normalized) && !PRIVATE.equals(normalized)) {
            throw new IllegalArgumentException("Quyền riêng tư không hợp lệ");
        }
        return normalized;
    }

    /**
     * Ham chuan hoa quyen rieng tu cua nhom: public/private.
     */
    public String normalizeGroupPrivacy(String privacy, String fallback) {
        String normalized = privacy == null ? fallback : privacy.trim().toLowerCase();
        if (!PUBLIC.equals(normalized) && !PRIVATE.equals(normalized)) {
            throw new IllegalArgumentException("Quyền riêng tư của nhóm không hợp lệ");
        }
        return normalized;
    }

    /**
     * Ham kiem tra hai user co phai ban be accepted khong.
     */
    public boolean isFriend(Long firstUserId, Long secondUserId) {
        if (firstUserId == null || secondUserId == null || firstUserId.equals(secondUserId)) {
            return false;
        }
        return friendshipRepository.existsByRequesterIdAndAddresseeIdAndStatus(firstUserId, secondUserId, "accepted")
            || friendshipRepository.existsByRequesterIdAndAddresseeIdAndStatus(secondUserId, firstUserId, "accepted");
    }

    /**
     * Ham kiem tra hai user co chan nhau khong.
     */
    public boolean isBlocked(Long firstUserId, Long secondUserId) {
        if (firstUserId == null || secondUserId == null) {
            return false;
        }
        return blockRepository.existsByBlockerIdAndBlockedId(firstUserId, secondUserId)
            || blockRepository.existsByBlockerIdAndBlockedId(secondUserId, firstUserId);
    }

    /**
     * Ham kiem tra viewer co duoc xem bai tren profile cua owner khong.
     */
    public boolean canViewProfilePosts(User owner, Long viewerId) {
        if (isSystemAdmin(viewerId)) {
            return true;
        }
        if (viewerId != null && viewerId.equals(owner.getId())) {
            return true;
        }
        if (viewerId == null || isBlocked(owner.getId(), viewerId)) {
            return false;
        }
        return !Boolean.TRUE.equals(owner.getAccountProtection()) || isFriend(owner.getId(), viewerId);
    }

    /**
     * Ham kiem tra sender co duoc nhan tin cho receiver khong.
     */
    public boolean canMessage(User sender, User receiver) {
        if (sender.getId().equals(receiver.getId()) || isBlocked(sender.getId(), receiver.getId())) {
            return false;
        }
        if ("school_union".equals(sender.getRole()) && "faculty_union".equals(receiver.getRole())) {
            return true;
        }
        return !Boolean.TRUE.equals(receiver.getAccountProtection()) || isFriend(sender.getId(), receiver.getId());
    }

    /**
     * Ham kiem tra viewer co duoc xem nhom khong.
     */
    public boolean canViewGroup(Group group, Long viewerId) {
        if (isSystemAdmin(viewerId)) {
            return true;
        }
        if (PUBLIC.equals(group.getPrivacy())) {
            return true;
        }
        return isActiveGroupMember(group.getId(), viewerId);
    }

    /**
     * Ham kiem tra viewer co duoc xem mot bai viet khong.
     */
    public boolean canViewPost(Post post, Long viewerId) {
        if (isSystemAdmin(viewerId)) {
            return true;
        }
        if (viewerId != null && viewerId.equals(post.getAuthor().getId())) {
            return true;
        }
        if (isBlocked(post.getAuthor().getId(), viewerId)) {
            return false;
        }

        Optional<GroupPost> groupPost = groupPostRepository.findByPostId(post.getId());
        if (groupPost.isPresent()) {
            return canViewGroupPost(groupPost.get(), viewerId);
        }

        if (!canViewProfilePosts(post.getAuthor(), viewerId)) {
            return false;
        }

        return switch (normalizeScope(post.getVisibility(), PUBLIC)) {
            case PUBLIC -> true;
            case FRIENDS -> isFriend(post.getAuthor().getId(), viewerId);
            default -> false;
        };
    }

    /**
     * Ham kiem tra viewer co duoc xem bai viet trong nhom khong.
     */
    public boolean canViewGroupPost(GroupPost groupPost, Long viewerId) {
        if (isSystemAdmin(viewerId)) {
            return true;
        }
        Group group = groupPost.getGroup();
        if (!canViewGroup(group, viewerId)) {
            return false;
        }
        if (Boolean.TRUE.equals(groupPost.getIsApproved())) {
            return true;
        }
        if (viewerId == null) {
            return false;
        }
        if (viewerId.equals(groupPost.getPost().getAuthor().getId())) {
            return true;
        }
        return groupMemberRepository.findByGroupIdAndUserId(group.getId(), viewerId)
            .filter(member -> "active".equals(member.getStatus()))
            .map(GroupMember::isAdmin)
            .orElse(false);
    }

    /**
     * Ham kiem tra viewer co duoc xem mot bai chia se khong.
     */
    public boolean canViewShare(PostShare share, Long viewerId) {
        if (isSystemAdmin(viewerId)) {
            return true;
        }
        if (share.getSharedToGroup() != null) {
            return canViewGroup(share.getSharedToGroup(), viewerId);
        }
        if (viewerId != null && viewerId.equals(share.getSharedBy().getId())) {
            return true;
        }
        if (!canViewProfilePosts(share.getSharedBy(), viewerId)) {
            return false;
        }
        return switch (normalizeScope(share.getShareVisibility(), PUBLIC)) {
            case PUBLIC -> true;
            case FRIENDS -> isFriend(share.getSharedBy().getId(), viewerId);
            default -> false;
        };
    }

    /**
     * Ham bat loi neu viewer khong co quyen xem bai viet.
     */
    public void requirePostAccess(Post post, Long viewerId) {
        if (!canViewPost(post, viewerId)) {
            throw new IllegalArgumentException("Nội dung không tồn tại hoặc bạn không có quyền truy cập");
        }
    }

    /**
     * Ham bat loi neu viewer khong co quyen xem nhom.
     */
    public void requireGroupAccess(Group group, Long viewerId) {
        if (!canViewGroup(group, viewerId)) {
            throw new IllegalArgumentException("Nhóm không tồn tại hoặc bạn không có quyền truy cập");
        }
    }

    /**
     * Ham kiem tra viewer co la thanh vien active cua nhom khong.
     */
    private boolean isActiveGroupMember(Long groupId, Long viewerId) {
        return viewerId != null && groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, viewerId, "active");
    }

    /**
     * Ham kiem tra viewer co phai admin he thong khong.
     */
    private boolean isSystemAdmin(Long viewerId) {
        return viewerId != null && userRepository.findById(viewerId)
            .map(user -> "admin".equals(user.getRole()))
            .orElse(false);
    }
}
