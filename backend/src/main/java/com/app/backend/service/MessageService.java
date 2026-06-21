package com.app.backend.service;

import com.app.backend.dto.MessageResponse;
import com.app.backend.entity.Group;
import com.app.backend.entity.GroupMember;
import com.app.backend.entity.Message;
import com.app.backend.entity.User;
import com.app.backend.repository.GroupMemberRepository;
import com.app.backend.repository.GroupRepository;
import com.app.backend.repository.MessageRepository;
import com.app.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final PrivacyAccessService privacyAccessService;
    private final CloudinaryCleanupService cloudCleanup;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository,
                          GroupRepository groupRepository, GroupMemberRepository groupMemberRepository,
                          PrivacyAccessService privacyAccessService, CloudinaryCleanupService cloudCleanup) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.privacyAccessService = privacyAccessService;
        this.cloudCleanup = cloudCleanup;
    }

    /**
     * Ham gui tin nhan ca nhan, kiem tra quyen nhan tin va luu message.
     */
    @Transactional
    public MessageResponse sendMessage(Long senderId, Long receiverId, String content, String mediaUrl) {
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        User receiver = userRepository.findById(receiverId)
            .orElseThrow(() -> new IllegalArgumentException("Receiver not found"));

        if (!privacyAccessService.canMessage(sender, receiver)) {
            throw new IllegalArgumentException("Người dùng này chỉ nhận tin nhắn từ bạn bè");
        }

        if ((content == null || content.trim().isEmpty()) && (mediaUrl == null || mediaUrl.isEmpty())) {
            throw new IllegalArgumentException("Content or image is required");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content == null ? "" : content.trim());
        message.setMediaUrl(mediaUrl);
        message.setIsRead(false);
        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    /**
     * Ham lay toan bo hoi thoai giua hai user.
     */
    public List<MessageResponse> getConversation(Long userId1, Long userId2) {
        return messageRepository.findConversation(userId1, userId2).stream()
            .map(this::toResponse).toList();
    }

    /**
     * Ham lay cac tin nhan chua doc cua user.
     */
    public List<MessageResponse> getUnreadMessages(Long userId) {
        return messageRepository.findUnreadByReceiver(userId).stream()
            .map(this::toResponse).toList();
    }

    /**
     * Ham lay danh sach hoi thoai gan nhat cua user.
     */
    public List<MessageResponse> getConversations(Long userId) {
        return messageRepository.findLatestConversations(userId).stream()
            .map(this::toResponse).toList();
    }

    /**
     * Ham danh dau mot tin nhan da doc.
     */
    @Transactional
    public void markAsRead(Long messageId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        message.setIsRead(true);
        messageRepository.save(message);
    }

    /**
     * Ham danh dau toan bo hoi thoai voi mot user la da doc.
     */
    @Transactional
    public void markConversationAsRead(Long userId, Long otherId) {
        List<Message> unread = messageRepository.findConversation(userId, otherId).stream()
            .filter(m -> m.getReceiver().getId().equals(userId) && Boolean.FALSE.equals(m.getIsRead()))
            .toList();
        for (Message m : unread) {
            m.setIsRead(true);
        }
        messageRepository.saveAll(unread);
    }

    /**
     * Ham thu hoi tin nhan va len lich xoa media neu co.
     */
    @Transactional
    public MessageResponse recallMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
            .orElseThrow(() -> new IllegalArgumentException("Message not found"));
        
        // Chi nguoi gui moi duoc thu hoi tin nhan.
        if (!message.getSender().getId().equals(userId)) {
            throw new IllegalArgumentException("Only the sender can recall this message");
        }
        
        // Khong cho thu hoi lai tin da thu hoi.
        if (Boolean.TRUE.equals(message.getIsRecalled())) {
            throw new IllegalArgumentException("Message is already recalled");
        }

        // Tin nhom chi duoc thu hoi neu nguoi gui van la thanh vien active.
        if (message.getGroup() != null) {
            GroupMember member = groupMemberRepository
                .findByGroupIdAndUserId(message.getGroup().getId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));
            
            if (!"active".equals(member.getStatus())) {
                throw new IllegalArgumentException("You cannot recall messages in this group");
            }
        }
        
        cloudCleanup.schedule(List.of(message.getMediaUrl() == null ? "" : message.getMediaUrl()));
        message.setIsRecalled(true);
        message.setContent("");
        message.setMediaUrl(null);
        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    /**
     * Ham gui tin nhan nhom, co ho tro mention tung nguoi hoac @all.
     */
    @Transactional
    public MessageResponse sendGroupMessage(Long senderId, Long groupId, String content, 
                                            String mediaUrl, List<Long> mentionedUserIds, 
                                            boolean isAllMentioned) {
        User sender = userRepository.findById(senderId)
            .orElseThrow(() -> new IllegalArgumentException("Sender not found"));
        
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Nguoi gui phai la thanh vien active cua nhom.
        GroupMember member = groupMemberRepository
            .findByGroupIdAndUserId(groupId, senderId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!"active".equals(member.getStatus())) {
            throw new IllegalArgumentException("You cannot send messages in this group");
        }

        if ((content == null || content.trim().isEmpty()) && (mediaUrl == null || mediaUrl.isEmpty())) {
            throw new IllegalArgumentException("Content or image is required");
        }

        Message message = new Message();
        message.setSender(sender);
        message.setGroup(group);
        message.setContent(content == null ? "" : content.trim());
        message.setMediaUrl(mediaUrl);
        message.setIsRead(false);
        message.setIsRecalled(false);
        
        // Luu danh sach user duoc mention thanh chuoi id cach nhau bang dau phay.
        if (mentionedUserIds != null && !mentionedUserIds.isEmpty()) {
            message.setMentionedUserIds(String.join(",", mentionedUserIds.stream().map(String::valueOf).toArray(String[]::new)));
        }
        message.setIsAllMentioned(isAllMentioned);

        Message saved = messageRepository.save(message);
        return toResponse(saved);
    }

    /**
     * Ham lay tin nhan nhom theo trang sau khi kiem tra quyen thanh vien.
     */
    public List<MessageResponse> getGroupMessages(Long groupId, Long viewerId, int page, int size) {
        // Nguoi xem phai la thanh vien active cua nhom.
        GroupMember member = groupMemberRepository
            .findByGroupIdAndUserId(groupId, viewerId)
            .orElseThrow(() -> new IllegalArgumentException("Access denied"));

        if (!"active".equals(member.getStatus())) {
            throw new IllegalArgumentException("You cannot view messages in this group");
        }

        var pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        return messageRepository.findByGroupIdOrderByCreatedAtDesc(groupId, pageable)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Ham lay tin nhan nhom moi hon moc thoi gian since.
     */
    public List<MessageResponse> getGroupMessagesSince(Long groupId, Long viewerId, LocalDateTime since) {
        // Nguoi xem phai la thanh vien active cua nhom.
        GroupMember member = groupMemberRepository
            .findByGroupIdAndUserId(groupId, viewerId)
            .orElseThrow(() -> new IllegalArgumentException("Access denied"));

        if (!"active".equals(member.getStatus())) {
            throw new IllegalArgumentException("You cannot view messages in this group");
        }

        return messageRepository.findByGroupIdAndCreatedAtAfter(groupId, since)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Ham chuyen Message entity sang MessageResponse de frontend hien thi.
     */
    private MessageResponse toResponse(Message m) {
        Long receiverId = null;
        String receiverName = null;
        String receiverAvatar = null;
        Long groupId = null;
        String groupName = null;
        String groupAvatar = null;

        if (m.getReceiver() != null) {
            receiverId = m.getReceiver().getId();
            receiverName = m.getReceiver().getFullName();
            receiverAvatar = m.getReceiver().getAvatar();
        }

        if (m.getGroup() != null) {
            groupId = m.getGroup().getId();
            groupName = m.getGroup().getName();
            groupAvatar = m.getGroup().getAvatar();
        }

        return new MessageResponse(
            m.getId(),
            m.getSender().getId(),
            m.getSender().getFullName(),
            m.getSender().getAvatar(),
            receiverId,
            receiverName,
            receiverAvatar,
            groupId,
            groupName,
            groupAvatar,
            m.getContent(),
            m.getMediaUrl(),
            m.getIsRead(),
            m.getIsRecalled(),
            m.getMentionedUserIds(),
            m.getIsAllMentioned(),
            m.getCreatedAt()
        );
    }
}
