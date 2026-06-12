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

    public void cancelRequest(Long requesterId, Long addresseeId) {
        Friendship friendship = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addresseeId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Can only cancel pending requests");
        }
        friendshipRepository.delete(friendship);
    }

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

    public void rejectRequest(Long addresseeId, Long requesterId) {
        Friendship friendship = friendshipRepository.findByRequesterIdAndAddresseeId(requesterId, addresseeId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }
        friendshipRepository.delete(friendship);
    }

    public FriendshipResponse acceptRequestByFriendshipId(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }
        // Only the addressee can accept the request
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

    public void rejectOrCancelRequestByFriendshipId(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friend request not found"));
        if (!"pending".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("Request is not pending");
        }
        // Either the requester can cancel or the addressee can reject
        boolean isRequester = friendship.getRequester().getId().equals(userId);
        boolean isAddressee = friendship.getAddressee().getId().equals(userId);
        if (!isRequester && !isAddressee) {
            throw new IllegalArgumentException("You can only reject or cancel your own friend requests");
        }
        friendshipRepository.delete(friendship);
    }

    public void unfriendByFriendshipId(Long friendshipId, Long userId) {
        Friendship friendship = friendshipRepository.findById(friendshipId)
            .orElseThrow(() -> new IllegalArgumentException("Friendship not found"));
        if (!"accepted".equals(friendship.getStatus())) {
            throw new IllegalArgumentException("This is not an accepted friendship");
        }
        // Check if the user is part of this friendship
        boolean isRequester = friendship.getRequester().getId().equals(userId);
        boolean isAddressee = friendship.getAddressee().getId().equals(userId);
        if (!isRequester && !isAddressee) {
            throw new IllegalArgumentException("You are not part of this friendship");
        }
        friendshipRepository.delete(friendship);
    }

    public void unfriend(Long userId, Long friendId) {
        Friendship friendship = friendshipRepository.findAcceptedByUserId(userId, "accepted").stream()
            .filter(f -> (f.getRequester().getId().equals(userId) && f.getAddressee().getId().equals(friendId))
                      || (f.getRequester().getId().equals(friendId) && f.getAddressee().getId().equals(userId)))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Friendship not found"));
        friendshipRepository.delete(friendship);
    }

    public List<FriendshipResponse> getPendingRequests(Long userId) {
        return friendshipRepository.findByAddresseeIdAndStatusOrderByCreatedAtDesc(userId, "pending")
            .stream().map(this::toResponse).toList();
    }

    public List<FriendshipResponse> getFriends(Long userId) {
        return friendshipRepository.findAcceptedByUserId(userId, "accepted")
            .stream().map(this::toResponse).toList();
    }

    public List<Long> getFriendIds(Long userId) {
        if (userId == null) return List.of();
        return friendshipRepository.findFriendIdsByUserId(userId);
    }

    public long getFriendCount(Long userId) {
        return friendshipRepository.countAcceptedByUserId(userId, "accepted");
    }

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
            return "pending_incoming".equals(f2.get().getStatus()) ? "pending_incoming" : f2.get().getStatus();
        }
        return "none";
    }

    private User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

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
