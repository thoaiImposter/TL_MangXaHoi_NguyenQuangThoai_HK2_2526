package com.app.backend.repository;

import com.app.backend.entity.PostComment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {
    List<PostComment> findByPostIdOrderByCreatedAtAsc(Long postId);
    List<PostComment> findByPostIdAndParentCommentIdIsNullOrderByCreatedAtAsc(Long postId);
    long countByPostId(Long postId);
}
