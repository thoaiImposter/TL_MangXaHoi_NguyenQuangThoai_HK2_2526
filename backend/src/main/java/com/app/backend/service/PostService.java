package com.app.backend.service;

import com.app.backend.dto.*;
import com.app.backend.entity.*;
import com.app.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.ArrayList;
import java.util.function.Function;

@Service
public class PostService {
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final PostMediaRepository postMediaRepository;
    private final CommentMediaRepository commentMediaRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final PostShareRepository postShareRepository;
    private final FriendshipService friendshipService;
    private final NotificationService notificationService;
    private final PrivacyAccessService privacyAccessService;

    public PostService(PostRepository postRepository, UserRepository userRepository, PostLikeRepository postLikeRepository, PostCommentRepository postCommentRepository, PostMediaRepository postMediaRepository, CommentMediaRepository commentMediaRepository, CommentLikeRepository commentLikeRepository, PostShareRepository postShareRepository, FriendshipService friendshipService, NotificationService notificationService, PrivacyAccessService privacyAccessService) {
        this.postRepository = postRepository;
        this.userRepository = userRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.postMediaRepository = postMediaRepository;
        this.commentMediaRepository = commentMediaRepository;
        this.commentLikeRepository = commentLikeRepository;
        this.postShareRepository = postShareRepository;
        this.friendshipService = friendshipService;
        this.notificationService = notificationService;
        this.privacyAccessService = privacyAccessService;
    }

    public List<PostFeedResponse> getFeed(Long viewerId, int page, int size) {
        return collectVisiblePosts(page, size, viewerId, postRepository::findTimelineCandidates, true);
    }

