package com.app.backend.repository;

import com.app.backend.entity.GroupJoinRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupJoinRequestRepository extends JpaRepository<GroupJoinRequest, Long> {

    Optional<GroupJoinRequest> findByGroupIdAndUserId(Long groupId, Long userId);

    List<GroupJoinRequest> findByGroupId(Long groupId);

    List<GroupJoinRequest> findByGroupIdAndStatus(Long groupId, String status);

    List<GroupJoinRequest> findByUserId(Long userId);

    List<GroupJoinRequest> findByUserIdAndStatus(Long userId, String status);

    @Query("SELECT gjr FROM GroupJoinRequest gjr WHERE gjr.group.id = :groupId AND gjr.status = 'pending'")
    List<GroupJoinRequest> findPendingRequests(@Param("groupId") Long groupId);

    @Query("SELECT COUNT(gjr) FROM GroupJoinRequest gjr WHERE gjr.group.id = :groupId AND gjr.status = 'pending'")
    long countPendingRequests(@Param("groupId") Long groupId);

    boolean existsByGroupIdAndUserIdAndStatus(Long groupId, Long userId, String status);

    @Query("SELECT gjr FROM GroupJoinRequest gjr WHERE gjr.group.id = :groupId AND gjr.user.id = :userId ORDER BY gjr.createdAt DESC")
    List<GroupJoinRequest> findByGroupAndUser(@Param("groupId") Long groupId, @Param("userId") Long userId);
}