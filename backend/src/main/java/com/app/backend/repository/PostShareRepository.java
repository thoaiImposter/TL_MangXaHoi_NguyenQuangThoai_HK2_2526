package com.app.backend.repository;

import com.app.backend.entity.PostShare;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostShareRepository extends JpaRepository<PostShare, Long> {

    // Find all shares for a specific post
    Page<PostShare> findByOriginalPostId(Long postId, Pageable pageable);

    // Find shares by user who shared (using @Query to avoid parsing issues)
    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedBy.id = :userId")
    Page<PostShare> findBySharedByUserId(@Param("userId") Long userId, Pageable pageable);

    // Find shares to a specific group
    Page<PostShare> findBySharedToGroupId(Long groupId, Pageable pageable);

    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedToGroup IS NULL ORDER BY ps.createdAt DESC")
    Page<PostShare> findTimelineShares(Pageable pageable);

    // Check if a user has already shared a post (using @Query to avoid parsing issues)
    @Query("SELECT COUNT(ps) > 0 FROM PostShare ps WHERE ps.originalPost.id = :postId AND ps.sharedBy.id = :userId")
    boolean existsByOriginalPostIdAndSharedByUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    // Find share by post and user (using @Query to avoid parsing issues)
    @Query("SELECT ps FROM PostShare ps WHERE ps.originalPost.id = :postId AND ps.sharedBy.id = :userId")
    PostShare findByOriginalPostIdAndSharedByUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    // Count shares for a post
    long countByOriginalPostId(Long postId);

    // Find shares with visibility check (for feed display)
    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedBy.id = :userId AND ps.shareVisibility IN ('public', 'friends') ORDER BY ps.createdAt DESC")
    Page<PostShare> findVisibleSharesByUser(@Param("userId") Long userId, Pageable pageable);

    // Find shares to groups where user is member
    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedToGroup.id IN :groupIds ORDER BY ps.createdAt DESC")
    Page<PostShare> findSharesToUserGroups(@Param("groupIds") List<Long> groupIds, Pageable pageable);
}
