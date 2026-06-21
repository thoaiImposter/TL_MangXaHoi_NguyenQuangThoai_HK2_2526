package com.app.backend.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Order(-100)
public class ReportSchemaInitializer implements CommandLineRunner {
    private final JdbcTemplate jdbcTemplate;

    public ReportSchemaInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            jdbcTemplate.execute("ALTER TABLE users ADD COLUMN account_locked BOOLEAN NOT NULL DEFAULT FALSE");
        } catch (Exception ignored) {
            // Existing installations already containing the column need no migration.
        }
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id BIGINT NOT NULL AUTO_INCREMENT,
                reporter_id BIGINT NOT NULL,
                target_type VARCHAR(20) NOT NULL,
                target_id BIGINT NOT NULL,
                target_owner_id BIGINT NULL,
                target_title VARCHAR(500) NULL,
                target_snapshot VARCHAR(3000) NULL,
                reason VARCHAR(50) NOT NULL,
                details VARCHAR(1000) NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                resolution VARCHAR(30) NULL,
                admin_note VARCHAR(1000) NULL,
                handled_by_id BIGINT NULL,
                created_at DATETIME(6) NOT NULL,
                handled_at DATETIME(6) NULL,
                PRIMARY KEY (id),
                KEY idx_reports_status_created (status, created_at),
                KEY idx_reports_target (target_type, target_id),
                KEY idx_reports_reporter (reporter_id),
                CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
                CONSTRAINT fk_reports_handled_by FOREIGN KEY (handled_by_id) REFERENCES users (id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
            """);
    }
}
