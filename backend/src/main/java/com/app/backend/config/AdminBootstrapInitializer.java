package com.app.backend.config;

import com.app.backend.entity.User;
import com.app.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@Order(100)
public class AdminBootstrapInitializer implements CommandLineRunner {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final String email;
    private final String password;

    public AdminBootstrapInitializer(UserRepository users, PasswordEncoder passwordEncoder,
            @Value("${app.admin.bootstrap-email:}") String email,
            @Value("${app.admin.bootstrap-password:}") String password) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.email = email == null ? "" : email.trim().toLowerCase();
        this.password = password == null ? "" : password;
    }

    @Override
    public void run(String... args) {
        if (email.isBlank() || password.isBlank() || users.findByEmail(email).isPresent()) {
            return;
        }
        if (password.length() < 12) {
            throw new IllegalStateException("APP_ADMIN_PASSWORD must contain at least 12 characters");
        }
        User admin = new User();
        admin.setEmail(email);
        admin.setPassword(passwordEncoder.encode(password));
        admin.setFullName("Quản trị viên NLU Social");
        admin.setRole("admin");
        users.save(admin);
        System.out.println("[ADMIN] Bootstrap administrator created. Remove bootstrap environment variables after first login.");
    }
}
