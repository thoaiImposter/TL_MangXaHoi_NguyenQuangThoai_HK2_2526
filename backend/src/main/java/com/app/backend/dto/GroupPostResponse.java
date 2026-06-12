package com.app.backend.dto;

import java.time.LocalDateTime;
import java.util.List;

public record GroupPostResponse(
    Long id,
    Long postId,
    Long groupId,
    String groupName,
    Long authorId,
    String authorName,
    String authorAvatar,
    String title,
    String content,
    String visibility,
    Boolean isApproved,
    Long likeCount,
    Long commentCount,
    Boolean likedByMe,
    LocalDateTime createdAt,
    LocalDateTime updatedAt,
    List<PostMediaResponse> media,
    List<PostCommentResponse> comments,
    Boolean isPoll,
    LocalDateTime pollEndDate,
    Boolean pollAllowMultiple
) {}
