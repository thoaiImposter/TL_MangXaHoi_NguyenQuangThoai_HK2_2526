package com.app.backend.repository;

import com.app.backend.entity.PostShare;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PostShareRepository extends JpaRepository<PostShare, Long> {

    // Tim tat ca luot chia se cua mot bai viet.
    Page<PostShare> findByOriginalPostId(Long postId, Pageable pageable);

    // Tim cac bai chia se theo user da share.
    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedBy.id = :userId")
    Page<PostShare> findBySharedByUserId(@Param("userId") Long userId, Pageable pageable);

    // Tim cac bai chia se vao mot nhom.
    Page<PostShare> findBySharedToGroupId(Long groupId, Pageable pageable);

    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedToGroup IS NULL ORDER BY ps.createdAt DESC")
    Page<PostShare> findTimelineShares(Pageable pageable);

    // Kiem tra user da chia se bai nay chua.
    @Query("SELECT COUNT(ps) > 0 FROM PostShare ps WHERE ps.originalPost.id = :postId AND ps.sharedBy.id = :userId")
    boolean existsByOriginalPostIdAndSharedByUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    // Tim ban ghi share theo bai goc va user share.
    @Query("SELECT ps FROM PostShare ps WHERE ps.originalPost.id = :postId AND ps.sharedBy.id = :userId")
    PostShare findByOriginalPostIdAndSharedByUserId(@Param("postId") Long postId, @Param("userId") Long userId);

    // Dem so luot chia se cua mot bai.
    long countByOriginalPostId(Long postId);

    // Tim share public/friends de hien thi tren feed.
    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedBy.id = :userId AND ps.shareVisibility IN ('public', 'friends') ORDER BY ps.createdAt DESC")
    Page<PostShare> findVisibleSharesByUser(@Param("userId") Long userId, Pageable pageable);

    // Tim share trong cac nhom ma user la thanh vien.
    @Query("SELECT ps FROM PostShare ps WHERE ps.sharedToGroup.id IN :groupIds ORDER BY ps.createdAt DESC")
    Page<PostShare> findSharesToUserGroups(@Param("groupIds") List<Long> groupIds, Pageable pageable);
}
