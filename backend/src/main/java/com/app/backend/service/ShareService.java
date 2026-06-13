package com.app.backend.service;

import com.app.backend.dto.PostShareResponse;
import com.app.backend.dto.ShareRequest;
import com.app.backend.entity.*;
import com.app.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class ShareService {
    private final PostShareRepository postShareRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final NotificationService notificationService;
    private final PrivacyAccessService privacyAccessService;

    public ShareService(PostShareRepository postShareRepository, PostRepository postRepository, 
                       UserRepository userRepository, GroupRepository groupRepository,
                       GroupMemberRepository groupMemberRepository,
                       NotificationService notificationService, PrivacyAccessService privacyAccessService) {
        this.postShareRepository = postShareRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.notificationService = notificationService;
        this.privacyAccessService = privacyAccessService;
    }

    /**
     * Share a post to user's own timeline or to a group
     * Creates a new Post that references the original post
     */
    public PostShareResponse sharePost(Long userId, ShareRequest request) {
        // Validate user
        User sharer = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate post
        Post originalPost = postRepository.findById(request.getPostId())
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(originalPost, userId);

        // Check if already shared by this user
        if (postShareRepository.existsByOriginalPostIdAndSharedByUserId(request.getPostId(), userId)) {
            throw new IllegalArgumentException("You have already shared this post");
        }

        // Validate share content
        String shareContent = request.getShareContent() == null ? "" : request.getShareContent().trim();

        // Validate share visibility
        String shareVisibility = privacyAccessService.normalizeScope(request.getShareVisibility(), PrivacyAccessService.PUBLIC);

        // Create a new Post for the share (like Facebook - share creates a new post)
        Post sharePost = new Post();
        sharePost.setTitle("Bài viết được chia sẻ");
        sharePost.setContent(shareContent);
        sharePost.setVisibility(shareVisibility);
        sharePost.setAuthor(sharer);
        Post savedSharePost = postRepository.save(sharePost);

        // Create PostShare record linking to original post
        PostShare share = new PostShare();
        share.setOriginalPost(originalPost);
        share.setSharedBy(sharer);
        share.setShareContent(shareContent);
        share.setShareVisibility(shareVisibility);
        share.setSharedPost(savedSharePost); // Link to the new post

        // Handle group sharing
        if (request.getTargetGroupId() != null) {
            Group targetGroup = groupRepository.findById(request.getTargetGroupId())
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

            // Check if user is a member of the group
            boolean isMember = groupMemberRepository.findByGroupIdAndUserId(request.getTargetGroupId(), userId)
                .map(member -> "active".equals(member.getStatus()))
                .orElse(false);

            if (!isMember) {
                throw new IllegalArgumentException("You must be a member of the group to share posts there");
            }

            share.setSharedToGroup(targetGroup);
            shareVisibility = targetGroup.getPrivacy();
            share.setShareVisibility(shareVisibility);
            savedSharePost.setVisibility(targetGroup.getPrivacy());
            postRepository.save(savedSharePost);
        }

        PostShare savedShare = postShareRepository.save(share);

        // Notify original post author
        if (!originalPost.getAuthor().getId().equals(userId)) {
            notificationService.createShareNotification(userId, request.getPostId(), originalPost.getAuthor().getId());
        }

        return toShareResponse(savedShare, userId);
    }

    /**
     * Get shares for a specific post with visibility check
     */
    public List<PostShareResponse> getPostShares(Long postId, Long viewerId, int page, int size) {
        return collectVisibleShares(page, size, viewerId, pageable -> postShareRepository.findByOriginalPostId(postId, pageable), false);
    }

    /**
     * Get share count for a post
     */
    public long getShareCount(Long postId) {
        return postShareRepository.countByOriginalPostId(postId);
    }

    /**
     * Check if a user has shared a specific post
     */
    public boolean hasUserShared(Long postId, Long userId) {
        return postShareRepository.existsByOriginalPostIdAndSharedByUserId(postId, userId);
    }

    /**
     * Delete a share
     */
    @Transactional
    public void deleteShare(Long shareId, Long userId) {
        PostShare share = postShareRepository.findById(shareId)
            .orElseThrow(() -> new IllegalArgumentException("Share not found"));

        if (!share.getSharedBy().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own shares");
        }

        Post sharedPost = share.getSharedPost();
        postShareRepository.delete(share);
        postShareRepository.flush();
        if (sharedPost != null) {
            postRepository.delete(sharedPost);
        }
    }

    /**
     * Get shares in user's feed (shares from friends and public shares)
     */
    public List<PostShareResponse> getSharesForFeed(Long viewerId, int page, int size) {
        if (viewerId == null) {
            // For anonymous users, only show public shares
            return getPublicShares(page, size);
        }

        return collectVisibleShares(page, size, viewerId, postShareRepository::findTimelineShares, true);
    }

    /**
     * Get shares in a group
     */
    public List<PostShareResponse> getGroupShares(Long groupId, Long viewerId, int page, int size) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        privacyAccessService.requireGroupAccess(group, viewerId);

        return collectVisibleShares(page, size, viewerId, pageable -> postShareRepository.findBySharedToGroupId(groupId, pageable), false);
    }

    /**
     * Get shares by a specific user (for user profile)
     */
    public List<PostShareResponse> getUserShares(Long userId, Long viewerId, int page, int size) {
        return collectVisibleShares(page, size, viewerId, pageable -> postShareRepository.findBySharedByUserId(userId, pageable), false);
    }

    private List<PostShareResponse> getPublicShares(int page, int size) {
        return collectVisibleShares(page, size, null, postShareRepository::findTimelineShares, false);
    }

    private PostShareResponse toShareResponse(PostShare share, Long viewerId) {
        Post originalPost = share.getOriginalPost();
        boolean isOriginalAvailable = privacyAccessService.canViewPost(originalPost, viewerId);
        User originalAuthor = originalPost.getAuthor();
        User sharedBy = share.getSharedBy();
        Group sharedToGroup = share.getSharedToGroup();
        Post sharedPost = share.getSharedPost();

        return new PostShareResponse(
            share.getId(),
            originalPost.getId(),
            isOriginalAvailable ? originalPost.getTitle() : null,
            isOriginalAvailable ? originalPost.getContent() : null,
            isOriginalAvailable ? originalPost.getVisibility() : null,
            originalAuthor.getId(),
            originalAuthor.getFullName(),
            originalAuthor.getAvatar(),
            sharedPost != null ? sharedPost.getId() : null,
            share.getShareContent(),
            share.getShareVisibility(),
            sharedBy.getId(),
            sharedBy.getFullName(),
            sharedBy.getAvatar(),
            sharedToGroup != null ? sharedToGroup.getId() : null,
            sharedToGroup != null ? sharedToGroup.getName() : null,
            share.getCreatedAt(),
            isOriginalAvailable
        );
    }

    private List<PostShareResponse> collectVisibleShares(
            int requestedPage,
            int requestedSize,
            Long viewerId,
            Function<Pageable, Page<PostShare>> loader,
            boolean excludeViewerShares) {
        int size = Math.max(1, Math.min(requestedSize, 50));
        int start = Math.max(0, requestedPage) * size;
        int required = start + size;
        int scanPage = 0;
        int scanSize = Math.max(25, size * 2);
        List<PostShare> visible = new ArrayList<>();

        while (visible.size() < required) {
            Page<PostShare> batch = loader.apply(PageRequest.of(scanPage, scanSize));
            batch.getContent().stream()
                .filter(share -> !excludeViewerShares || viewerId == null || !viewerId.equals(share.getSharedBy().getId()))
                .filter(share -> privacyAccessService.canViewShare(share, viewerId))
                .forEach(visible::add);
            if (!batch.hasNext()) break;
            scanPage++;
        }
        if (start >= visible.size()) return List.of();
        return visible.subList(start, Math.min(required, visible.size())).stream()
            .map(share -> toShareResponse(share, viewerId))
            .collect(Collectors.toList());
    }
}
