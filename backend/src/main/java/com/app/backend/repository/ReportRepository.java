package com.app.backend.repository;

import com.app.backend.entity.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReportRepository extends JpaRepository<Report, Long> {
    boolean existsByReporterIdAndTargetTypeAndTargetIdAndStatus(Long reporterId, String targetType, Long targetId, String status);
    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);
    Page<Report> findByStatusOrderByCreatedAtDesc(String status, Pageable pageable);
    long countByStatus(String status);
    long deleteByTargetOwnerId(Long targetOwnerId);
}
