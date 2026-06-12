package com.app.backend.repository;

import com.app.backend.entity.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, Long> {

    Optional<GroupMember> findByGroupIdAndUserId(Long groupId, Long userId);

    List<GroupMember> findByGroupId(Long groupId);

    List<GroupMember> findByGroupIdAndStatus(Long groupId, String status);

    List<GroupMember> findByUserId(Long userId);

    List<GroupMember> findByUserIdAndStatus(Long userId, String status);

    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.status = 'active'")
    List<GroupMember> findActiveMembers(@Param("groupId") Long groupId);

    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.status = 'active'")
    long countActiveMembers(@Param("groupId") Long groupId);

    @Query("SELECT COUNT(gm) FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.role IN ('gold_key', 'silver_key') AND gm.status = 'active'")
    long countAdmins(@Param("groupId") Long groupId);

    @Query("SELECT gm.user.id FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.status = 'active'")
    List<Long> findActiveMemberIds(@Param("groupId") Long groupId);

    boolean existsByGroupIdAndUserIdAndStatus(Long groupId, Long userId, String status);

    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.role IN ('gold_key', 'silver_key') AND gm.status = 'active'")
    List<GroupMember> findAdmins(@Param("groupId") Long groupId);

    @Query("SELECT gm FROM GroupMember gm WHERE gm.group.id = :groupId AND gm.role = 'gold_key' AND gm.status = 'active'")
    Optional<GroupMember> findGoldKey(@Param("groupId") Long groupId);
}