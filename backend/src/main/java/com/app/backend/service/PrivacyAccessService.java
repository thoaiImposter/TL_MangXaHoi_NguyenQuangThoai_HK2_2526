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

    public PrivacyAccessService(FriendshipRepository friendshipRepository,
                                BlockRepository blockRepository,
                                GroupMemberRepository groupMemberRepository,
                                GroupPostRepository groupPostRepository) {
        this.friendshipRepository = friendshipRepository;
        this.blockRepository = blockRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupPostRepository = groupPostRepository;
    }

    public String normalizeScope(String scope, String fallback) {
        String normalized = scope == null ? fallback : scope.trim().toLowerCase();
        if (!PUBLIC.equals(normalized) && !FRIENDS.equals(normalized) && !PRIVATE.equals(normalized)) {
            throw new IllegalArgumentException("Quyền riêng tư không hợp lệ");
        }
        return normalized;
    }

    public String normalizeGroupPrivacy(String privacy, String fallback) {
        String normalized = privacy == null ? fallback : privacy.trim().toLowerCase();
        if (!PUBLIC.equals(normalized) && !PRIVATE.equals(normalized)) {
            throw new IllegalArgumentException("Quyền riêng tư của nhóm không hợp lệ");
        }
        return normalized;
    }

    public boolean isFriend(Long firstUserId, Long secondUserId) {
        if (firstUserId == null || secondUserId == null || firstUserId.equals(secondUserId)) {
            return false;
        }
        return friendshipRepository.existsByRequesterIdAndAddresseeIdAndStatus(firstUserId, secondUserId, "accepted")
            || friendshipRepository.existsByRequesterIdAndAddresseeIdAndStatus(secondUserId, firstUserId, "accepted");
    }

    public boolean isBlocked(Long firstUserId, Long secondUserId) {
        if (firstUserId == null || secondUserId == null) {
            return false;
        }
        return blockRepository.existsByBlockerIdAndBlockedId(firstUserId, secondUserId)
            || blockRepository.existsByBlockerIdAndBlockedId(secondUserId, firstUserId);
    }

    public boolean canViewProfilePosts(User owner, Long viewerId) {
        if (viewerId != null && viewerId.equals(owner.getId())) {
            return true;
        }
        if (viewerId == null || isBlocked(owner.getId(), viewerId)) {
            return false;
        }
        return !Boolean.TRUE.equals(owner.getAccountProtection()) || isFriend(owner.getId(), viewerId);
    }

    public boolean canMessage(User sender, User receiver) {
        if (sender.getId().equals(receiver.getId()) || isBlocked(sender.getId(), receiver.getId())) {
            return false;
        }
        return !Boolean.TRUE.equals(receiver.getAccountProtection()) || isFriend(sender.getId(), receiver.getId());
    }

    public boolean canViewGroup(Group group, Long viewerId) {
        if (PUBLIC.equals(group.getPrivacy())) {
            return true;
        }
        return isActiveGroupMember(group.getId(), viewerId);
    }

    public boolean canViewPost(Post post, Long viewerId) {
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

    public boolean canViewGroupPost(GroupPost groupPost, Long viewerId) {
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

    public boolean canViewShare(PostShare share, Long viewerId) {
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

    public void requirePostAccess(Post post, Long viewerId) {
        if (!canViewPost(post, viewerId)) {
            throw new IllegalArgumentException("Nội dung không tồn tại hoặc bạn không có quyền truy cập");
        }
    }

    public void requireGroupAccess(Group group, Long viewerId) {
        if (!canViewGroup(group, viewerId)) {
            throw new IllegalArgumentException("Nhóm không tồn tại hoặc bạn không có quyền truy cập");
        }
    }

    private boolean isActiveGroupMember(Long groupId, Long viewerId) {
        return viewerId != null && groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, viewerId, "active");
    }
}
