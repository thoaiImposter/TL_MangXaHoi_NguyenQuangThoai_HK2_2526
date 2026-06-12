package com.app.backend.repository;

import com.app.backend.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FriendshipRepository extends JpaRepository<Friendship, Long> {

    Optional<Friendship> findByRequesterIdAndAddresseeId(Long requesterId, Long addresseeId);

    boolean existsByRequesterIdAndAddresseeIdAndStatus(Long requesterId, Long addresseeId, String status);

    List<Friendship> findByAddresseeIdAndStatusOrderByCreatedAtDesc(Long addresseeId, String status);

    @Query("SELECT f FROM Friendship f WHERE f.status = :status AND (f.requester.id = :userId OR f.addressee.id = :userId) ORDER BY f.createdAt DESC")
    List<Friendship> findAcceptedByUserId(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT COUNT(f) FROM Friendship f WHERE f.status = :status AND (f.requester.id = :userId OR f.addressee.id = :userId)")
    long countAcceptedByUserId(@Param("userId") Long userId, @Param("status") String status);

    @Query("SELECT CASE WHEN f.requester.id = :userId THEN f.addressee.id ELSE f.requester.id END FROM Friendship f WHERE f.status = 'accepted' AND (f.requester.id = :userId OR f.addressee.id = :userId)")
    List<Long> findFriendIdsByUserId(@Param("userId") Long userId);
}
