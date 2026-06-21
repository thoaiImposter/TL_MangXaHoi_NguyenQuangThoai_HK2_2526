package com.app.backend.repository;

import com.app.backend.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FacultyRepository extends JpaRepository<Faculty, Long> {
    List<Faculty> findByActiveTrueOrderByNameAsc();
}
