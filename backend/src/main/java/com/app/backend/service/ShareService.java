package com.app.backend.service;

import com.app.backend.dto.PostShareResponse;
import com.app.backend.dto.PostMediaResponse;
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
    private final NotificationService notificationService;
    private final PrivacyAccessService privacyAccessService;
    private final PostMediaRepository postMediaRepository;

    public ShareService(PostShareRepository postShareRepository, PostRepository postRepository, 
                       UserRepository userRepository, GroupRepository groupRepository,
                       NotificationService notificationService, PrivacyAccessService privacyAccessService,
                       PostMediaRepository postMediaRepository) {
        this.postShareRepository = postShareRepository;
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.notificationService = notificationService;
        this.privacyAccessService = privacyAccessService;
        this.postMediaRepository = postMediaRepository;
    }

    /**
     * Ham chia se bai viet ve timeline ca nhan va tao ban ghi lien ket bai goc.
     */
    public PostShareResponse sharePost(Long userId, ShareRequest request) {
        if (request.getTargetGroupId() != null) {
            throw new IllegalArgumentException("Posts can only be shared to your personal timeline");
        }
        // Tim user thuc hien chia se.
        User sharer = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Tim bai goc va kiem tra user co quyen xem bai goc.
        Post originalPost = postRepository.findById(request.getPostId())
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(originalPost, userId);

        // Mot user chi duoc chia se mot bai goc mot lan.
        if (postShareRepository.existsByOriginalPostIdAndSharedByUserId(request.getPostId(), userId)) {
            throw new IllegalArgumentException("You have already shared this post");
        }

        // Noi dung chia se co the rong.
        String shareContent = request.getShareContent() == null ? "" : request.getShareContent().trim();

        // Chuan hoa quyen rieng tu cua bai chia se.
        String shareVisibility = privacyAccessService.normalizeScope(request.getShareVisibility(), PrivacyAccessService.PUBLIC);

        // Tao mot Post moi dai dien cho bai chia se tren timeline.
        Post sharePost = new Post();
        sharePost.setTitle("Bài viết được chia sẻ");
        sharePost.setContent(shareContent);
        sharePost.setVisibility(shareVisibility);
        sharePost.setAuthor(sharer);
        Post savedSharePost = postRepository.save(sharePost);

        // Luu lien ket giua bai chia se va bai goc.
        PostShare share = new PostShare();
        share.setOriginalPost(originalPost);
        share.setSharedBy(sharer);
        share.setShareContent(shareContent);
        share.setShareVisibility(shareVisibility);
        share.setSharedPost(savedSharePost); // Link to the new post

        PostShare savedShare = postShareRepository.save(share);

        // Thong bao cho tac gia bai goc neu nguoi share khac tac gia.
        if (!originalPost.getAuthor().getId().equals(userId)) {
            notificationService.createShareNotification(userId, request.getPostId(), originalPost.getAuthor().getId());
        }

        return toShareResponse(savedShare, userId);
    }

    /**
     * Ham lay cac luot chia se cua mot bai, co kiem tra quyen xem.
     */
    public List<PostShareResponse> getPostShares(Long postId, Long viewerId, int page, int size) {
        return collectVisibleShares(page, size, viewerId, pageable -> postShareRepository.findByOriginalPostId(postId, pageable), false);
    }

    /**
     * Ham dem so luot chia se cua bai viet.
     */
    public long getShareCount(Long postId) {
        return postShareRepository.countByOriginalPostId(postId);
    }

    /**
     * Ham kiem tra user da chia se bai nay chua.
     */
    public boolean hasUserShared(Long postId, Long userId) {
        return postShareRepository.existsByOriginalPostIdAndSharedByUserId(postId, userId);
    }

    /**
     * Ham xoa bai chia se cua chinh user.
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
     * Ham lay cac bai chia se hien tren bang tin.
     */
    public List<PostShareResponse> getSharesForFeed(Long viewerId, int page, int size) {
        if (viewerId == null) {
            // Chua dang nhap thi chi hien chia se public.
            return getPublicShares(page, size);
        }

        return collectVisibleShares(page, size, viewerId, postShareRepository::findTimelineShares, true);
    }

    /**
     * Ham lay cac bai chia se trong nhom.
     */
    public List<PostShareResponse> getGroupShares(Long groupId, Long viewerId, int page, int size) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        privacyAccessService.requireGroupAccess(group, viewerId);

        return collectVisibleShares(page, size, viewerId, pageable -> postShareRepository.findBySharedToGroupId(groupId, pageable), false);
    }

    /**
     * Ham lay cac bai ma mot user da chia se tren profile.
     */
    public List<PostShareResponse> getUserShares(Long userId, Long viewerId, int page, int size) {
        return collectVisibleShares(page, size, viewerId, pageable -> postShareRepository.findBySharedByUserId(userId, pageable), false);
    }

    /**
     * Ham lay share public cho truong hop chua co viewer.
     */
    private List<PostShareResponse> getPublicShares(int page, int size) {
        return collectVisibleShares(page, size, null, postShareRepository::findTimelineShares, false);
    }

    /**
     * Ham chuyen PostShare sang response, an bai goc neu viewer khong co quyen xem.
     */
    private PostShareResponse toShareResponse(PostShare share, Long viewerId) {
        Post originalPost = share.getOriginalPost();
        boolean isOriginalAvailable = privacyAccessService.canViewPost(originalPost, viewerId);
        User originalAuthor = originalPost.getAuthor();
        User sharedBy = share.getSharedBy();
        Group sharedToGroup = share.getSharedToGroup();
        Post sharedPost = share.getSharedPost();

        PostShareResponse response = new PostShareResponse(
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
        if (isOriginalAvailable) {
            response.setOriginalPostPoll(originalPost.isPoll());
            response.setOriginalPostPollEndDate(originalPost.getPollEndDate());
            response.setOriginalPostPollAllowMultiple(originalPost.isPollAllowMultiple());
            response.setOriginalPostMedia(
                postMediaRepository.findByPostIdOrderByMediaOrderAsc(originalPost.getId()).stream()
                    .map(media -> new PostMediaResponse(
                        media.getId(),
                        media.getMediaType(),
                        media.getMediaUrl(),
                        media.getMediaName(),
                        media.getMediaSize(),
                        media.getMediaOrder()
                    ))
                    .toList()
            );
        }
        return response;
    }

    /**
     * Ham gom share co the hien thi, co phan trang va loc theo quyen rieng tu.
     */
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
