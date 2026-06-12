package com.app.backend.repository;

import com.app.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByFullNameContainingIgnoreCase(String fullName);
    List<User> findByRoleAndFaculty(String role, String faculty);
    List<User> findByRole(String role);
}
