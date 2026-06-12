package com.app.backend.repository;

import com.app.backend.entity.Block;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, Long> {

    Optional<Block> findByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    boolean existsByBlockerIdAndBlockedId(Long blockerId, Long blockedId);

    @Query("SELECT b FROM Block b JOIN FETCH b.blocked WHERE b.blocker.id = ?1 ORDER BY b.createdAt DESC")
    List<Block> findByBlockerId(Long blockerId);
}
