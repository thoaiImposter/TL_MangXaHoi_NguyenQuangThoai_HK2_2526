package com.app.backend.service;

import com.app.backend.dto.*;
import com.app.backend.entity.*;
import com.app.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public PostService(PostRepository postRepository, UserRepository userRepository, PostLikeRepository postLikeRepository, PostCommentRepository postCommentRepository, PostMediaRepository postMediaRepository, CommentMediaRepository commentMediaRepository, CommentLikeRepository commentLikeRepository, PostShareRepository postShareRepository, FriendshipService friendshipService, NotificationService notificationService) {
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
    }

    public List<PostFeedResponse> getFeed(Long viewerId, int page, int size) {
        List<Long> friendIds = viewerId != null ? friendshipService.getFriendIds(viewerId) : List.of();
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);
        return postPage.getContent().stream()
            .filter(post -> isPostVisible(post, viewerId, friendIds))
            .map(post -> toFeedResponse(post, viewerId))
            .toList();
    }

    public List<PostFeedResponse> getPostsByUser(Long userId, Long viewerId, int page, int size, boolean personalOnly) {
        List<Long> friendIds = viewerId != null ? friendshipService.getFriendIds(viewerId) : List.of();
        Pageable pageable = PageRequest.of(page, size);
        Page<Post> postPage = personalOnly
            ? postRepository.findPersonalPostsByAuthorId(userId, pageable)
            : postRepository.findByAuthorIdOrderByCreatedAtDesc(userId, pageable);
        return postPage.getContent().stream()
            .filter(post -> isPostVisible(post, viewerId, friendIds))
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
        post.setVisibility(request.getVisibility() == null ? "public" : request.getVisibility().trim().toLowerCase());
        post.setAuthor(author);
        Post saved = postRepository.save(post);
        saveMedia(saved, request.getMedia());
        List<Long> friendIds = friendshipService.getFriendIds(userId);
        for (Long friendId : friendIds) {
            notificationService.createNewPostNotification(userId, saved.getId(), friendId);
        }
        return toResponse(saved);
    }

    public PostResponse updatePost(Long postId, Long userId, PostRequest request) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only edit your own posts");
        }
        post.setContent(request.getContent().trim());
        post.setVisibility(request.getVisibility() == null ? post.getVisibility() : request.getVisibility().trim().toLowerCase());
        Post saved = postRepository.save(post);
        postMediaRepository.deleteAll(postMediaRepository.findByPostIdOrderByMediaOrderAsc(postId));
        saveMedia(saved, request.getMedia());
        return toResponse(saved);
    }

    public void deletePost(Long postId, Long userId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own posts");
        }
        postRepository.delete(post);
    }

    public PostLikeResponse toggleLike(Long postId, Long userId) {
        Post post = postRepository.findById(postId).orElseThrow(() -> new IllegalArgumentException("Post not found"));
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
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        PostComment comment = new PostComment();
        comment.setPost(post);
        comment.setAuthor(user);
        comment.setContent(request.getContent().trim());
        if (request.getParentCommentId() != null) {
            PostComment parent = postCommentRepository.findById(request.getParentCommentId())
                .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));
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
        comment.setContent(content.trim());
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

    public List<PostCommentResponse> getComments(Long postId) {
        return postCommentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(comment -> toCommentResponse(comment, null)).toList();
    }

    public CommentLikeResponse toggleCommentLike(Long commentId, Long userId) {
        postCommentRepository.findById(commentId).orElseThrow(() -> new IllegalArgumentException("Comment not found"));
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
        for (int i = 0; i < media.size(); i++) {
            String item = media.get(i);
            if (item == null || item.isBlank()) continue;
            CommentMedia commentMedia = new CommentMedia();
            commentMedia.setComment(comment);
            commentMedia.setMediaUrl(item);
            commentMedia.setMediaOrder(i);
            commentMediaRepository.save(commentMedia);
        }
    }

    private boolean isPostVisible(Post post, Long viewerId, List<Long> friendIds) {
        String visibility = post.getVisibility();
        Long authorId = post.getAuthor().getId();
        if (viewerId != null && viewerId.equals(authorId)) {
            return true;
        }
        if ("public".equals(visibility)) {
            return true;
        }
        if ("friends".equals(visibility) && friendIds.contains(authorId)) {
            return true;
        }
        return false;
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
            getComments(post.getId(), viewerId),
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
                .map(media -> new CommentMediaResponse(media.getId(), media.getMediaUrl(), media.getMediaOrder()))
                .toList(),
            commentLikeRepository.countByCommentId(comment.getId()),
            viewerId != null && commentLikeRepository.existsByCommentIdAndUserId(comment.getId(), viewerId)
        );
    }

    private List<PostCommentResponse> getComments(Long postId, Long viewerId) {
        return postCommentRepository.findByPostIdOrderByCreatedAtAsc(postId).stream().map(comment -> toCommentResponse(comment, viewerId)).toList();
    }
}
