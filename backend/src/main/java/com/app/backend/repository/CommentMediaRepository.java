package com.app.backend.repository;

import com.app.backend.entity.CommentMedia;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommentMediaRepository extends JpaRepository<CommentMedia, Long> {
    List<CommentMedia> findByCommentIdOrderByMediaOrderAsc(Long commentId);
}
