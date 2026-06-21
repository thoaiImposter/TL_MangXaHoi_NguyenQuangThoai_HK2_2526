package com.app.backend.service;

import com.app.backend.dto.AuthRequest;
import com.app.backend.dto.RegisterRequest;
import com.app.backend.dto.ProfileUpdateRequest;
import com.app.backend.dto.UserResponse;
import com.app.backend.entity.Faculty;
import com.app.backend.entity.Major;
import com.app.backend.entity.User;
import com.app.backend.repository.FacultyRepository;
import com.app.backend.repository.MajorRepository;
import com.app.backend.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;

@Service
public class UserService {

    private static final Pattern STUDENT_EMAIL_PATTERN = Pattern.compile("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$");
    private static final Set<String> FACULTIES = Set.of(
        "Khoa Cơ khí - Công nghệ", "Khoa Chăn nuôi Thú y", "Khoa Công nghệ Hóa học và Thực phẩm",
        "Khoa Công nghệ Thông tin", "Khoa Kinh tế", "Khoa Lâm nghiệp", "Khoa Môi trường và Tài nguyên",
        "Khoa Ngoại ngữ - Sư phạm", "Khoa Nông học", "Khoa Quản lý đất đai và Bất động sản",
        "Khoa Sinh học", "Khoa Thủy sản"
    );
    private static final Set<String> ACADEMIC_TITLES = Set.of("Thạc sĩ", "Tiến sĩ", "PGS. Tiến sĩ", "GS. Tiến sĩ");

    private final UserRepository userRepository;
    private final FriendshipService friendshipService;
    private final MajorRepository majorRepository;
    private final FacultyRepository facultyRepository;
    private final CloudinaryCleanupService cloudCleanup;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public UserService(UserRepository userRepository, FriendshipService friendshipService, MajorRepository majorRepository,
                       FacultyRepository facultyRepository, CloudinaryCleanupService cloudCleanup) {
        this.userRepository = userRepository;
        this.friendshipService = friendshipService;
        this.majorRepository = majorRepository;
        this.facultyRepository = facultyRepository;
        this.cloudCleanup = cloudCleanup;
    }

    /**
     * Ham kiem tra email da ton tai trong he thong chua.
     */
    public boolean isEmailRegistered(String email) {
        return userRepository.findByEmail(email).isPresent();
    }

