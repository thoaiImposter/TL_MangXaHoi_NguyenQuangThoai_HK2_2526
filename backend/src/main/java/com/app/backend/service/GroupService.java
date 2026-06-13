package com.app.backend.service;

import com.app.backend.dto.*;
import com.app.backend.entity.*;
import com.app.backend.repository.*;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class GroupService {

    private final GroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupPostRepository groupPostRepository;
    private final GroupJoinRequestRepository groupJoinRequestRepository;
    private final GroupNotificationRepository groupNotificationRepository;
    private final GroupBanRepository groupBanRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostCommentRepository postCommentRepository;
    private final CommentMediaRepository commentMediaRepository;
    private final PostMediaRepository postMediaRepository;
    private final PollOptionRepository pollOptionRepository;
    private final PrivacyAccessService privacyAccessService;

    public GroupService(GroupRepository groupRepository,
                       GroupMemberRepository groupMemberRepository,
                       GroupPostRepository groupPostRepository,
                       GroupJoinRequestRepository groupJoinRequestRepository,
                       GroupNotificationRepository groupNotificationRepository,
                       GroupBanRepository groupBanRepository,
                       UserRepository userRepository,
                       PostRepository postRepository,
                       PostLikeRepository postLikeRepository,
                       PostCommentRepository postCommentRepository,
                       CommentMediaRepository commentMediaRepository,
                       PostMediaRepository postMediaRepository,
                       PollOptionRepository pollOptionRepository,
                       PrivacyAccessService privacyAccessService) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupPostRepository = groupPostRepository;
        this.groupJoinRequestRepository = groupJoinRequestRepository;
        this.groupNotificationRepository = groupNotificationRepository;
        this.groupBanRepository = groupBanRepository;
        this.userRepository = userRepository;
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.postCommentRepository = postCommentRepository;
        this.commentMediaRepository = commentMediaRepository;
        this.postMediaRepository = postMediaRepository;
        this.pollOptionRepository = pollOptionRepository;
        this.privacyAccessService = privacyAccessService;
    }

    // ==================== Group CRUD Operations ====================

    public GroupResponse createGroup(Long userId, GroupRequest request) {
        // Validate userId
        if (userId == null || userId <= 0) {
            throw new IllegalArgumentException("Invalid user ID");
        }
        
        User creator = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate group name
        if (request.name() == null || request.name().trim().isEmpty()) {
            throw new IllegalArgumentException("Group name is required");
        }

        Group group = new Group();
        group.setName(request.name().trim());
        group.setDescription(request.description() != null ? request.description().trim() : "");
        group.setAvatar(request.avatar());
        group.setCover(request.cover());
        group.setPrivacy(privacyAccessService.normalizeGroupPrivacy(request.privacy(), PrivacyAccessService.PUBLIC));
        group.setApprovalRequired(request.approvalRequired() != null ? request.approvalRequired() : false);
        group.setCreator(creator);

        Group savedGroup = groupRepository.save(group);

        // Add creator as gold key member
        GroupMember creatorMember = new GroupMember();
        creatorMember.setGroup(savedGroup);
        creatorMember.setUser(creator);
        creatorMember.setRole("gold_key");
        creatorMember.setStatus("active");
        groupMemberRepository.save(creatorMember);

        return toGroupResponse(savedGroup);
    }

    public GroupResponse getGroup(Long groupId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        return toGroupResponse(group);
    }

    public GroupResponse updateGroup(Long groupId, Long userId, GroupRequest request) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Check if user is admin
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!member.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can update group settings");
        }

        if (request.name() != null) {
            group.setName(request.name().trim());
        }
        if (request.description() != null) {
            group.setDescription(request.description().trim());
        }
        if (request.avatar() != null) {
            group.setAvatar(request.avatar());
        }
        if (request.cover() != null) {
            group.setCover(request.cover());
        }
        if (request.privacy() != null) {
            group.setPrivacy(privacyAccessService.normalizeGroupPrivacy(request.privacy(), group.getPrivacy()));
        }
        if (request.approvalRequired() != null) {
            group.setApprovalRequired(request.approvalRequired());
        }

        Group savedGroup = groupRepository.save(group);
        return toGroupResponse(savedGroup);
    }

    public void deleteGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Only the creator (gold key) can delete the group
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!member.isGoldKey()) {
            throw new IllegalArgumentException("Only the group creator can delete the group");
        }

        groupRepository.delete(group);
    }

    // ==================== Group Discovery ====================

    public List<GroupResponse> getPublicGroups(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groupPage = groupRepository.findPublicGroups(pageable);
        return groupPage.getContent().stream().map(this::toGroupResponse).toList();
    }

    public List<GroupResponse> getUserGroups(Long userId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groupPage = groupRepository.findUserGroups(userId, pageable);
        return groupPage.getContent().stream().map(this::toGroupResponse).toList();
    }

    public List<GroupResponse> searchGroups(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Group> groupPage = groupRepository.searchGroups(keyword, pageable);
        return groupPage.getContent().stream().map(this::toGroupResponse).toList();
    }

    // ==================== Member Management ====================

    public GroupMemberResponse joinGroup(Long groupId, Long userId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Check if user is banned
        if (groupBanRepository.existsByGroupIdAndUserId(groupId, userId)) {
            throw new IllegalArgumentException("You have been banned from this group");
        }

        // Check if already a member
        if (groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "active")) {
            throw new IllegalArgumentException("You are already a member of this group");
        }

        // For private groups or groups requiring approval, create a join request
        if ("private".equals(group.getPrivacy()) || group.getApprovalRequired()) {
            // Check for existing pending request
            if (groupJoinRequestRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "pending")) {
                throw new IllegalArgumentException("You already have a pending request to join this group");
            }

            User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
            GroupJoinRequest joinRequest = groupJoinRequestRepository
                .findByGroupIdAndUserId(groupId, userId)
                .orElseGet(() -> {
                    GroupJoinRequest newRequest = new GroupJoinRequest();
                    newRequest.setGroup(group);
                    newRequest.setUser(user);
                    return newRequest;
                });
            joinRequest.setUser(user);
            joinRequest.setStatus("pending");

            groupJoinRequestRepository.save(joinRequest);

            // Notify admins about the join request
            List<GroupMember> admins = groupMemberRepository.findAdmins(groupId);
            for (GroupMember admin : admins) {
                createGroupNotification(admin.getUser().getId(), groupId, "join_request",
                    "Có thành viên mới yêu cầu tham gia nhóm", "user", userId);
            }

            return null; // Request pending approval
        }

        // For public groups without approval requirement, add directly
        GroupMember member = new GroupMember();
        member.setGroup(group);
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("User not found"));
        member.setUser(user);
        member.setRole("member");
        member.setStatus("active");

        groupMemberRepository.save(member);
        return toGroupMemberResponse(member);
    }

    @Transactional
    public GroupMemberResponse approveJoinRequest(Long groupId, Long requestId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Check if user is admin
        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can approve join requests");
        }

        GroupJoinRequest joinRequest = groupJoinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Join request not found"));

        if (!joinRequest.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Join request does not belong to this group");
        }
        if (!"pending".equals(joinRequest.getStatus())) {
            throw new IllegalArgumentException("Join request has already been processed");
        }

        joinRequest.setStatus("approved");
        groupJoinRequestRepository.save(joinRequest);

        // Reactivate an old membership when possible so the group/user unique key is preserved.
        GroupMember member = groupMemberRepository
            .findByGroupIdAndUserId(groupId, joinRequest.getUser().getId())
            .orElseGet(() -> {
                GroupMember newMember = new GroupMember();
                newMember.setGroup(group);
                newMember.setUser(joinRequest.getUser());
                return newMember;
            });
        member.setRole("member");
        member.setStatus("active");
        groupMemberRepository.save(member);

        // Notify the user
        createGroupNotification(joinRequest.getUser().getId(), groupId, "join_approved",
            "Yêu cầu tham gia nhóm của bạn đã được phê duyệt", null, null);

        return toGroupMemberResponse(member);
    }

    @Transactional
    public void rejectJoinRequest(Long groupId, Long requestId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can reject join requests");
        }

        GroupJoinRequest joinRequest = groupJoinRequestRepository.findById(requestId)
            .orElseThrow(() -> new IllegalArgumentException("Join request not found"));
        if (!joinRequest.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Join request does not belong to this group");
        }
        if (!"pending".equals(joinRequest.getStatus())) {
            throw new IllegalArgumentException("Join request has already been processed");
        }

        joinRequest.setStatus("rejected");
        groupJoinRequestRepository.save(joinRequest);

        // Notify the user
        createGroupNotification(joinRequest.getUser().getId(), groupId, "join_rejected",
            "Yêu cầu tham gia nhóm của bạn đã bị từ chối", null, null);
    }

    public void removeMember(Long groupId, Long memberId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can remove members");
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, memberId)
            .orElseThrow(() -> new IllegalArgumentException("Member not found"));

        // Gold key cannot be removed
        if (targetMember.isGoldKey()) {
            throw new IllegalArgumentException("Cannot remove the group creator");
        }

        // Silver key can only remove regular members
        if (targetMember.isAdmin() && !admin.isGoldKey()) {
            throw new IllegalArgumentException("Only the group creator can remove administrators");
        }

        targetMember.setStatus("blocked");
        groupMemberRepository.save(targetMember);

        // Notify the removed member
        createGroupNotification(memberId, groupId, "member_removed",
            "Bạn đã bị xóa khỏi nhóm", null, null);
    }

    public void leaveGroup(Long groupId, Long userId) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        // Gold key cannot leave (they must transfer ownership or delete the group)
        if (member.isGoldKey()) {
            throw new IllegalArgumentException("Group creator cannot leave the group. Please transfer ownership or delete the group.");
        }

        member.setStatus("blocked");
        groupMemberRepository.save(member);
    }

    // ==================== Role Management ====================

    public GroupMemberResponse grantAdminRole(Long groupId, Long targetUserId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        // Only gold key can grant admin role
        if (!admin.isGoldKey()) {
            throw new IllegalArgumentException("Only the group creator can grant administrator privileges");
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("User is not a member of this group"));

        if (targetMember.isAdmin()) {
            throw new IllegalArgumentException("User is already an administrator");
        }

        targetMember.setRole("silver_key");
        groupMemberRepository.save(targetMember);

        // Notify the user
        createGroupNotification(targetUserId, groupId, "role_changed",
            "Bạn đã được bổ nhiệm làm quản trị viên nhóm", null, null);

        return toGroupMemberResponse(targetMember);
    }

    public GroupMemberResponse revokeAdminRole(Long groupId, Long targetUserId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        // Only gold key can revoke admin role
        if (!admin.isGoldKey()) {
            throw new IllegalArgumentException("Only the group creator can revoke administrator privileges");
        }

        GroupMember targetMember = groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("User is not a member of this group"));

        if (!targetMember.isAdmin()) {
            throw new IllegalArgumentException("User is not an administrator");
        }

        if (targetMember.isGoldKey()) {
            throw new IllegalArgumentException("Cannot revoke the group creator's role");
        }

        targetMember.setRole("member");
        groupMemberRepository.save(targetMember);

        // Notify the user
        createGroupNotification(targetUserId, groupId, "role_changed",
            "Quyền quản trị viên của bạn đã bị thu hồi", null, null);

        return toGroupMemberResponse(targetMember);
    }

    // ==================== Advisor Management (Step 3) ====================

    /**
     * Get the GroupMember entity directly (for controller-level checks)
     */
    public GroupMember getGroupMemberEntity(Long groupId, Long userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId).orElse(null);
    }

    /**
     * Check if a user is an active member of a group
     */
    public boolean isMemberOfGroup(Long groupId, Long userId) {
        return groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "active");
    }

    /**
     * Add a student to a group as a regular member.
     */
    public void addStudentToGroup(Long groupId, Long studentId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        User student = userRepository.findById(studentId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check if already a member
        GroupMember existing = groupMemberRepository.findByGroupIdAndUserId(groupId, studentId).orElse(null);
        if (existing != null) {
            if ("active".equals(existing.getStatus())) {
                throw new IllegalArgumentException("User is already a member");
            }
            // Reactivate
            existing.setStatus("active");
            existing.setRole("member");
            groupMemberRepository.save(existing);
            return;
        }

        GroupMember newMember = new GroupMember();
        newMember.setGroup(group);
        newMember.setUser(student);
        newMember.setRole("member");
        newMember.setStatus("active");
        groupMemberRepository.save(newMember);
    }

    /**
     * Add an advisor to the group with silver_key role.
     * If the user is already a member, upgrade their role to silver_key.
     */
    public GroupMemberResponse addAdvisorToGroup(Long groupId, Long advisorId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Validate admin is gold_key
        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isGoldKey()) {
            throw new IllegalArgumentException("Only the group creator (Gold Key) can add advisors");
        }

        // Validate target user exists and is an advisor
        User advisor = userRepository.findById(advisorId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (!"advisor".equals(advisor.getRole())) {
            throw new IllegalArgumentException("User is not an academic advisor");
        }

        // Check if already a member
        GroupMember existingMember = groupMemberRepository.findByGroupIdAndUserId(groupId, advisorId).orElse(null);
        if (existingMember != null) {
            if ("active".equals(existingMember.getStatus())) {
                // Already active member - upgrade to silver_key if not already
                if ("silver_key".equals(existingMember.getRole())) {
                    throw new IllegalArgumentException("Cố vấn này đã có trong nhóm");
                }
                existingMember.setRole("silver_key");
                groupMemberRepository.save(existingMember);
                createGroupNotification(advisorId, groupId, "role_changed",
                    "Bạn đã được bổ nhiệm làm cố vấn học tập (Silver Key) cho nhóm " + group.getName(), null, null);
                return toGroupMemberResponse(existingMember);
            }
            // Reactivate if previously blocked/left
            existingMember.setStatus("active");
            existingMember.setRole("silver_key");
            groupMemberRepository.save(existingMember);
            createGroupNotification(advisorId, groupId, "role_changed",
                "Bạn đã được thêm làm cố vấn học tập (Silver Key) cho nhóm " + group.getName(), null, null);
            return toGroupMemberResponse(existingMember);
        }

        // Create new membership with silver_key
        GroupMember newMember = new GroupMember();
        newMember.setGroup(group);
        newMember.setUser(advisor);
        newMember.setRole("silver_key");
        newMember.setStatus("active");
        groupMemberRepository.save(newMember);

        createGroupNotification(advisorId, groupId, "role_changed",
            "Bạn đã được thêm làm cố vấn học tập (Silver Key) cho nhóm " + group.getName(), null, null);

        return toGroupMemberResponse(newMember);
    }

    // ==================== Ban Management ====================

    public void banUser(Long groupId, Long targetUserId, Long adminId, String reason) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can ban users");
        }

        User targetUser = userRepository.findById(targetUserId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Check if already banned
        if (groupBanRepository.existsByGroupIdAndUserId(groupId, targetUserId)) {
            throw new IllegalArgumentException("User is already banned from this group");
        }

        GroupBan ban = new GroupBan();
        ban.setGroup(group);
        ban.setUser(targetUser);
        ban.setBannedBy(admin.getUser());
        ban.setReason(reason);
        groupBanRepository.save(ban);

        // Remove from members if they were a member
        groupMemberRepository.findByGroupIdAndUserId(groupId, targetUserId)
            .ifPresent(member -> {
                if (!member.isGoldKey()) {
                    member.setStatus("blocked");
                    groupMemberRepository.save(member);
                }
            });

        // Notify the banned user
        createGroupNotification(targetUserId, groupId, "member_banned",
            "Bạn đã bị cấm khỏi nhóm", null, null);
    }

    public void unbanUser(Long groupId, Long targetUserId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can unban users");
        }

        groupBanRepository.deleteByGroupIdAndUserId(groupId, targetUserId);
    }

    // ==================== Group Posts ====================

    public GroupPostResponse createGroupPost(Long groupId, Long userId, PostRequest request) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Check membership
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!"active".equals(member.getStatus())) {
            throw new IllegalArgumentException("Your membership in this group is not active");
        }

        // Create the post
        User author = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Post post = new Post();
        post.setTitle("Bài viết trong nhóm");
        post.setContent(request.getContent() != null ? request.getContent().trim() : "");
        // Post visibility is tied to group privacy
        post.setVisibility(group.getPrivacy());
        post.setAuthor(author);
        Post savedPost = postRepository.save(post);

        // Save media if any
        savePostMedia(savedPost, request.getMedia());

        // Create group post record
        GroupPost groupPost = new GroupPost();
        groupPost.setPost(savedPost);
        groupPost.setGroup(group);
        // If approval is required, post starts as unapproved (unless author is admin)
        groupPost.setIsApproved(!group.getApprovalRequired() || member.isAdmin());
        groupPostRepository.save(groupPost);

        return toGroupPostResponse(groupPost, userId);
    }

    public GroupPostResponse createGroupPoll(Long groupId, Long userId, String title, String content, 
                                              List<String> options, String endDate, boolean allowMultiple) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        // Check membership and admin role
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!member.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can create polls in this group");
        }

        if (!"active".equals(member.getStatus())) {
            throw new IllegalArgumentException("Your membership in this group is not active");
        }

        // Validate poll options
        if (options == null || options.size() < 2) {
            throw new IllegalArgumentException("Poll must have at least 2 options");
        }
        if (options.size() > 10) {
            throw new IllegalArgumentException("Poll cannot have more than 10 options");
        }

        // Create the post
        User author = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Post post = new Post();
        post.setTitle(title != null ? title.trim() : "Bình chọn trong nhóm");
        post.setContent(content != null ? content.trim() : "");
        post.setVisibility(group.getPrivacy());
        post.setAuthor(author);
        post.setPoll(true);
        post.setPollAllowMultiple(allowMultiple);
        
        if (endDate != null && !endDate.isEmpty()) {
            try {
                post.setPollEndDate(java.time.LocalDateTime.parse(endDate));
            } catch (Exception e) {
                // Ignore invalid date
            }
        }

        Post savedPost = postRepository.save(post);

        // Create poll options
        List<PollOption> pollOptions = new ArrayList<>();
        for (int i = 0; i < options.size(); i++) {
            PollOption option = new PollOption();
            option.setPost(savedPost);
            option.setOptionText(options.get(i));
            option.setOptionOrder(i);
            pollOptions.add(option);
        }
        pollOptionRepository.saveAll(pollOptions);

        // Create group post record (auto-approved for admins)
        GroupPost groupPost = new GroupPost();
        groupPost.setPost(savedPost);
        groupPost.setGroup(group);
        groupPost.setIsApproved(true);
        groupPostRepository.save(groupPost);

        return toGroupPostResponse(groupPost, userId);
    }

    public List<GroupPostResponse> getGroupPosts(Long groupId, Long viewerId, String filter, int page, int size) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));
        privacyAccessService.requireGroupAccess(group, viewerId);

        Pageable pageable = PageRequest.of(page, size);
        Page<GroupPost> postPage;

        if ("pending".equals(filter)) {
            // Only admins can see pending posts
            GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, viewerId)
                .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));
            if (!member.isAdmin()) {
                throw new IllegalArgumentException("Only administrators can view pending posts");
            }
            postPage = groupPostRepository.findPendingPosts(groupId, pageable);
        } else {
            postPage = groupPostRepository.findApprovedPosts(groupId, pageable);
        }

        return postPage.getContent().stream()
            .map(gp -> toGroupPostResponse(gp, viewerId))
            .toList();
    }

    public GroupPostResponse approveGroupPost(Long groupId, Long postId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can approve posts");
        }

        GroupPost groupPost = groupPostRepository.findByPostId(postId)
            .orElseThrow(() -> new IllegalArgumentException("Group post not found"));

        if (!groupPost.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Post does not belong to this group");
        }

        groupPost.setIsApproved(true);
        groupPostRepository.save(groupPost);

        // Notify the post author
        createGroupNotification(groupPost.getPost().getAuthor().getId(), groupId,
            "post_approved", "Bài viết của bạn đã được phê duyệt", "post", postId);

        return toGroupPostResponse(groupPost, groupPost.getPost().getAuthor().getId());
    }

    public void rejectGroupPost(Long groupId, Long postId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can reject posts");
        }

        GroupPost groupPost = groupPostRepository.findByPostId(postId)
            .orElseThrow(() -> new IllegalArgumentException("Group post not found"));

        if (!groupPost.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Post does not belong to this group");
        }

        // Delete the post
        postRepository.delete(groupPost.getPost());
        groupPostRepository.delete(groupPost);

        // Notify the post author
        createGroupNotification(groupPost.getPost().getAuthor().getId(), groupId,
            "post_rejected", "Bài viết của bạn đã bị từ chối", "post", postId);
    }

    public void deleteGroupPost(Long groupId, Long postId, Long userId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        GroupPost groupPost = groupPostRepository.findByPostId(postId)
            .orElseThrow(() -> new IllegalArgumentException("Group post not found"));

        // Check if post belongs to this group
        if (!groupPost.getGroup().getId().equals(groupId)) {
            throw new IllegalArgumentException("Post does not belong to this group");
        }

        // Admins can delete any post, regular members can only delete their own
        boolean isPostAuthor = groupPost.getPost().getAuthor().getId().equals(userId);
        if (!member.isAdmin() && !isPostAuthor) {
            throw new IllegalArgumentException("You can only delete your own posts");
        }

        // Delete the post (cascade will handle group_post)
        postRepository.delete(groupPost.getPost());
    }

    // ==================== Post Interaction (using existing PostService logic) ====================

    public PostLikeResponse toggleLikeOnGroupPost(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return postLikeRepository.findByPostIdAndUserId(postId, userId)
            .map(existing -> {
                postLikeRepository.delete(existing);
                return new PostLikeResponse(postId, postLikeRepository.countByPostId(postId), false);
            })
            .orElseGet(() -> {
                PostLike like = new PostLike();
                like.setPost(post);
                like.setUser(user);
                postLikeRepository.save(like);
                return new PostLikeResponse(postId, postLikeRepository.countByPostId(postId), true);
            });
    }

    public PostCommentResponse addCommentToGroupPost(Long postId, Long userId, PostCommentRequest request) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

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
        return toCommentResponse(saved, null);
    }

    // ==================== Group Notifications ====================

    public List<GroupNotificationResponse> getGroupNotifications(Long userId) {
        return groupNotificationRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(this::toGroupNotificationResponse)
            .toList();
    }

    public long getUnreadGroupNotificationCount(Long userId) {
        return groupNotificationRepository.countUnreadByUserId(userId);
    }

    public void markGroupNotificationAsRead(Long notificationId) {
        groupNotificationRepository.markAsRead(notificationId);
    }

    public void markAllGroupNotificationsAsRead(Long userId) {
        groupNotificationRepository.markAllAsRead(userId);
    }

    // ==================== Member List ====================

    public List<GroupMemberResponse> getGroupMembers(Long groupId, String roleFilter) {
        List<GroupMember> members;
        if (roleFilter != null) {
            members = groupMemberRepository.findByGroupIdAndStatus(groupId, "active").stream()
                .filter(m -> roleFilter.equals(m.getRole()))
                .toList();
        } else {
            members = groupMemberRepository.findActiveMembers(groupId);
        }
        return members.stream().map(this::toGroupMemberResponse).toList();
    }

    public List<GroupJoinRequestResponse> getPendingJoinRequests(Long groupId, Long adminId) {
        Group group = groupRepository.findById(groupId)
            .orElseThrow(() -> new IllegalArgumentException("Group not found"));

        GroupMember admin = groupMemberRepository.findByGroupIdAndUserId(groupId, adminId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));

        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("Only administrators can view join requests");
        }

        return groupJoinRequestRepository.findPendingRequests(groupId).stream()
            .map(this::toGroupJoinRequestResponse)
            .toList();
    }

    public List<GroupJoinRequestResponse> getPendingJoinRequestsByUser(Long userId) {
        return groupJoinRequestRepository.findByUserIdAndStatus(userId, "pending").stream()
            .map(this::toGroupJoinRequestResponse)
            .toList();
    }

    // ==================== Utility Methods ====================

    private GroupResponse toGroupResponse(Group group) {
        return new GroupResponse(
            group.getId(),
            group.getName(),
            group.getDescription(),
            group.getAvatar(),
            group.getCover(),
            group.getPrivacy(),
            group.getCreator().getId(),
            group.getCreator().getFullName(),
            group.getCreator().getAvatar(),
            group.getApprovalRequired(),
            groupMemberRepository.countActiveMembers(group.getId()),
            group.getCreatedAt(),
            group.getUpdatedAt()
        );
    }

    private GroupMemberResponse toGroupMemberResponse(GroupMember member) {
        return new GroupMemberResponse(
            member.getId(),
            member.getGroup().getId(),
            member.getUser().getId(),
            member.getUser().getFullName(),
            member.getUser().getAvatar(),
            member.getRole(),
            member.getStatus(),
            member.getJoinedAt()
        );
    }

    private GroupJoinRequestResponse toGroupJoinRequestResponse(GroupJoinRequest request) {
        return new GroupJoinRequestResponse(
            request.getId(),
            request.getGroup().getId(),
            request.getGroup().getName(),
            request.getUser().getId(),
            request.getUser().getFullName(),
            request.getUser().getAvatar(),
            request.getStatus(),
            request.getMessage(),
            request.getCreatedAt(),
            request.getUpdatedAt()
        );
    }

    private GroupPostResponse toGroupPostResponse(GroupPost groupPost, Long viewerId) {
        Post post = groupPost.getPost();
        long likeCount = postLikeRepository.countByPostId(post.getId());
        long commentCount = postCommentRepository.countByPostId(post.getId());
        boolean likedByMe = viewerId != null && postLikeRepository.existsByPostIdAndUserId(post.getId(), viewerId);

        // Get media
        List<PostMedia> mediaList = postMediaRepository.findByPostIdOrderByMediaOrderAsc(post.getId());
        List<PostMediaResponse> media = mediaList.stream()
            .map(m -> new PostMediaResponse(m.getId(), m.getMediaType(), m.getMediaUrl(), m.getMediaName(), m.getMediaSize(), m.getMediaOrder()))
            .toList();

        // Return the full tree so replies and their multimedia are visible.
        List<PostComment> commentList = postCommentRepository.findByPostIdOrderByCreatedAtAsc(post.getId());
        List<PostCommentResponse> comments = commentList.stream()
            .map(c -> toCommentResponse(c, viewerId))
            .toList();

        return new GroupPostResponse(
            groupPost.getId(),
            post.getId(),
            groupPost.getGroup().getId(),
            groupPost.getGroup().getName(),
            post.getAuthor().getId(),
            post.getAuthor().getFullName(),
            post.getAuthor().getAvatar(),
            post.getTitle(),
            post.getContent(),
            post.getVisibility(),
            groupPost.getIsApproved(),
            likeCount,
            commentCount,
            likedByMe,
            post.getCreatedAt(),
            post.getUpdatedAt(),
            media,
            comments,
            post.isPoll(),
            post.getPollEndDate(),
            post.isPollAllowMultiple()
        );
    }

    private GroupNotificationResponse toGroupNotificationResponse(GroupNotification notification) {
        return new GroupNotificationResponse(
            notification.getId(),
            notification.getGroup().getId(),
            notification.getGroup().getName(),
            notification.getUser().getId(),
            notification.getType(),
            notification.getMessage(),
            notification.getTargetType(),
            notification.getTargetId(),
            notification.getIsRead(),
            notification.getCreatedAt()
        );
    }

    private void savePostMedia(Post post, List<java.util.Map<String, Object>> media) {
        if (media == null || media.isEmpty()) return;
        for (int i = 0; i < media.size(); i++) {
            java.util.Map<String, Object> item = media.get(i);
            if (item == null) continue;
            
            String url = getStringFromMap(item, "url");
            if (url == null || url.isBlank()) {
                url = getStringFromMap(item, "mediaUrl");
            }
            if (url == null || url.isBlank()) continue;
            
            String type = getStringFromMap(item, "type");
            if (type == null || type.isBlank()) {
                type = getStringFromMap(item, "mediaType");
            }
            if (type == null || type.isBlank()) {
                type = detectMediaType(url);
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

    private String detectMediaType(String mediaUrl) {
        if (mediaUrl == null || mediaUrl.isEmpty()) return "file";
        
        // Check for base64 data URI
        if (mediaUrl.startsWith("data:")) {
            if (mediaUrl.startsWith("data:image/")) return "image";
            if (mediaUrl.startsWith("data:video/")) return "video";
            if (mediaUrl.startsWith("data:audio/")) return "file";
            return "file";
        }
        
        // Check for file extension
        String lowerUrl = mediaUrl.toLowerCase();
        if (lowerUrl.endsWith(".mp4") || lowerUrl.endsWith(".webm") || lowerUrl.endsWith(".ogg") || 
            lowerUrl.endsWith(".ogv") || lowerUrl.endsWith(".avi") || lowerUrl.endsWith(".mov") || 
            lowerUrl.endsWith(".wmv") || lowerUrl.endsWith(".flv") || lowerUrl.endsWith(".mkv") ||
            lowerUrl.endsWith(".3gp") || lowerUrl.endsWith(".m4v")) {
            return "video";
        }
        
        if (lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || 
            lowerUrl.endsWith(".gif") || lowerUrl.endsWith(".webp") || lowerUrl.endsWith(".bmp") || 
            lowerUrl.endsWith(".svg") || lowerUrl.endsWith(".ico")) {
            return "image";
        }
        
        return "file";
    }

    private void saveCommentMedia(PostComment comment, List<String> media) {
        if (media == null || media.isEmpty()) return;
        for (int i = 0; i < Math.min(media.size(), 1); i++) {
            String url = media.get(i);
            if (url == null || url.isBlank()) continue;
            CommentMedia item = new CommentMedia();
            item.setComment(comment);
            item.setMediaUrl(url);
            item.setMediaType(detectMediaType(url));
            item.setMediaOrder(i);
            commentMediaRepository.save(item);
        }
    }

    private void createGroupNotification(Long userId, Long groupId, String type, String message, String targetType, Long targetId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return;

        Group group = groupRepository.findById(groupId).orElse(null);
        if (group == null) return;

        GroupNotification notification = new GroupNotification();
        notification.setUser(user);
        notification.setGroup(group);
        notification.setType(type);
        notification.setMessage(message);
        notification.setTargetType(targetType);
        notification.setTargetId(targetId);
        notification.setIsRead(false);
        groupNotificationRepository.save(notification);
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
            0L, // Like count - simplified
            false // Liked by me - simplified
        );
    }
}
