package com.app.backend.service;

import com.app.backend.dto.NotificationResponse;
import com.app.backend.entity.Notification;
import com.app.backend.entity.User;
import com.app.backend.repository.NotificationRepository;
import com.app.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public void createFriendRequestNotification(Long requesterId, Long addresseeId) {
        User requester = findUser(requesterId);
        User addressee = findUser(addresseeId);
        Notification n = new Notification();
        n.setRecipient(addressee);
        n.setActor(requester);
        n.setType("FRIEND_REQUEST");
        n.setMessage(requester.getFullName() + " đã gửi lờI mờI kết bạn");
        n.setTargetType("user");
        n.setTargetId(requesterId);
        notificationRepository.save(n);
    }

    @Transactional
    public void createFriendAcceptedNotification(Long requesterId, Long addresseeId) {
        User requester = findUser(requesterId);
        User addressee = findUser(addresseeId);
        Notification n = new Notification();
        n.setRecipient(requester);
        n.setActor(addressee);
        n.setType("FRIEND_ACCEPTED");
        n.setMessage(addressee.getFullName() + " đã chấp nhận lờI mờI kết bạn");
        n.setTargetType("user");
        n.setTargetId(addresseeId);
        notificationRepository.save(n);
    }

    @Transactional
    public void createPostLikeNotification(Long actorId, Long postId, Long postAuthorId) {
        if (actorId.equals(postAuthorId)) return;
        User actor = findUser(actorId);
        User recipient = findUser(postAuthorId);
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setActor(actor);
        n.setType("POST_LIKE");
        n.setMessage(actor.getFullName() + " đã thích bài viết của bạn");
        n.setTargetType("post");
        n.setTargetId(postId);
        notificationRepository.save(n);
    }

    @Transactional
    public void createPostCommentNotification(Long actorId, Long postId, Long postAuthorId) {
        if (actorId.equals(postAuthorId)) return;
        User actor = findUser(actorId);
        User recipient = findUser(postAuthorId);
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setActor(actor);
        n.setType("POST_COMMENT");
        n.setMessage(actor.getFullName() + " đã bình luận bài viết của bạn");
        n.setTargetType("post");
        n.setTargetId(postId);
        notificationRepository.save(n);
    }

    @Transactional
    public void createNewPostNotification(Long authorId, Long postId, Long friendId) {
        if (authorId.equals(friendId)) return;
        User author = findUser(authorId);
        User recipient = findUser(friendId);
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setActor(author);
        n.setType("NEW_POST");
        n.setMessage(author.getFullName() + " đã đăng một bài viết mới");
        n.setTargetType("post");
        n.setTargetId(postId);
        notificationRepository.save(n);
    }

    @Transactional
    public void createShareNotification(Long actorId, Long postId, Long postAuthorId) {
        if (actorId.equals(postAuthorId)) return;
        User actor = findUser(actorId);
        User recipient = findUser(postAuthorId);
        Notification n = new Notification();
        n.setRecipient(recipient);
        n.setActor(actor);
        n.setType("POST_SHARE");
        n.setMessage(actor.getFullName() + " đã chia sẻ bài viết của bạn");
        n.setTargetType("post");
        n.setTargetId(postId);
        notificationRepository.save(n);
    }

    public List<NotificationResponse> getNotifications(Long recipientId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(recipientId).stream()
                .map(this::toResponse).toList();
    }

    public long getUnreadCount(Long recipientId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(recipientId);
    }

    @Transactional
    public void markAsRead(Long notificationId, Long currentUserId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found"));
        if (!n.getRecipient().getId().equals(currentUserId)) {
            throw new IllegalArgumentException("You cannot update another user's notification");
        }
        n.setIsRead(true);
        notificationRepository.save(n);
    }

    @Transactional
    public void markAllAsRead(Long recipientId) {
        notificationRepository.markAllAsReadByRecipientId(recipientId);
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private NotificationResponse toResponse(Notification n) {
        return new NotificationResponse(
                n.getId(),
                n.getActor().getId(),
                n.getActor().getFullName(),
                n.getActor().getAvatar(),
                n.getType(),
                n.getMessage(),
                n.getTargetType(),
                n.getTargetId(),
                n.getIsRead(),
                n.getCreatedAt()
        );
    }
}
