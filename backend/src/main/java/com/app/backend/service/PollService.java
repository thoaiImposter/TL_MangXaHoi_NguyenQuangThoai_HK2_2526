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
     * Create a new poll post
     */
    @Transactional
    public Post createPoll(Long authorId, String title, String content, String visibility,
                           List<String> options, LocalDateTime endDate, boolean allowMultiple) {
        // Validate
        if (options == null || options.size() < 2) {
            throw new IllegalArgumentException("Poll must have at least 2 options");
        }
        if (options.size() > 10) {
            throw new IllegalArgumentException("Poll cannot have more than 10 options");
        }

        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        // Create post
        Post post = new Post();
        post.setTitle(title);
        post.setContent(content);
        post.setVisibility(privacyAccessService.normalizeScope(visibility, PrivacyAccessService.PUBLIC));
        post.setAuthor(author);
        post.setPoll(true);
        post.setPollAllowMultiple(allowMultiple);
        post.setPollEndDate(endDate);

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

        return savedPost;
    }

    /**
     * Vote in a poll
     */
    @Transactional
    public Map<String, Object> vote(Long postId, Long userId, List<Long> optionIds) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new NoSuchElementException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);

        if (!post.isPoll()) {
            throw new IllegalArgumentException("This post is not a poll");
        }

        // Check if poll has ended
        if (post.getPollEndDate() != null && LocalDateTime.now().isAfter(post.getPollEndDate())) {
            throw new IllegalArgumentException("This poll has ended");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        // Remove existing votes by this user on this post
        List<PollVote> existingVotes = pollVoteRepository.findByPostIdAndUserId(postId, userId);
        pollVoteRepository.deleteAll(existingVotes);

        // Add new votes
        List<PollVote> newVotes = new ArrayList<>();
        for (Long optionId : optionIds) {
            PollOption option = pollOptionRepository.findById(optionId)
                    .orElseThrow(() -> new NoSuchElementException("Poll option not found"));

            if (!option.getPost().getId().equals(postId)) {
                throw new IllegalArgumentException("Option does not belong to this poll");
            }

            // If single choice, only allow one vote
            if (!post.isPollAllowMultiple() && optionIds.size() > 1) {
                throw new IllegalArgumentException("This poll only allows one choice");
            }

            PollVote vote = new PollVote();
            vote.setPollOption(option);
            vote.setUser(user);
            newVotes.add(vote);
        }

        pollVoteRepository.saveAll(newVotes);

        // Return updated poll results
        return getPollResults(postId, userId);
    }

    /**
     * Get poll results
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

            // Check if current user voted for this option
            Optional<PollVote> userVote = pollVoteRepository.findByPollOptionIdAndUserId(option.getId(), userId);
            if (userVote.isPresent()) {
                optionData.put("votedByMe", true);
            }

            optionsData.add(optionData);
        }

        // Calculate percentages
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

        // Check if user has voted
        List<PollVote> userVotes = pollVoteRepository.findByPostIdAndUserId(postId, userId);
        result.put("hasVoted", !userVotes.isEmpty());

        return result;
    }

    /**
     * Remove vote from a poll
     */
    @Transactional
    public void removeVote(Long postId, Long userId) {
        Post post = postRepository.findById(postId)
            .orElseThrow(() -> new NoSuchElementException("Post not found"));
        privacyAccessService.requirePostAccess(post, userId);
        List<PollVote> votes = pollVoteRepository.findByPostIdAndUserId(postId, userId);
        pollVoteRepository.deleteAll(votes);
    }
}
