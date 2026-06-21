package com.app.backend.repository;

import com.app.backend.entity.GroupPost;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupPostRepository extends JpaRepository<GroupPost, Long> {

    Page<GroupPost> findByGroupIdOrderByCreatedAtDesc(Long groupId, Pageable pageable);

    @Query("SELECT gp FROM GroupPost gp WHERE gp.group.id = :groupId AND gp.isApproved = true ORDER BY gp.createdAt DESC")
    Page<GroupPost> findApprovedPosts(@Param("groupId") Long groupId, Pageable pageable);

    @Query("SELECT gp FROM GroupPost gp WHERE gp.group.id = :groupId AND gp.isApproved = false ORDER BY gp.createdAt DESC")
    Page<GroupPost> findPendingPosts(@Param("groupId") Long groupId, Pageable pageable);

    Optional<GroupPost> findByPostId(Long postId);
    List<GroupPost> findByGroupId(Long groupId);

    List<GroupPost> findByGroupIdAndIsApproved(Long groupId, Boolean isApproved);

    @Query("SELECT COUNT(gp) FROM GroupPost gp WHERE gp.group.id = :groupId")
    long countByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT COUNT(gp) FROM GroupPost gp WHERE gp.group.id = :groupId AND gp.isApproved = true")
    long countApprovedPosts(@Param("groupId") Long groupId);

    @Query("SELECT COUNT(gp) FROM GroupPost gp WHERE gp.group.id = :groupId AND gp.isApproved = false")
    long countPendingPosts(@Param("groupId") Long groupId);

    boolean existsByPostId(Long postId);
}
