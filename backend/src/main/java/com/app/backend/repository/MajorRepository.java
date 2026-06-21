package com.app.backend.repository;

import com.app.backend.entity.Major;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MajorRepository extends JpaRepository<Major, Long> {
    List<Major> findByActiveTrueOrderByNameAsc();
    List<Major> findByActiveTrueAndFacultyIdOrderByNameAsc(Long facultyId);
}
