package com.app.backend.repository;

import com.app.backend.entity.Group;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GroupRepository extends JpaRepository<Group, Long> {

    Page<Group> findByPrivacyOrderByCreatedAtDesc(String privacy, Pageable pageable);

    @Query("SELECT g FROM Group g WHERE g.privacy = 'public' ORDER BY g.createdAt DESC")
    Page<Group> findPublicGroups(Pageable pageable);

    @Query("SELECT g FROM Group g JOIN g.members m WHERE m.user.id = :userId AND m.status = 'active'")
    Page<Group> findUserGroups(@Param("userId") Long userId, Pageable pageable);

    @Query("SELECT g FROM Group g WHERE g.name LIKE %:keyword% AND g.privacy = 'public' ORDER BY g.createdAt DESC")
    Page<Group> searchGroups(@Param("keyword") String keyword, Pageable pageable);

    List<Group> findByCreatorId(Long creatorId);

    @Query("SELECT COUNT(g) FROM Group g")
    long countAll();

    @Query("SELECT COUNT(g) FROM Group g WHERE g.privacy = 'public'")
    long countPublicGroups();

    @Query("SELECT COUNT(g) FROM Group g WHERE g.privacy = 'private'")
    long countPrivateGroups();
}