    public List<PostFeedResponse> getPostsByUser(Long userId, Long viewerId, int page, int size, boolean personalOnly) {
        User owner = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!privacyAccessService.canViewProfilePosts(owner, viewerId)) {
            return List.of();
        }
        Function<Pageable, Page<Post>> loader = personalOnly
            ? pageable -> postRepository.findPersonalPostsByAuthorId(userId, pageable)
            : pageable -> postRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable);
        return collectVisiblePosts(page, size, viewerId, loader, false);
    }

    private List<PostFeedResponse> collectVisiblePosts(
            int requestedPage,
            int requestedSize,
            Long viewerId,
            Function<Pageable, Page<Post>> loader,
            boolean excludeViewerPosts) {
        int size = Math.max(1, Math.min(requestedSize, 50));
        int start = Math.max(0, requestedPage) * size;
        int required = start + size;
        int scanPage = 0;
        int scanSize = Math.max(25, size * 2);
        List<Post> visible = new ArrayList<>();

        while (visible.size() < required) {
            Page<Post> batch = loader.apply(PageRequest.of(scanPage, scanSize));
            batch.getContent().stream()
                .filter(post -> !excludeViewerPosts || viewerId == null || !viewerId.equals(post.getAuthor().getId()))
                .filter(post -> privacyAccessService.canViewPost(post, viewerId))
                .forEach(visible::add);
            if (!batch.hasNext()) break;
            scanPage++;
        }
        if (start >= visible.size()) return List.of();
        return visible.subList(start, Math.min(required, visible.size())).stream()
            .map(post -> toFeedResponse(post, viewerId))
            .toList();
    }

    public PostResponse createPost(Long userId, PostRequest request) {
        User author = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isEmpty() && (request.getMedia() == null || request.getMedia().isEmpty())) {
            throw new IllegalArgumentException("Content or image is required");
        }
        Post post = new Post();
        post.setTitle("Bài viết");
        post.setContent(content);
        post.setVisibility(privacyAccessService.normalizeScope(request.getVisibility(), PrivacyAccessService.PUBLIC));
        post.setAuthor(author);
        Post saved = postRepository.save(post);
        saveMedia(saved, request.getMedia());
        if (!PrivacyAccessService.PRIVATE.equals(saved.getVisibility())) {
            List<Long> friendIds = friendshipService.getFriendIds(userId);
            for (Long friendId : friendIds) {
                notificationService.createNewPostNotification(userId, saved.getId(), friendId);
            }
        }
        return toResponse(saved);
    }

    public PostResponse updatePost(Long postId, Long userId, PostRequest request) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own posts");
        }
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isEmpty() && (request.getMedia() == null || request.getMedia().isEmpty())) {
            throw new IllegalArgumentException("Bài viết cần có nội dung hoặc tệp đính kèm");
        }
        post.setContent(content);
        post.setVisibility(privacyAccessService.normalizeScope(request.getVisibility(), post.getVisibility()));
        Post saved = postRepository.save(post);
        postMediaRepository.deleteAll(postMediaRepository.findByPostIdOrderByMediaOrderAsc(postId));
        saveMedia(saved, request.getMedia());
        return toResponse(saved);
    }

    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own posts");
        }
        postRepository.delete(post);
    }

    public PostLikeResponse toggleLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return postLikeRepository.findByPostIdAndUserId(postId, userId)
            .map(existing -> {
                postLikeRepository.delete(existing);
                return new PostLikeResponse(postId, postLikeRepository.countByPostId(postId), false);
            })
            .orElseGet(() -> {
                PostLike like = new PostLike();
                like.setPost(postRepository.getReferenceById(postId));
                like.setUser(user);
                postLikeRepository.save(like);
                notificationService.createPostLikeNotification(userId, postId, post.getAuthor().getId());
                return new PostLikeResponse(postId, postLikeRepository.countByPostId(postId), true);
            });
    }

    public PostCommentResponse addComment(Long postId, Long userId, PostCommentRequest request) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        String content = request.getContent() == null ? "" : request.getContent().trim();
        if (content.isEmpty() && (request.getMedia() == null || request.getMedia().isEmpty())) {
            throw new IllegalArgumentException("Bình luận cần có nội dung hoặc ảnh đính kèm");
        }
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setAuthor(user);
        comment.setContent(content);
        if (request.getParentCommentId() != null) {
            PostComment parent = postCommentRepository.findById(request.getParentCommentId())
                .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
            if (!parent.getPost().getId().equals(postId)) {
                throw new IllegalArgumentException("Bình luận trả lời không thuộc bài viết này");
            }
            comment.setParentComment(parent);
        }
        PostComment saved = postCommentRepository.save(comment);
        saveCommentMedia(saved, request.getMedia());
        notificationService.createPostCommentNotification(userId, postId, post.getAuthor().getId());
        return toCommentResponse(saved, null);
    }

    public PostCommentResponse updateComment(Long commentId, Long userId, String content) {
        PostComment comment = postCommentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own comments");
        }
        String normalizedContent = content == null ? "" : content.trim();
        if (normalizedContent.isEmpty()) {
            throw new IllegalArgumentException("Nội dung bình luận không được để trống");
        }
        comment.setContent(normalizedContent);
        PostComment saved = postCommentRepository.save(comment);
        return toCommentResponse(saved, null);
    }

    public void deleteComment(Long commentId, Long userId) {
        PostComment comment = postCommentRepository.findById(commentId)
            .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        if (!comment.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }
        postCommentRepository.delete(comment);
    }

    public List<PostCommentResponse> getComments(Long postId, Long viewerId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(post, viewerId);
        return postCommentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(comment -> toCommentResponse(comment, viewerId)).toList();
    }

    public CommentLikeResponse toggleCommentLike(Long commentId, Long userId) {
        PostComment comment = postCommentRepository.findById(commentId).orElseThrow(() -> new IllegalArgumentException("Comment not found"));
        privacyAccessService.requirePostAccess(comment.getPost(), userId);
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        return commentLikeRepository.findByCommentIdAndUserId(commentId, userId)
            .map(existing -> {
                commentLikeRepository.delete(existing);
                return new CommentLikeResponse(commentId, commentLikeRepository.countByCommentId(commentId), false);
            })
            .orElseGet(() -> {
                CommentLike like = new CommentLike();
                like.setComment(postCommentRepository.getReferenceById(commentId));
                like.setUser(user);
                commentLikeRepository.save(like);
                return new CommentLikeResponse(commentId, commentLikeRepository.countByCommentId(commentId), true);
            });
    }

    private void saveMedia(Post post, List<java.util.Map<String, Object>> media) {
        if (media == null || media.isEmpty()) return;
        for (int i = 0; i < media.size(); i++) {
            java.util.Map<String, Object> item = media.get(i);
            if (item == null) continue;
            
            String url = getStringFromMap(item, "url");
            if (url == null || url.isBlank()) {
                // Fallback: try "mediaUrl" key
                url = getStringFromMap(item, "mediaUrl");
            }
            if (url == null || url.isBlank()) continue;
            
            String type = getStringFromMap(item, "type");
            if (type == null || type.isBlank()) {
                type = getStringFromMap(item, "mediaType");
            }
            if (type == null || type.isBlank()) {
                // Auto-detect from URL
                type = detectMediaTypeFromUrl(url);
            }
            
            String name = getStringFromMap(item, "name");
            if (name == null || name.isBlank()) {
                name = getStringFromMap(item, "mediaName");
            }
            
            Long size = getLongFromMap(item, "size");
            if (size == null) {
                size = getLongFromMap(item, "mediaSize");
            }
            
            PostMedia postMedia = new PostMedia();
            postMedia.setPost(post);
            postMedia.setMediaUrl(url);
            postMedia.setMediaType(type);
            postMedia.setMediaName(name);
            postMedia.setMediaSize(size);
            postMedia.setMediaOrder(i);
            postMediaRepository.save(postMedia);
        }
    }

    private String getStringFromMap(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val != null ? val.toString() : null;
    }

    private Long getLongFromMap(java.util.Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val == null) return null;
        if (val instanceof Number) return ((Number) val).longValue();
        try { return Long.parseLong(val.toString()); } catch (Exception e) { return null; }
    }

    private String detectMediaTypeFromUrl(String url) {
        if (url == null) return "file";
        if (url.startsWith("data:image")) return "image";
        if (url.startsWith("data:video")) return "video";
        String lower = url.toLowerCase();
        if (lower.matches(".*\\.(mp4|webm|ogg|ogv|avi|mov|wmv|flv|mkv|3gp|m4v|m2ts?|vob)$")) return "video";
        if (lower.matches(".*\\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff|heic)$")) return "image";
        return "file";
    }

    private void saveCommentMedia(PostComment comment, List<String> media) {
        if (media == null || media.isEmpty()) return;
        for (int i = 0; i < Math.min(media.size(), 1); i++) {
            String item = media.get(i);
            if (item == null || item.isBlank()) continue;
            CommentMedia commentMedia = new CommentMedia();
            commentMedia.setComment(comment);
            commentMedia.setMediaUrl(item);
            commentMedia.setMediaType(detectMediaTypeFromUrl(item));
            commentMedia.setMediaOrder(i);
            commentMediaRepository.save(commentMedia);
        }
    }

    public PostFeedResponse getPost(Long postId, Long viewerId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(post, viewerId);
        return toFeedResponse(post, viewerId);
    }

    private PostFeedResponse toFeedResponse(Post post, Long viewerId) {
        long likeCount = postLikeRepository.countByPostId(post.getId());
        long commentCount = postCommentRepository.countByPostId(post.getId());
        long shareCount = postShareRepository.countByOriginalPostId(post.getId());
        boolean likedByMe = viewerId != null && postLikeRepository.existsByPostIdAndUserId(post.getId(), viewerId);
        boolean hasSharedByMe = viewerId != null && postShareRepository.existsByOriginalPostIdAndSharedByUserId(post.getId(), viewerId);
        return new PostFeedResponse(
            post.getId(),
            post.getTitle(),
            post.getContent(),
            post.getVisibility(),
            post.getAuthor().getId(),
            post.getAuthor().getFullName(),
            post.getAuthor().getAvatar(),
            post.getCreatedAt(),
            post.getUpdatedAt(),
            likeCount,
            commentCount,
            shareCount,
            likedByMe,
            hasSharedByMe,
            mapComments(post.getId(), viewerId),
            postMediaRepository.findByPostIdOrderByMediaOrderAsc(post.getId()).stream()
                .map(media -> new PostMediaResponse(media.getId(), media.getMediaType(), media.getMediaUrl(), media.getMediaName(), media.getMediaSize(), media.getMediaOrder()))
                .toList(),
            post.isPoll(),
            post.getPollEndDate(),
            post.isPollAllowMultiple()
        );
    }

    private PostResponse toResponse(Post post) {
        return new PostResponse(
            post.getId(),
            post.getTitle(),
            post.getContent(),
            post.getVisibility(),
            post.getAuthor().getId(),
            post.getAuthor().getFullName(),
            post.getAuthor().getAvatar(),
            post.getCreatedAt(),
            post.getUpdatedAt()
        );
    }

    private PostCommentResponse toCommentResponse(PostComment comment, Long viewerId) {
        return new PostCommentResponse(
            comment.getId(),
            comment.getPost().getId(),
            comment.getAuthor().getId(),
            comment.getAuthor().getFullName(),
            comment.getAuthor().getAvatar(),
            comment.getContent(),
            comment.getCreatedAt(),
            comment.getParentComment() != null ? comment.getParentComment().getId() : null,
            commentMediaRepository.findByCommentIdOrderByMediaOrderAsc(comment.getId()).stream()
                .map(media -> new CommentMediaResponse(media.getId(), media.getMediaType(), media.getMediaUrl(), media.getMediaName(), media.getMediaOrder()))
                .toList(),
            commentLikeRepository.countByCommentId(comment.getId()),
            viewerId != null && commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), viewerId)
        );
    }

    private List<PostCommentResponse> mapComments(Long postId, Long viewerId) {
        return postCommentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(comment -> toCommentResponse(comment, viewerId)).toList();
    }
}
