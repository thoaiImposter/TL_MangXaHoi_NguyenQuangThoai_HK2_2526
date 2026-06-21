package com.app.backend.controller;

import com.app.backend.dto.AuthRequest;
import com.app.backend.dto.RegisterRequest;
import com.app.backend.dto.UserResponse;
import com.app.backend.dto.AuthResponse;
import com.app.backend.service.AuthenticatedUserService;
import com.app.backend.service.AuthTokenService;
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
    private final AuthTokenService authTokenService;
    private final AuthenticatedUserService authenticatedUserService;

    public AuthController(UserService userService, OtpService otpService, AuthTokenService authTokenService,
                          AuthenticatedUserService authenticatedUserService) {
        this.userService = userService;
        this.otpService = otpService;
        this.authTokenService = authTokenService;
        this.authenticatedUserService = authenticatedUserService;
    }

    /**
     * Ham yeu cau gui OTP dang ky den email truong.
     */
    @PostMapping("/register/request-otp")
    public ResponseEntity<?> requestRegistrationOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String role = request.getOrDefault("role", "student");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email không được để trống");
            }
            
            userService.validateRegistrationEmail(email, role);
            
            // Khong gui OTP neu email da co tai khoan.
            if (userService.isEmailRegistered(email.trim().toLowerCase())) {
                return ResponseEntity.badRequest().body("Email đã được đăng ký");
            }
            
            // Tao va gui OTP dang ky.
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
     * Ham gui lai OTP dang ky cho cung email.
     */
    @PostMapping("/register/resend-otp")
    public ResponseEntity<?> resendRegistrationOtp(@RequestBody Map<String, String> request) {
        try {
            String email = request.get("email");
            String role = request.getOrDefault("role", "student");
            
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email không được để trống");
            }
            
            userService.validateRegistrationEmail(email, role);
            
            if (userService.isEmailRegistered(email.trim().toLowerCase())) {
                return ResponseEntity.badRequest().body("Email đã được đăng ký");
            }
            
            otpService.resendOtp(email.trim().toLowerCase());
            
            return ResponseEntity.ok(Map.of(
                "message", "Mã OTP mới đã được gửi đến email của bạn",
                "expiresIn", 5
            ));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Không thể gửi OTP: " + ex.getMessage());
        }
    }

    /**
     * Ham hoan tat dang ky sau khi user nhap OTP.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            // Bat buoc co OTP truoc khi tao tai khoan.
            if (request.getOtpCode() == null || request.getOtpCode().trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Vui lòng nhập mã OTP");
            }
            
            String email = request.getEmail();
            if (email == null || email.trim().isEmpty()) {
                return ResponseEntity.badRequest().body("Email không được để trống");
            }
            
            // Kiem tra OTP co dung va con han khong.
            OtpService.VerificationResult result = otpService.verifyOtp(email.trim().toLowerCase(), request.getOtpCode().trim());
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest().body(result.getMessage());
            }
            
            // OTP dung thi tao user va tra ve token dang nhap.
            UserResponse user = userService.register(request);
            return ResponseEntity.ok(new AuthResponse(user, authTokenService.createToken(user.getId())));
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
            UserResponse user = userService.login(request);
            return ResponseEntity.ok(new AuthResponse(user, authTokenService.createToken(user.getId())));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ex.getMessage());
        }
    }

    /**
     * Get current user profile
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUserProfile(@RequestParam(required = false) Long userId) {
        return ResponseEntity.ok(userService.getProfile(authenticatedUserService.getCurrentUserId()));
    }
}