    /**
     * Ham dang ky cu cho tai khoan sinh vien bang email truong.
     */
    public UserResponse register(AuthRequest request) {
        // Kiem tra email sinh vien co dung mau 8 so + domain truong.
        String email = request.getEmail().trim().toLowerCase();
        Pattern emailPattern = Pattern.compile("^\\d{8}@st\\.hcmuaf\\.edu\\.vn$");
        if (!emailPattern.matcher(email).matches()) {
            throw new IllegalArgumentException("Email phải có dạng 8 số + @st.hcmuaf.edu.vn");
        }

        // Kiem tra mat khau du do manh toi thieu.
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

    /**
     * Ham dang ky moi co ho tro OTP va nhieu vai tro: student/advisor/faculty_union/school_union.
     */
    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // Neu frontend khong gui role thi mac dinh la sinh vien.
        String role = request.getRole();
        if (role == null || role.isBlank()) {
            role = "student";
        }
        if (!role.matches("^(student|advisor|faculty_union|school_union)$")) {
            throw new IllegalArgumentException("Role không hợp lệ. Chỉ chấp nhận: student, advisor, faculty_union, school_union");
        }

        validateRegistrationEmail(email, role);

        // Kiem tra mat khau du do manh toi thieu.
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

        // Kiem tra cac truong bat buoc rieng theo tung vai tro.
        if ("student".equals(role)) {
            if (request.getFacultyId() == null) throw new IllegalArgumentException("Sinh viên phải chọn khoa");
            requireValue(request.getClassName(), "Sinh viên phải có lớp");
            requireValue(request.getAcademicYear(), "Sinh viên phải chọn niên khóa");
            if (request.getMajorId() == null) throw new IllegalArgumentException("Sinh viên phải chọn ngành");
        } else if ("advisor".equals(role)) {
            if (request.getAcademicTitle() == null || request.getAcademicTitle().isBlank()) {
                throw new IllegalArgumentException("Cố vấn học tập phải có học vị");
            }
            if (request.getFacultyId() == null) {
                throw new IllegalArgumentException("Cố vấn học tập phải có khoa phụ trách");
            }
        } else if ("faculty_union".equals(role)) {
            if (request.getFacultyId() == null) {
                throw new IllegalArgumentException("Đoàn khoa phải có khoa quản lý");
            }
        }

        User user = new User();
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(password));
        user.setFullName(request.getFullName().trim());
        user.setRole(role);
        user.setAvatar(request.getAvatar());
        user.setCover(request.getCover());
        user.setBio(request.getBio());
        applyRoleProfileFields(user, role, request.getFacultyId(), request.getFaculty(), request.getClassName(),
            request.getAcademicYear(), request.getAcademicTitle(), request.getMajorId());
        User saved = userRepository.save(user);
        return toResponse(saved);
    }

    /**
     * Ham dang nhap, kiem tra email/mat khau va chan tai khoan bi khoa.
     */
    public UserResponse login(AuthRequest request) {
        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
            .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        if (Boolean.TRUE.equals(user.getAccountLocked())) {
            throw new IllegalArgumentException("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }
        return toResponse(user);
    }

    /**
     * Ham lay thong tin ho so theo id.
     */
    public UserResponse getProfile(Long id) {
        return toResponse(findUser(id));
    }

    /**
     * Ham tim user theo ten, uu tien ket qua trung hoac bat dau bang tu khoa.
     */
    public List<UserResponse> searchUsers(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isBlank()) {
            return userRepository.findAll().stream().map(this::toResponse).toList();
        }
        return userRepository.findByFullNameContainingIgnoreCase(normalized)
            .stream()
            .sorted((left, right) -> {
                String keyword = normalized.toLowerCase();
                String leftName = left.getFullName().toLowerCase();
                String rightName = right.getFullName().toLowerCase();
                int leftRank = leftName.equals(keyword) ? 0 : leftName.startsWith(keyword) ? 1 : 2;
                int rightRank = rightName.equals(keyword) ? 0 : rightName.startsWith(keyword) ? 1 : 2;
                int rankComparison = Integer.compare(leftRank, rightRank);
                return rankComparison != 0 ? rankComparison : leftName.compareTo(rightName);
            })
            .limit(30)
            .map(this::toResponse)
            .toList();
    }

    /**
     * Ham lay danh sach Doan khoa cho tai khoan Doan truong gui thong bao.
     */
    public List<UserResponse> getFacultyUnionsForSchoolUnion(Long requesterId) {
        User requester = findUser(requesterId);
        if (!"school_union".equals(requester.getRole())) {
            throw new IllegalArgumentException("Chỉ Đoàn trường được dùng danh sách liên hệ Đoàn khoa");
        }
        return userRepository.findByRole("faculty_union").stream()
            .map(this::toResponse)
            .toList();
    }

    /**
     * Ham cap nhat ho so va len lich xoa anh cu neu avatar/cover bi thay doi.
     */
    @Transactional
    public UserResponse updateProfile(Long id, ProfileUpdateRequest request) {
        User user = findUser(id);
        List<String> replacedAssets = new java.util.ArrayList<>();
        if (request.getFullName() != null) user.setFullName(request.getFullName().trim());
        if (request.getAvatar() != null) {
            if (!java.util.Objects.equals(user.getAvatar(), request.getAvatar().trim())) replacedAssets.add(user.getAvatar());
            user.setAvatar(request.getAvatar().trim());
        }
        if (request.getCover() != null) {
            if (!java.util.Objects.equals(user.getCover(), request.getCover().trim())) replacedAssets.add(user.getCover());
            user.setCover(request.getCover().trim());
        }
        if (request.getBio() != null) user.setBio(request.getBio().trim());
        if (hasRoleProfileUpdate(request)) {
            applyRoleProfileFields(user, user.getRole(), request.getFacultyId(), request.getFaculty(), request.getClassName(),
                request.getAcademicYear(), request.getAcademicTitle(), request.getMajorId());
        }
        UserResponse response = toResponse(userRepository.save(user));
        cloudCleanup.schedule(replacedAssets);
        return response;
    }

    /**
     * Ham kiem tra request co cap nhat thong tin hoc vu/vai tro hay khong.
     */
    private boolean hasRoleProfileUpdate(ProfileUpdateRequest request) {
        return request.getFacultyId() != null
            || request.getFaculty() != null
            || request.getClassName() != null
            || request.getAcademicYear() != null
            || request.getAcademicTitle() != null
            || request.getMajorId() != null;
    }

    /**
     * Ham validate email dang ky theo role.
     */
    public void validateRegistrationEmail(String rawEmail, String role) {
        String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
        if (role == null || !role.matches("^(student|advisor|faculty_union|school_union)$")) {
            throw new IllegalArgumentException("Role không hợp lệ");
        }
        if ("student".equals(role)) {
            if (!STUDENT_EMAIL_PATTERN.matcher(email).matches()) {
                throw new IllegalArgumentException("Email sinh viên phải có dạng 8 số + @st.hcmuaf.edu.vn");
            }
            return;
        }
        if (!email.matches("^[^\\s@]+@hcmuaf\\.edu\\.vn$")) {
            throw new IllegalArgumentException("Email phải có đuôi @hcmuaf.edu.vn");
        }
    }

    /**
     * Ham gan cac truong profile rieng theo role cua user.
     */
    private void applyRoleProfileFields(User user, String role, Long facultyId, String faculty, String className,
                                        String academicYear, String academicTitle, Long majorId) {
        if ("student".equals(role)) {
            Faculty selectedFaculty = resolveFaculty(facultyId, faculty, user.getFaculty());
            if (selectedFaculty != null) user.setFaculty(selectedFaculty.getName());
            if (className != null) user.setClassName(clean(className));
            if (academicYear != null) user.setAcademicYear(validateAcademicYear(academicYear));
            if (majorId != null) user.setMajor(findActiveMajor(majorId, selectedFaculty == null ? user.getFaculty() : selectedFaculty.getName()));
            user.setAcademicTitle(null);
            return;
        }
        if ("advisor".equals(role)) {
            Faculty selectedFaculty = resolveFaculty(facultyId, faculty, user.getFaculty());
            if (selectedFaculty != null) user.setFaculty(selectedFaculty.getName());
            if (academicTitle != null) user.setAcademicTitle(validateAcademicTitle(academicTitle));
            user.setClassName(null);
            user.setAcademicYear(null);
            user.setMajor(null);
            return;
        }
        if ("faculty_union".equals(role)) {
            Faculty selectedFaculty = resolveFaculty(facultyId, faculty, user.getFaculty());
            if (selectedFaculty != null) user.setFaculty(selectedFaculty.getName());
            user.setClassName(null);
            user.setAcademicYear(null);
            user.setAcademicTitle(null);
            user.setMajor(null);
            return;
        }
        user.setFaculty(null);
        user.setClassName(null);
        user.setAcademicYear(null);
        user.setAcademicTitle(null);
        user.setMajor(null);
    }

    /**
     * Ham tim nganh dang active va dung khoa da chon.
     */
    private Major findActiveMajor(Long majorId, String facultyName) {
        Major major = majorRepository.findById(majorId)
            .orElseThrow(() -> new IllegalArgumentException("Ngành đào tạo không tồn tại"));
        if (!Boolean.TRUE.equals(major.getActive())) throw new IllegalArgumentException("Ngành đào tạo hiện không tuyển sinh");
        if (major.getFaculty() == null || !major.getFaculty().getName().equals(facultyName)) {
            throw new IllegalArgumentException("Ngành đào tạo không thuộc khoa đã chọn");
        }
        return major;
    }

    /**
     * Ham lay khoa tu facultyId hoac ten khoa cu.
     */
    private Faculty resolveFaculty(Long facultyId, String legacyFaculty, String currentFaculty) {
        if (facultyId != null) {
            Faculty faculty = facultyRepository.findById(facultyId)
                .orElseThrow(() -> new IllegalArgumentException("Khoa không tồn tại"));
            if (!Boolean.TRUE.equals(faculty.getActive())) throw new IllegalArgumentException("Khoa hiện không hoạt động");
            return faculty;
        }
        String fallback = clean(legacyFaculty);
        if (fallback == null) fallback = clean(currentFaculty);
        if (fallback == null) return null;
        final String facultyName = fallback;
        return facultyRepository.findByActiveTrueOrderByNameAsc().stream()
            .filter(item -> item.getName().equals(facultyName))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Khoa không hợp lệ"));
    }

    /**
     * Ham validate nien khoa theo mau Kxx (yyyy - yyyy).
     */
    private String validateAcademicYear(String value) {
        String cleaned = clean(value);
        if (cleaned == null || !cleaned.matches("^K\\d{2} \\(20\\d{2} - 20\\d{2}\\)$")) {
            throw new IllegalArgumentException("Niên khóa không hợp lệ");
        }
        int cohort = Integer.parseInt(cleaned.substring(1, 3));
        int start = Integer.parseInt(cleaned.substring(5, 9));
        int end = Integer.parseInt(cleaned.substring(12, 16));
        if (start < 2016 || start > 2026 || start % 100 != cohort || end != start + 4) {
            throw new IllegalArgumentException("Niên khóa phải từ K16 (2016 - 2020) đến K26 (2026 - 2030)");
        }
        return cleaned;
    }

    /**
     * Ham validate ten khoa legacy.
     */
    private String validateFaculty(String value) {
        String cleaned = clean(value);
        if (cleaned == null || !FACULTIES.contains(cleaned)) throw new IllegalArgumentException("Khoa không hợp lệ");
        return cleaned;
    }

    /**
     * Ham validate hoc vi cua co van.
     */
    private String validateAcademicTitle(String value) {
        String cleaned = clean(value);
        if (cleaned == null || !ACADEMIC_TITLES.contains(cleaned)) throw new IllegalArgumentException("Học vị không hợp lệ");
        return cleaned;
    }

    /**
     * Ham trim chuoi va doi chuoi rong thanh null.
     */
    private String clean(String value) {
        if (value == null) return null;
        String cleaned = value.trim();
        return cleaned.isEmpty() ? null : cleaned;
    }

    /**
     * Ham bat buoc mot gia tri khong duoc rong.
     */
    private void requireValue(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
    }

    /**
     * Ham doi mat khau sau khi kiem tra mat khau cu.
     */
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

    /**
     * Ham bat/tat che do bao ve tai khoan.
     */
    @Transactional
    public UserResponse setAccountProtection(Long userId, Boolean enabled) {
        User user = findUser(userId);
        user.setAccountProtection(Boolean.TRUE.equals(enabled));
        return toResponse(userRepository.save(user));
    }

    /**
     * Ham tim user, neu khong co thi nem loi dung chung cho service khac.
     */
    public User findUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    /**
     * Ham chuyen User entity sang UserResponse de tra ve frontend.
     */
    private UserResponse toResponse(User user) {
        long friendCount = friendshipService.getFriendCount(user.getId());
        Major major = user.getMajor();
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
            major == null ? null : major.getId(),
            major == null ? null : major.getCode(),
            major == null ? null : major.getName(),
            major == null ? null : major.getCampus(),
            user.getCreatedAt(),
            friendCount,
            user.getAccountProtection()
        );
    }
}
