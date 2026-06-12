package com.app.backend.service;

import com.app.backend.dto.PostShareResponse;
import com.app.backend.dto.ShareRequest;
import com.app.backend.entity.*;
import com.app.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShareService {
    private final PostShareRepository postShareRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final FriendshipService friendshipService;
    private final NotificationService notificationService;

    public ShareService(PostShareRepository postShareRepository, PostRepository postRepository, 
                       UserRepository userRepository, GroupRepository groupRepository,
                       GroupMemberRepository groupMemberRepository, FriendshipService friendshipService,
                       NotificationService notificationService) {
        this.postShareRepository = postShareRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.friendshipService = friendshipService;
        this.notificationService = notificationService;
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

        // Check if already shared by this user
        if (postShareRepository.existsByOriginalPostIdAndSharedByUserId(request.getPostId(), userId)) {
            throw new IllegalArgumentException("You have already shared this post");
        }

        // Validate share content
        String shareContent = request.getShareContent() == null ? "" : request.getShareContent().trim();

        // Validate share visibility
        String shareVisibility = request.getShareVisibility() == null ? "public" : request.getShareVisibility().trim().toLowerCase();
        if (!List.of("public", "friends", "private").contains(shareVisibility)) {
            throw new IllegalArgumentException("Invalid share visibility. Must be: public, friends, or private");
        }

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
        Pageable pageable = PageRequest.of(page, size);
        Page<PostShare> sharesPage = postShareRepository.findByOriginalPostId(postId, pageable);

        return sharesPage.getContent().stream()
            .filter(share -> isShareVisibleToViewer(share, viewerId))
            .map(share -> toShareResponse(share, viewerId))
            .collect(Collectors.toList());
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
    public void deleteShare(Long shareId, Long userId) {
        PostShare share = postShareRepository.findById(shareId)
            .orElseThrow(() -> new IllegalArgumentException("Share not found"));

        if (!share.getSharedBy().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own shares");
        }

        postShareRepository.delete(share);
    }

    /**
     * Get shares in user's feed (shares from friends and public shares)
     */
    public List<PostShareResponse> getSharesForFeed(Long viewerId, int page, int size) {
        if (viewerId == null) {
            // For anonymous users, only show public shares
            return getPublicShares(page, size);
        }

        List<Long> friendIds = friendshipService.getFriendIds(viewerId);
        Pageable pageable = PageRequest.of(page, size);

        // Get shares from friends and public shares
        Page<PostShare> sharesPage = postShareRepository.findAll(pageable);

        return sharesPage.getContent().stream()
            .filter(share -> isShareVisibleToViewer(share, viewerId))
            .map(share -> toShareResponse(share, viewerId))
            .collect(Collectors.toList());
    }

    /**
     * Get shares in a group
     */
    public List<PostShareResponse> getGroupShares(Long groupId, Long viewerId, int page, int size) {
        // Check if user is a member of the group
        boolean isMember = groupMemberRepository.findByGroupIdAndUserId(groupId, viewerId)
            .map(member -> "active".equals(member.getStatus()))
            .orElse(false);

        if (!isMember) {
            Group group = groupRepository.findById(groupId)
                .orElseThrow(() -> new IllegalArgumentException("Group not found"));

            if ("private".equals(group.getPrivacy())) {
                throw new IllegalArgumentException("You must be a member of this group to view shares");
            }
        }

        Pageable pageable = PageRequest.of(page, size);
        Page<PostShare> sharesPage = postShareRepository.findBySharedToGroupId(groupId, pageable);

        return sharesPage.getContent().stream()
            .map(share -> toShareResponse(share, viewerId))
            .collect(Collectors.toList());
    }

    /**
     * Get shares by a specific user (for user profile)
     */
    public List<PostShareResponse> getUserShares(Long userId, Long viewerId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<PostShare> sharesPage = postShareRepository.findBySharedByUserId(userId, pageable);

        return sharesPage.getContent().stream()
            .filter(share -> isShareVisibleToViewer(share, viewerId))
            .map(share -> toShareResponse(share, viewerId))
            .collect(Collectors.toList());
    }

    private List<PostShareResponse> getPublicShares(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        // This would need a custom query - for now return empty
        return List.of();
    }

    /**
     * Check if a share is visible to a viewer based on multiple scope conditions
     */
    private boolean isShareVisibleToViewer(PostShare share, Long viewerId) {
        if (viewerId == null) {
            // Anonymous viewers can only see public shares of public posts
            return "public".equals(share.getShareVisibility()) && 
                   "public".equals(share.getOriginalPost().getVisibility());
        }

        // Owner can always see their own share
        if (share.getSharedBy().getId().equals(viewerId)) {
            return true;
        }

        // Check if original post is accessible to viewer
        if (!isPostAccessibleToViewer(share.getOriginalPost(), viewerId)) {
            return false;
        }

        // Check share visibility
        String shareVisibility = share.getShareVisibility();
        if ("public".equals(shareVisibility)) {
            return true;
        }

        if ("friends".equals(shareVisibility)) {
            List<Long> friendIds = friendshipService.getFriendIds(viewerId);
            return friendIds.contains(share.getSharedBy().getId());
        }

        // Private shares are only visible to the sharer
        return false;
    }

    /**
     * Check if a post is accessible to a viewer
     */
    private boolean isPostAccessibleToViewer(Post post, Long viewerId) {
        // Author can always see their post
        if (post.getAuthor().getId().equals(viewerId)) {
            return true;
        }

        String postVisibility = post.getVisibility();
        if ("public".equals(postVisibility)) {
            return true;
        }

        if ("friends".equals(postVisibility)) {
            List<Long> friendIds = friendshipService.getFriendIds(viewerId);
            return friendIds.contains(post.getAuthor().getId());
        }

        // Private posts are only visible to the author
        return false;
    }

    private PostShareResponse toShareResponse(PostShare share, Long viewerId) {
        // For shares, the original post is always "available" since we show a preview
        // The viewer can always see the share if they have permission to see the share
        boolean isOriginalAvailable = true;
        
        Post originalPost = share.getOriginalPost();
        User originalAuthor = originalPost.getAuthor();
        User sharedBy = share.getSharedBy();
        Group sharedToGroup = share.getSharedToGroup();
        Post sharedPost = share.getSharedPost();

        return new PostShareResponse(
            share.getId(),
            originalPost.getId(),
            originalPost.getTitle(),
            originalPost.getContent(),
            originalPost.getVisibility(),
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
}