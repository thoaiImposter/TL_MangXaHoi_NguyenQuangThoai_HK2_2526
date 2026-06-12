package com.app.backend.service;

import com.app.backend.dto.AuthRequest;
import com.app.backend.dto.RegisterRequest;
import com.app.backend.dto.ProfileUpdateRequest;
import com.app.backend.dto.UserResponse;
import com.app.backend.entity.User;
import com.app.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;
import java.util.regex.Pattern;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository, FriendshipService friendshipService) {
        this.userRepository = userRepository;
        this.friendshipService = friendshipService;
    }

    public boolean isEmailRegistered(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    public UserResponse register(AuthRequest request) {
        // Validate email format: 8 digits + @st.hcmuaf.edu.vn (student only)
        String email = request.getEmail().trim().toLowerCase();
        Pattern emailPattern = Pattern.compile("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$");
        if (!emailPattern.matcher(email).matches()) {
            throw new IllegalArgumentException("Email phải có dạng 8 số + @st.hcmuaf.edu.vn");
        }

        // Validate password: uppercase, lowercase, number, special character
        String password = request.getPassword();
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 chữ hoa");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 chữ thường");
        }
        if (!password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 số");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email is already in use");
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(request.getFullName().trim());
        user.setRole("student");
        user.setAvatar(request.getAvatar());
        user.setBio(request.getBio());
        user.setFaculty(request.getFaculty());
        user.setClassName(request.getClassName());
        user.setAcademicYear(request.getAcademicYear());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Determine role (default: student)
        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "student";
        }
        if (!role.matches("^(student|advisor|faculty_union|school_union)$")) {
            throw new IllegalArgumentException("Role không hợp lệ. Chỉ chấp nhận: student, advisor, faculty_union, school_union");
        }

        // Validate email based on role
        if ("student".equals(role)) {
            Pattern emailPattern = Pattern.compile("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$");
            if (!emailPattern.matcher(email).matches()) {
                throw new IllegalArgumentException("Email sinh viên phải có dạng 8 số + @st.hcmuaf.edu.vn");
            }
        } else {
            // Non-student roles: just validate it's a valid email ending with @hcmuaf.edu.vn
            if (!email.endsWith("@hcmuaf.edu.vn")) {
                throw new IllegalArgumentException("Email phải có đuôi @hcmuaf.edu.vn");
            }
        }

        // Validate password: uppercase, lowercase, number, special character
        String password = request.getPassword();
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 8 ký tự");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 chữ hoa");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 chữ thường");
        }
        if (!password.matches(".*\\d.*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 số");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new IllegalArgumentException("Mật khẩu phải có ít nhất 1 ký tự đặc biệt");
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("Email đã được đăng ký");
        }

        // Validate role-specific required fields
        if ("advisor".equals(role)) {
            if (request.getAcademicTitle() == null || request.getAcademicTitle().isBlank()) {
                throw new IllegalArgumentException("Cố vấn học tập phải có học vị");
            }
            if (request.getFaculty() == null || request.getFaculty().isBlank()) {
                throw new IllegalArgumentException("Cố vấn học tập phải có khoa phụ trách");
            }
        } else if ("faculty_union".equals(role)) {
            if (request.getFaculty() == null || request.getFaculty().isBlank()) {
                throw new IllegalArgumentException("Đoàn khoa phải có khoa quản lý");
            }
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(request.getFullName().trim());
        user.setRole(role);
        user.setAvatar(request.getAvatar());
        user.setBio(request.getBio());
        user.setFaculty(request.getFaculty());
        user.setClassName(request.getClassName());
        user.setAcademicYear(request.getAcademicYear());
        user.setAcademicTitle(request.getAcademicTitle());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    public UserResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        return toResponse(user);
    }

    public UserResponse getProfile(Long id) {
        return toResponse(findUser(id));
    }

    public List<UserResponse> searchUsers(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isBlank()) {
            return userRepository.findAll().stream().map(this::toResponse).toList();
        }
        return userRepository.findByFullNameContainingIgnoreCase(normalized)
            .stream()
            .map(this::toResponse)
            .toList();
    }

    public UserResponse updateProfile(Long id, ProfileUpdateRequest request) {
        User user = findUser(id);
        if (request.getFullName() != null) user.setFullName(request.getFullName().trim());
        if (request.getAvatar() != null) user.setAvatar(request.getAvatar().trim());
        if (request.getCover() != null) user.setCover(request.getCover().trim());
        if (request.getBio() != null) user.setBio(request.getBio().trim());
        return toResponse(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Long userId, String oldPassword, String newPassword) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new IllegalArgumentException("Old password is incorrect");
        }
        if (newPassword == null || newPassword.length() < 4) {
            throw new IllegalArgumentException("New password must be at least 4 characters");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public UserResponse toggleAccountProtection(Long userId) {
        User user = findUser(userId);
        user.setAccountProtection(!Boolean.TRUE.equals(user.getAccountProtection()));
        return toResponse(userRepository.save(user));
    }

    public User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    private UserResponse toResponse(User user) {
        long friendCount = friendshipService.getFriendCount(user.getId());
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            user.getAvatar(),
            user.getCover(),
            user.getBio(),
            user.getFaculty(),
            user.getClassName(),
            user.getAcademicYear(),
            user.getAcademicTitle(),
            user.getCreatedAt(),
            friendCount,
            user.getAccountProtection()
        );
    }
}
