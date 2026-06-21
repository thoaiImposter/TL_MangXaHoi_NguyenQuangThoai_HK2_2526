package com.app.backend.service;

import com.app.backend.entity.PollOption;
import com.app.backend.entity.PollVote;
import com.app.backend.entity.Post;
import com.app.backend.entity.User;
import com.app.backend.repository.PollOptionRepository;
import com.app.backend.repository.PollVoteRepository;
import com.app.backend.repository.PostRepository;
import com.app.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class PollService {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PollOptionRepository pollOptionRepository;

    @Autowired
    private PollVoteRepository pollVoteRepository;

    @Autowired
    private PrivacyAccessService privacyAccessService;

    /**
     * Ham tao bai viet dang binh chon va luu cac lua chon.
     */
    @Transactional
    public Post createPoll(Long authorId, String title, String content, String visibility,
                           List<String> options, LocalDateTime endDate, boolean allowMultiple) {
        List<String> normalizedOptions = normalizeOptions(options);
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Poll question is required");
        }
        if (normalizedOptions.size() < 2) {
            throw new IllegalArgumentException("Poll must have at least 2 options");
        }
        if (normalizedOptions.size() > 10) {
            throw new IllegalArgumentException("Poll cannot have more than 10 options");
        }
        if (endDate != null && !endDate.isAfter(LocalDateTime.now())) {
            throw new IllegalArgumentException("Poll end time must be in the future");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        // Tao post chinh va danh dau day la poll.
        Post post = new Post();
        post.setTitle(title.trim());
        post.setContent(content == null ? "" : content.trim());
        post.setVisibility(privacyAccessService.normalizeScope(visibility, PrivacyAccessService.PUBLIC));
        post.setAuthor(author);
        post.setPoll(true);
        post.setPollAllowMultiple(allowMultiple);
        post.setPollEndDate(endDate);

        Post savedPost = postRepository.save(post);

        // Luu cac lua chon cua poll theo thu tu.
        List<PollOption> pollOptions = new ArrayList<>();
        for (int i = 0; i < normalizedOptions.size(); i++) {
            PollOption option = new PollOption();
            option.setPost(savedPost);
            option.setOptionText(normalizedOptions.get(i));
            option.setOptionOrder(i);
            pollOptions.add(option);
        }
        pollOptionRepository.saveAll(pollOptions);

        return savedPost;
    }

    /**
     * Ham ghi nhan lua chon cua user trong poll.
     */
    @Transactional
    public Map<String, Object> vote(Long postId, Long userId, List<Long> optionIds) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);

        if (!post.isPoll()) {
            throw new IllegalArgumentException("This post is not a poll");
        }
        if (optionIds == null || optionIds.isEmpty()) {
            throw new IllegalArgumentException("Select at least one option");
        }
        optionIds = optionIds.stream().filter(Objects::nonNull).distinct().toList();
        if (optionIds.isEmpty()) {
            throw new IllegalArgumentException("Select at least one option");
        }
        if (!post.isPollAllowMultiple() && optionIds.size() > 1) {
            throw new IllegalArgumentException("This poll only allows one choice");
        }

        // Khong cho vote neu poll da het han.
        if (post.getPollEndDate() != null && LocalDateTime.now().isAfter(post.getPollEndDate())) {
            throw new IllegalArgumentException("This poll has ended");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        // Xoa vote cu cua user de cap nhat thanh lua chon moi.
        List<PollVote> existingVotes = pollVoteRepository.findByPostIdAndUserId(postId, userId);
        pollVoteRepository.deleteAll(existingVotes);

        // Luu cac vote moi.
        List<PollVote> newVotes = new ArrayList<>();
        for (Long optionId : optionIds) {
            PollOption option = pollOptionRepository.findById(optionId)
                    .orElseThrow(() -> new NoSuchElementException("Poll option not found"));

            if (!option.getPost().getId().equals(postId)) {
                throw new IllegalArgumentException("Option does not belong to this poll");
            }

            PollVote vote = new PollVote();
            vote.setPollOption(option);
            vote.setUser(user);
            newVotes.add(vote);
        }

        pollVoteRepository.saveAll(newVotes);

        // Tra ve ket qua moi nhat sau khi vote.
        return getPollResults(postId, userId);
    }

    /**
     * Ham tinh ket qua poll gom so vote, ty le va user da chon option nao.
     */
    public Map<String, Object> getPollResults(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);

        if (!post.isPoll()) {
            throw new IllegalArgumentException("This post is not a poll");
        }

        List<PollOption> options = pollOptionRepository.findByPostId(postId);
        List<Map<String, Object>> optionsData = new ArrayList<>();

        long totalVotes = 0;

        for (PollOption option : options) {
            long voteCount = pollVoteRepository.countByPollOptionId(option.getId());
            totalVotes += voteCount;

            Map<String, Object> optionData = new HashMap<>();
            optionData.put("id", option.getId());
            optionData.put("optionText", option.getOptionText());
            optionData.put("voteCount", voteCount);
            optionData.put("votedByMe", false);

            // Danh dau option ma user hien tai da vote.
            Optional<PollVote> userVote = pollVoteRepository.findByPollOptionIdAndUserId(option.getId(), userId);
            if (userVote.isPresent()) {
                optionData.put("votedByMe", true);
            }

            optionsData.add(optionData);
        }

        // Tinh phan tram vote cua tung option.
        for (Map<String, Object> optionData : optionsData) {
            long voteCount = (Long) optionData.get("voteCount");
            double percentage = totalVotes > 0 ? (voteCount * 100.0 / totalVotes) : 0;
            optionData.put("percentage", Math.round(percentage * 100.0) / 100.0);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("postId", postId);
        result.put("totalVotes", totalVotes);
        result.put("allowMultiple", post.isPollAllowMultiple());
        result.put("endDate", post.getPollEndDate());
        result.put("isEnded", post.getPollEndDate() != null && LocalDateTime.now().isAfter(post.getPollEndDate()));
        result.put("options", optionsData);

        // Danh dau user da tham gia vote poll nay chua.
        List<PollVote> userVotes = pollVoteRepository.findByPostIdAndUserId(postId, userId);
        result.put("hasVoted", !userVotes.isEmpty());

        return result;
    }

    /**
     * Ham huy tat ca vote cua user trong mot poll.
     */
    @Transactional
    public void removeVote(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new NoSuchElementException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);
        List<PollVote> votes = pollVoteRepository.findByPostIdAndUserId(postId, userId);
        pollVoteRepository.deleteAll(votes);
    }

    /**
     * Ham chuan hoa danh sach option va chan option bi trung.
     */
    private List<String> normalizeOptions(List<String> options) {
        if (options == null) return List.of();
        List<String> normalized = options.stream()
            .filter(Objects::nonNull)
            .map(String::trim)
            .filter(option -> !option.isBlank())
            .toList();
        long distinctCount = normalized.stream().map(option -> option.toLowerCase(Locale.ROOT)).distinct().count();
        if (distinctCount != normalized.size()) {
            throw new IllegalArgumentException("Poll options must be unique");
        }
        return normalized;
    }
}
