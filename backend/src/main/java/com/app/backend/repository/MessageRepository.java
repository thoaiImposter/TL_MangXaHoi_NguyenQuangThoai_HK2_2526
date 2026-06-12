package com.app.backend.repository;

import com.app.backend.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender.id = :userId1 AND m.receiver.id = :userId2) OR " +
           "(m.sender.id = :userId2 AND m.receiver.id = :userId1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversation(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT m FROM Message m WHERE m.receiver.id = :userId AND m.isRead = false ORDER BY m.createdAt ASC")
    List<Message> findUnreadByReceiver(@Param("userId") Long userId);

    @Query(value = """
        SELECT m.* FROM messages m
        INNER JOIN (
            SELECT LEAST(sender_id, receiver_id) as u1, GREATEST(sender_id, receiver_id) as u2,
                   MAX(created_at) as max_created
            FROM messages
            WHERE sender_id = :userId OR receiver_id = :userId
            GROUP BY u1, u2
        ) latest ON (
            LEAST(m.sender_id, m.receiver_id) = latest.u1
            AND GREATEST(m.sender_id, m.receiver_id) = latest.u2
            AND m.created_at = latest.max_created
        )
        ORDER BY m.created_at DESC
        """, nativeQuery = true)
    List<Message> findLatestConversations(@Param("userId") Long userId);

    // Group chat queries
    @Query("SELECT m FROM Message m WHERE m.group.id = :groupId ORDER BY m.createdAt ASC")
    List<Message> findByGroupId(@Param("groupId") Long groupId);

    @Query("SELECT m FROM Message m WHERE m.group.id = :groupId ORDER BY m.createdAt DESC")
    Page<Message> findByGroupIdOrderByCreatedAtDesc(@Param("groupId") Long groupId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.group.id = :groupId AND m.createdAt > :since ORDER BY m.createdAt ASC")
    List<Message> findByGroupIdAndCreatedAtAfter(@Param("groupId") Long groupId, @Param("since") java.time.LocalDateTime since);

    @Query(value = """
        SELECT m.* FROM messages m
        INNER JOIN (
            SELECT group_id, MAX(created_at) as max_created
            FROM messages
            WHERE group_id = :groupId
            GROUP BY group_id
        ) latest ON m.group_id = latest.group_id AND m.created_at = latest.max_created
        """, nativeQuery = true)
    List<Message> findLatestGroupMessages(@Param("groupId") Long groupId);
}
