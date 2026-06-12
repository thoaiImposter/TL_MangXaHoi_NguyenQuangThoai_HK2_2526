package com.app.backend.repository;

import com.app.backend.entity.PollVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PollVoteRepository extends JpaRepository<PollVote, Long> {
    
    List<PollVote> findByPollOptionId(Long pollOptionId);
    
    List<PollVote> findByUserId(Long userId);
    
    @Query("SELECT pv FROM PollVote pv WHERE pv.pollOption.post.id = :postId AND pv.user.id = :userId")
    List<PollVote> findByPostIdAndUserId(@Param("postId") Long postId, @Param("userId") Long userId);
    
    Optional<PollVote> findByPollOptionIdAndUserId(Long pollOptionId, Long userId);
    
    @Query("SELECT COUNT(pv) FROM PollVote pv WHERE pv.pollOption.id = :pollOptionId")
    long countByPollOptionId(@Param("pollOptionId") Long pollOptionId);
    
    @Query("SELECT COUNT(pv) FROM PollVote pv WHERE pv.pollOption.post.id = :postId")
    long countByPostId(@Param("postId") Long postId);
}