package com.app.backend.config;

import com.app.backend.entity.User;
import com.app.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds test accounts on application startup if they don't already exist.
 */
@Component
public class DatabaseInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DatabaseInitializer(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public void run(String... args) {
        seedAccount(
            "thanhnga@hcmuaf.edu.vn",
            "Thoai123@",
            "Thanh Nga",
            "advisor",
            "Khoa Công nghệ Thông tin",
            null,
            null,
            "Thạc sĩ"
        );

        seedAccount(
            "22130273@st.hcmuaf.edu.vn",
            "Thoai123@",
            "Nguyễn Quang Thoại",
            "student",
            "Khoa Công nghệ Thông tin",
            "CNTT01",
            "2022-2026",
            null
        );

        seedAccount(
            "doankhoa.cntt@hcmuaf.edu.vn",
            "Thoai123@",
            "Đoàn Khoa CNTT",
            "faculty_union",
            "Khoa Công nghệ Thông tin",
            null,
            null,
            null
        );

        seedAccount(
            "doantruong@hcmuaf.edu.vn",
            "Thoai123@",
            "Đoàn Trường NLU",
            "school_union",
            null,
            null,
            null,
            null
        );
    }

    private void seedAccount(String email, String password, String fullName, String role,
                             String faculty, String className, String academicYear, String academicTitle) {
        if (userRepository.findByEmail(email).isEmpty()) {
            User user = new User();
            user.setEmail(email);
            user.setPassword(passwordEncoder.encode(password));
            user.setFullName(fullName);
            user.setRole(role);
            user.setFaculty(faculty);
            user.setClassName(className);
            user.setAcademicYear(academicYear);
            user.setAcademicTitle(academicTitle);
            userRepository.save(user);
            System.out.println("[SEED] Created account: " + email + " (role: " + role + ", pass: " + password + ")");
        } else {
            System.out.println("[SEED] Account already exists: " + email);
        }
    }
}
