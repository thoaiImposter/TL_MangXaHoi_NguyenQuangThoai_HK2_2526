package com.app.backend.repository;

import com.app.backend.entity.GroupPost;
import com.app.backend.entity.Post;
import com.app.backend.entity.PostShare;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    List<Post> findAllByOrderByCreatedAtDesc();
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Post p " +
        "WHERE NOT EXISTS (SELECT 1 FROM PostShare ps WHERE ps.sharedPost = p) " +
        "AND (LOWER(p.content) LIKE LOWER(CONCAT('%', :query, '%')) " +
        "OR LOWER(p.author.fullName) LIKE LOWER(CONCAT('%', :query, '%'))) " +
        "ORDER BY CASE " +
        "WHEN LOWER(p.content) = LOWER(:query) THEN 0 " +
        "WHEN LOWER(p.content) LIKE LOWER(CONCAT(:query, '%')) THEN 1 " +
        "WHEN LOWER(p.author.fullName) = LOWER(:query) THEN 2 " +
        "WHEN LOWER(p.author.fullName) LIKE LOWER(CONCAT(:query, '%')) THEN 3 " +
        "ELSE 4 END, p.createdAt DESC")
    Page<Post> searchRelevant(@Param("query") String query, Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Post p " +
        "WHERE NOT EXISTS (SELECT 1 FROM GroupPost gp WHERE gp.post = p) " +
        "AND NOT EXISTS (SELECT 1 FROM PostShare ps WHERE ps.sharedPost = p) " +
        "ORDER BY p.createdAt DESC")
    Page<Post> findTimelineCandidates(Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Post p WHERE p.author.id = :authorId " +
        "AND NOT EXISTS (SELECT 1 FROM GroupPost gp WHERE gp.post = p) " +
        "AND NOT EXISTS (SELECT 1 FROM PostShare ps WHERE ps.sharedPost = p) " +
        "ORDER BY p.createdAt DESC")
    Page<Post> findPersonalPostsByAuthorId(@org.springframework.data.repository.query.Param("authorId") Long authorId, Pageable pageable);
}
