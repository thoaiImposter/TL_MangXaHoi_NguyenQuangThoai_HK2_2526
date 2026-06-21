package com.app.backend.repository;

import com.app.backend.entity.OtpToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    
    Optional<OtpToken> findByEmail(String email);
    
    Optional<OtpToken> findByEmailAndOtpCode(String email, String otpCode);

    long deleteByEmail(String email);
}
