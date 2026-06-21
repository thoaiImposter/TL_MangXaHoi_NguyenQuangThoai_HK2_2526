package com.app.backend.repository;

import com.app.backend.entity.GroupNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupNotificationRepository extends JpaRepository<GroupNotification, Long> {

    List<GroupNotification> findByUserId(Long userId);

    List<GroupNotification> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<GroupNotification> findByUserIdAndIsRead(Long userId, Boolean isRead);

    List<GroupNotification> findByGroupId(Long groupId);

    @Query("SELECT COUNT(gn) FROM GroupNotification gn WHERE gn.user.id = :userId AND gn.isRead = false")
    long countUnreadByUserId(@Param("userId") Long userId);

    @Query("SELECT gn FROM GroupNotification gn WHERE gn.user.id = :userId AND gn.isRead = false ORDER BY gn.createdAt DESC")
    List<GroupNotification> findUnreadByUserId(@Param("userId") Long userId);

    @Query("UPDATE GroupNotification gn SET gn.isRead = true WHERE gn.user.id = :userId")
    @Modifying
    void markAllAsRead(@Param("userId") Long userId);

    @Query("UPDATE GroupNotification gn SET gn.isRead = true WHERE gn.id = :id")
    @Modifying
    void markAsRead(@Param("id") Long id);
}
