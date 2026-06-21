package com.app.backend.service;

import com.app.backend.dto.FriendshipResponse;
import com.app.backend.entity.Friendship;
import com.app.backend.entity.User;
import com.app.backend.repository.FriendshipRepository;
import com.app.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class FriendshipService {

    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public FriendshipService(FriendshipRepository friendshipRepository, UserRepository userRepository, NotificationService notificationService) {
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * Ham gui loi moi ket ban; neu doi phuong da gui truoc thi tu dong chap nhan.
     */
    public FriendshipResponse sendRequest(Long requesterId, Long addresseeId) {
        if (requesterId.equals(addresseeId)) {
            throw new IllegalArgumentException("Cannot send friend request to yourself");
        }
        User requester = findUser(requesterId);
        User addressee = findUser(addresseeId);

        Optional<Friendship> existing = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addresseeId);
        if (existing.isPresent()) {
            Friendship f = existing.get();
            if ("accepted".equals(f.getStatus())) {
                throw new IllegalArgumentException("Already friends");
            }
            if ("pending".equals(f.getStatus())) {
                throw new IllegalArgumentException("Friend request already sent");
            }
        }

        Optional<Friendship> reverse = friendshipRepository.findByRequesterIdAndAddresseeId(addresseeId, requesterId);
        if (reverse.isPresent() && "accepted".equals(reverse.get().getStatus())) {
            throw new IllegalArgumentException("Already friends");
        }
        if (reverse.isPresent() && "pending".equals(reverse.get().getStatus())) {
            return acceptRequest(addresseeId, requesterId);
        }

        Friendship friendship = new Friendship();
        friendship.setRequester(requester);
        friendship.setAddressee(addressee);
        friendship.setStatus("pending");
        Friendship saved = friendshipRepository.save(friendship);
        notificationService.createFriendRequestNotification(requesterId, addresseeId);
        return toResponse(saved);
    }

    /**
     * Ham huy loi moi ket ban do chinh requester da gui.
     */
    public void cancelRequest(Long requesterId, Long addresseeId) {
        Friendship friendship = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addresseeId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Can only cancel pending requests");
        }
        friendshipRepository.delete(friendship);
    }

    /**
     * Ham chap nhan loi moi ket ban theo cap requester/addressee.
     */
    public FriendshipResponse acceptRequest(Long addresseeId, Long requesterId) {
        Friendship friendship = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addresseeId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }
        friendship.setStatus("accepted");
        Friendship saved = friendshipRepository.save(friendship);
        notificationService.createFriendAcceptedNotification(requesterId, addresseeId);
        return toResponse(saved);
    }

    /**
     * Ham tu choi loi moi ket ban theo cap requester/addressee.
     */
    public void rejectRequest(Long addresseeId, Long requesterId) {
        Friendship friendship = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addresseeId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }
        friendshipRepository.delete(friendship);
    }

    /**
     * Ham chap nhan loi moi ket ban bang friendshipId.
     */
    public FriendshipResponse acceptRequestByFriendshipId(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }
        // Chi nguoi nhan loi moi moi duoc chap nhan.
        if (!friendship.getAddressee().getId().equals(userId)) {
            throw new IllegalArgumentException("Only the addressee can accept this request");
        }
        friendship.setStatus("accepted");
        Friendship saved = friendshipRepository.save(friendship);
        notificationService.createFriendAcceptedNotification(
            friendship.getRequester().getId(), 
            friendship.getAddressee().getId()
        );
        return toResponse(saved);
    }

    /**
     * Ham tu choi hoac huy loi moi ket ban bang friendshipId.
     */
    public void rejectOrCancelRequestByFriendshipId(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }
        // Nguoi gui duoc huy, nguoi nhan duoc tu choi.
        boolean isRequester = friendship.getRequester().getId().equals(userId);
        boolean isAddressee = friendship.getAddressee().getId().equals(userId);
        if (!isRequester && !isAddressee) {
            throw new IllegalArgumentException("You can only reject or cancel your own friend requests");
        }
        friendshipRepository.delete(friendship);
    }

    /**
     * Ham huy ket ban bang friendshipId.
     */
    public void unfriendByFriendshipId(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friendship not found"));
        if (!"accepted".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("This is not an accepted friendship");
        }
        // Chi hai nguoi trong moi quan he moi duoc huy ket ban.
        boolean isRequester = friendship.getRequester().getId().equals(userId);
        boolean isAddressee = friendship.getAddressee().getId().equals(userId);
        if (!isRequester && !isAddressee) {
            throw new IllegalArgumentException("You are not part of this friendship");
        }
        friendshipRepository.delete(friendship);
    }

    /**
     * Ham huy ket ban bang cap userId/friendId.
     */
    public void unfriend(Long userId, Long friendId) {
        Friendship friendship = friendshipRepository.findAcceptedByUserId(userId, "accepted").stream()
            .filter(f -> (f.getRequester().getId().equals(userId) && f.getAddressee().getId().equals(friendId))
                      || (f.getRequester().getId().equals(friendId) && f.getAddressee().getId().equals(userId)))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Friendship not found"));
        friendshipRepository.delete(friendship);
    }

    /**
     * Ham lay loi moi ket ban dang cho user xu ly.
     */
    public List<FriendshipResponse> getPendingRequests(Long userId) {
        return friendshipRepository.findByAddresseeIdAndStatusOrderByCreatedAtDesc(userId, "pending")
            .stream().map(this::toResponse).toList();
    }

    /**
     * Ham lay danh sach ban be da accepted.
     */
    public List<FriendshipResponse> getFriends(Long userId) {
        return friendshipRepository.findAcceptedByUserId(userId, "accepted")
            .stream().map(this::toResponse).toList();
    }

    /**
     * Ham lay danh sach id ban be de tao feed/thong bao.
     */
    public List<Long> getFriendIds(Long userId) {
        if (userId == null) return List.of();
        return friendshipRepository.findFriendIdsByUserId(userId);
    }

    /**
     * Ham dem so ban be cua user.
     */
    public long getFriendCount(Long userId) {
        return friendshipRepository.countAcceptedByUserId(userId, "accepted");
    }

    /**
     * Ham lay trang thai ket ban giua viewer va target.
     */
    public String getFriendshipStatus(Long viewerId, Long targetId) {
        if (viewerId == null || targetId == null || viewerId.equals(targetId)) {
            return "self";
        }
        Optional<Friendship> f1 = friendshipRepository.findByRequesterIdAndAddresseeId(viewerId, targetId);
        if (f1.isPresent()) {
            return f1.get().getStatus();
        }
        Optional<Friendship> f2 = friendshipRepository.findByRequesterIdAndAddresseeId(targetId, viewerId);
        if (f2.isPresent()) {
            return "pending".equals(f2.get().getStatus()) ? "pending_incoming" : f2.get().getStatus();
        }
        return "none";
    }

    /**
     * Ham lay ban ghi friendship giua hai user neu co.
     */
    public FriendshipResponse getFriendshipBetween(Long viewerId, Long targetId) {
        if (viewerId == null || targetId == null || viewerId.equals(targetId)) {
            return null;
        }
        return friendshipRepository.findByRequesterIdAndAddresseeId(viewerId, targetId)
            .or(() -> friendshipRepository.findByRequesterIdAndAddresseeId(targetId, viewerId))
            .map(this::toResponse)
            .orElse(null);
    }

    /**
     * Ham tim user dung chung trong service.
     */
    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /**
     * Ham chuyen Friendship entity sang response.
     */
    private FriendshipResponse toResponse(Friendship f) {
        return new FriendshipResponse(
            f.getId(),
            f.getRequester().getId(),
            f.getRequester().getFullName(),
            f.getRequester().getAvatar(),
            f.getAddressee().getId(),
            f.getAddressee().getFullName(),
            f.getAddressee().getAvatar(),
            f.getStatus(),
            f.getCreatedAt(),
            f.getUpdatedAt()
        );
    }
}
