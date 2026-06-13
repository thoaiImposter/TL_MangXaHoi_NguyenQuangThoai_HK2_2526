package com.app.backend.repository;

import com.app.backend.entity.GroupPost;
import com.app.backend.entity.Post;
import com.app.backend.entity.PostShare;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post, Long> {
    List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);
    List<Post> findAllByOrderByCreatedAtDesc();
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId, Pageable pageable);

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
