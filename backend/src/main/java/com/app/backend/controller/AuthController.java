package com.app.backend.controller;

import com.app.backend.dto.AuthRequest;
import com.app.backend.dto.RegisterRequest;
import com.app.backend.dto.UserResponse;
import com.app.backend.service.UserService;
import com.app.backend.service.OtpService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserService userService;
    private final OtpService otpService;

    public AuthController(UserService userService, OtpService otpService) {
        this.userService = userService;
        this.otpService = otpService;
    }

    /**
     * Step 1: Request OTP for registration
     * Send OTP to the user's email
     */
    @PostMapping("/register/request-otp")
    public ResponseEntity<?> requestRegistrationOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String role = request.getOrDefault("role", "student");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email không được để trống");
            }
            
            // Validate email format based on role
            if ("student".equals(role)) {
                if (!email.matches("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$")) {
                    return ResponseEntity.badRequest().body("Email sinh viên phải có dạng 8 số + @st.hcmuaf.edu.vn");
                }
            } else {
                if (!email.endsWith("@hcmuaf.edu.vn")) {
                    return ResponseEntity.badRequest().body("Email phải có đuôi @hcmuaf.edu.vn");
                }
            }
            
            // Check if email is already registered
            if (userService.isEmailRegistered(email.trim().toLowerCase())) {
                return ResponseEntity.badRequest().body("Email đã được đăng ký");
            }
            
            // Send OTP
            otpService.sendRegistrationOtp(email.trim().toLowerCase());
            
            return ResponseEntity.ok(Map.of(
                "message", "Mã OTP đã được gửi đến email của bạn. Kiểm tra console backend để lấy mã.",
                "expiresIn", 5, // minutes
                "maxAttempts", 5,
                "resendCooldown", 30 // seconds
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Không thể gửi OTP: " + ex.getMessage());
        }
    }

    /**
     * Step 2: Resend OTP
     */
    @PostMapping("/register/resend-otp")
    public ResponseEntity<?> resendRegistrationOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String role = request.getOrDefault("role", "student");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email không được để trống");
            }
            
            if ("student".equals(role)) {
                if (!email.matches("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$")) {
                    return ResponseEntity.badRequest().body("Email sinh viên phải có dạng 8 số + @st.hcmuaf.edu.vn");
                }
            } else {
                if (!email.endsWith("@hcmuaf.edu.vn")) {
                    return ResponseEntity.badRequest().body("Email phải có đuôi @hcmuaf.edu.vn");
                }
            }
            
            if (userService.isEmailRegistered(email.trim().toLowerCase())) {
                return ResponseEntity.badRequest().body("Email đã được đăng ký");
            }
            
            otpService.resendOtp(email.trim().toLowerCase());
            
            return ResponseEntity.ok(Map.of(
                "message", "Mã OTP mới đã được gửi đến email của bạn",
                "expiresIn", 5
            ));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Không thể gửi OTP: " + ex.getMessage());
        }
    }

    /**
     * Step 3: Complete registration with OTP verification
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Validate OTP first
            if (request.getOtpCode() == null || request.getOtpCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Vui lòng nhập mã OTP");
            }
            
            String email = request.getEmail();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email không được để trống");
            }
            
            // Verify OTP
            OtpService.VerificationResult result = otpService.verifyOtp(email.trim().toLowerCase(), request.getOtpCode().trim());
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest().body(result.getMessage());
            }
            
            // Proceed with registration
            return ResponseEntity.ok(userService.register(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (DataIntegrityViolationException ex) {
            return ResponseEntity.badRequest().body("Dữ liệu không hợp lệ");
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Đăng ký thất bại: " + ex.getMessage());
        }
    }

    /**
     * Legacy login endpoint
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest request) {
        try {
            return ResponseEntity.ok(userService.login(request));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
        }
    }

    /**
     * Get current user profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUserProfile(@RequestParam Long userId) {
        return ResponseEntity.ok(userService.getProfile(userId));
    }
}