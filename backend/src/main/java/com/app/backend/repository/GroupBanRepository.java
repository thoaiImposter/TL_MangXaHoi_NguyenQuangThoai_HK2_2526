package com.app.backend.repository;

import com.app.backend.entity.GroupBan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupBanRepository extends JpaRepository<GroupBan, Long> {

    Optional<GroupBan> findByGroupIdAndUserId(Long groupId, Long userId);

    List<GroupBan> findByGroupId(Long groupId);

    List<GroupBan> findByUserId(Long userId);

    @Query("SELECT gb FROM GroupBan gb WHERE gb.group.id = :groupId AND (gb.expiresAt IS NULL OR gb.expiresAt > CURRENT_TIMESTAMP)")
    List<GroupBan> findActiveBans(@Param("groupId") Long groupId);

    boolean existsByGroupIdAndUserId(Long groupId, Long userId);

    @Query("DELETE FROM GroupBan gb WHERE gb.group.id = :groupId AND gb.user.id = :userId")
    void deleteByGroupIdAndUserId(@Param("groupId") Long groupId, @Param("userId") Long userId);
}