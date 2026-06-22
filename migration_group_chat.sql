-- FILE NÀY CHỈ CHỨA DATA TEST BỔ SUNG
-- HÃY CHẠY FILE NÀY SAU KHI ĐÃ CHẠY FILE SCRIPT PHẦN KHUNG (SCHEMA) ĐẦU TIÊN
USE social_app;
SET NAMES utf8mb4;

-- ============================================================
-- PHẦN 1: CHÈN DỮ LIỆU 5 GIẢNG VIÊN (TÊN TUỔI RÕ RÀNG)
-- Toàn bộ dùng chung mật khẩu: Thoai123@ 
-- (Mã băm BCrypt: $2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS)
-- ============================================================

INSERT IGNORE INTO users (
    email, password, full_name, role, bio, faculty, academic_title, account_protection, account_locked, created_at, updated_at
) VALUES
-- 2 Giảng viên thuộc Khoa Công nghệ Thông tin
('hoangnam@hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Nguyễn Hoàng Nam', 'advisor', 'Giảng viên chuyên ngành Kỹ thuật phần mềm', 'Khoa Công nghệ Thông tin', 'Thạc sĩ', FALSE, FALSE, NOW(6), NOW(6)),
('minhtue@hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Trần Minh Tuệ', 'advisor', 'Giảng viên chuyên ngành Hệ thống thông tin', 'Khoa Công nghệ Thông tin', 'Tiến sĩ', FALSE, FALSE, NOW(6), NOW(6)),

-- 2 Giảng viên thuộc Khoa Kinh tế
('thanhson@hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Phạm Thanh Sơn', 'advisor', 'Giảng viên bộ môn Quản trị kinh doanh', 'Khoa Kinh tế', 'Thạc sĩ', FALSE, FALSE, NOW(6), NOW(6)),
('khanhchi@hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Lê Khánh Chi', 'advisor', 'Giảng viên bộ môn Kế toán tài chính', 'Khoa Kinh tế', 'Thạc sĩ', FALSE, FALSE, NOW(6), NOW(6)),

-- 1 Giảng viên thuộc Khoa Cơ khí - Công nghệ
('quocbao@hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Trần Quốc Bảo', 'advisor', 'Giảng viên bộ môn Công nghệ kỹ thuật ô tô', 'Khoa Cơ khí - Công nghệ', 'Tiến sĩ', FALSE, FALSE, NOW(6), NOW(6));


-- ============================================================
-- PHẦN 2: CHÈN DỮ LIỆU 30 SINH VIÊN (TÊN TUỔI, KHOA, NGÀNH CHI TIẾT)
-- Mã số sinh viên chạy từ 22130001 đến 22130030
-- Toàn bộ dùng chung mật khẩu: Thoai123@
-- ============================================================

INSERT IGNORE INTO users (
    email, password, full_name, role, bio, faculty, class_name, academic_year, major_id, account_protection, account_locked, created_at, updated_at
) VALUES
-- Nhóm 1: 10 Sinh viên thuộc Khoa Công nghệ Thông tin (Ngành CNTT hoặc Hệ thống thông tin)
('22130001@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Nguyễn Anh Tuấn', 'student', 'Sinh viên K22 khoa CNTT', 'Khoa Công nghệ Thông tin', 'DH22_CN01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130002@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Trần Thị Thanh Tuyền', 'student', 'Sinh viên đam mê lập trình Web', 'Khoa Công nghệ Thông tin', 'DH22_CN01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130003@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Lê Hoàng Long', 'student', 'Lớp phó học tập DH22_CN01', 'Khoa Công nghệ Thông tin', 'DH22_CN01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130004@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Phạm Minh Đức', 'student', 'Sinh viên K22 Hệ thống thông tin', 'Khoa Công nghệ Thông tin', 'DH22_IS01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480104'), FALSE, FALSE, NOW(6), NOW(6)),
('22130005@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Vũ Hoàng Yến', 'student', 'Thành viên CLB Tin học NLU', 'Khoa Công nghệ Thông tin', 'DH22_IS01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480104'), FALSE, FALSE, NOW(6), NOW(6)),
('22130006@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Nguyễn Minh Triết', 'student', 'Sinh viên K22 khoa CNTT', 'Khoa Công nghệ Thông tin', 'DH22_CN02', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130007@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Đặng Thùy Dương', 'student', 'Sinh viên K22 khoa CNTT', 'Khoa Công nghệ Thông tin', 'DH22_CN02', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130008@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Bùi Quốc Anh', 'student', 'Đam mê mảng Mobile Android', 'Khoa Công nghệ Thông tin', 'DH22_CN02', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130009@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Đỗ Gia Bảo', 'student', 'Sinh viên K22 Hệ thống thông tin', 'Khoa Công nghệ Thông tin', 'DH22_IS01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480104'), FALSE, FALSE, NOW(6), NOW(6)),
('22130010@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Hoàng Ngọc Hà', 'student', 'Sinh viên K22 khoa CNTT', 'Khoa Công nghệ Thông tin', 'DH22_CN01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7480201'), FALSE, FALSE, NOW(6), NOW(6)),

-- Nhóm 2: 10 Sinh viên thuộc Khoa Kinh tế (Ngành Kinh tế, Quản trị kinh doanh, Kế toán)
-- Lưu ý: Kiểm tra email tránh trùng với acc 22130273 ở file gốc
('22130011@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Nguyễn Văn Nam', 'student', 'Sinh viên ngành Quản trị kinh doanh', 'Khoa Kinh tế', 'DH22_QT01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7340101'), FALSE, FALSE, NOW(6), NOW(6)),
('22130012@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Trần Thu Hà', 'student', 'Sinh viên ngành Kế toán', 'Khoa Kinh tế', 'DH22_KT01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7340301'), FALSE, FALSE, NOW(6), NOW(6)),
('22130013@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Lê Minh Khôi', 'student', 'Lớp trưởng lớp DH22_QT01', 'Khoa Kinh tế', 'DH22_QT01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7340101'), FALSE, FALSE, NOW(6), NOW(6)),
('22130014@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Phạm Quỳnh Anh', 'student', 'Thành viên Ban chấp hành Đoàn khoa Kinh tế', 'Khoa Kinh tế', 'DH22_KT02', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7340301'), FALSE, FALSE, NOW(6), NOW(6)),
('22130015@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Hoàng Công Vinh', 'student', 'Sinh viên ngành Kinh tế', 'Khoa Kinh tế', 'DH22_MA01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7310101'), FALSE, FALSE, NOW(6), NOW(6)),
('22130016@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Nguyễn Thùy Linh', 'student', 'Sinh viên ngành Quản trị kinh doanh', 'Khoa Kinh tế', 'DH22_QT02', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7340101'), FALSE, FALSE, NOW(6), NOW(6)),
('22130017@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Trần Nguyên Khang', 'student', 'Sinh viên ngành Kinh doanh nông nghiệp', 'Khoa Kinh tế', 'DH22_BA01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7620114'), FALSE, FALSE, NOW(6), NOW(6)),
('22130018@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Vũ Tiến Đạt', 'student', 'Sinh viên ngành Kế toán', 'Khoa Kinh tế', 'DH22_KT01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7340301'), FALSE, FALSE, NOW(6), NOW(6)),
('22130019@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Phan Bảo Ngọc', 'student', 'Sinh viên ngành Phát triển nông thôn', 'Khoa Kinh tế', 'DH22_RD01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7620116'), FALSE, FALSE, NOW(6), NOW(6)),
('22130020@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Lý Hải Đăng', 'student', 'Sinh viên ngành Quản trị kinh doanh', 'Khoa Kinh tế', 'DH22_QT01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7340101'), FALSE, FALSE, NOW(6), NOW(6)),

-- Nhóm 3: 10 Sinh viên thuộc Khoa Cơ khí - Công nghệ (Ngành CNKT Ô tô, Cơ khí, Cơ điện tử, Nhiệt)
('22130021@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Đặng Quốc Huy', 'student', 'Sinh viên ngành Công nghệ kỹ thuật ô tô', 'Khoa Cơ khí - Công nghệ', 'DH22_AU01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7510205'), FALSE, FALSE, NOW(6), NOW(6)),
('22130022@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Nguyễn Hoàng Giang', 'student', 'Sinh viên ngành Công nghệ kỹ thuật cơ khí', 'Khoa Cơ khí - Công nghệ', 'DH22_ME01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7510201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130023@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Trần Văn Hùng', 'student', 'Sinh viên ngành Công nghệ kỹ thuật cơ - điện tử', 'Khoa Cơ khí - Công nghệ', 'DH22_MC01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7510203'), FALSE, FALSE, NOW(6), NOW(6)),
('22130024@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Bùi Xuân Trường', 'student', 'Sinh viên ngành Kỹ thuật điều khiển và tự động hóa', 'Khoa Cơ khí - Công nghệ', 'DH22_AC01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7520216'), FALSE, FALSE, NOW(6), NOW(6)),
('22130025@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Lê Đình Duy', 'student', 'Sinh viên ngành Công nghệ kỹ thuật ô tô', 'Khoa Cơ khí - Công nghệ', 'DH22_AU01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7510205'), FALSE, FALSE, NOW(6), NOW(6)),
('22130026@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Phạm Tấn Tài', 'student', 'Sinh viên ngành Công nghệ kỹ thuật nhiệt', 'Khoa Cơ khí - Công nghệ', 'DH22_TE01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7510206'), FALSE, FALSE, NOW(6), NOW(6)),
('22130027@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Nguyễn Minh Quân', 'student', 'Sinh viên ngành Công nghệ kỹ thuật năng lượng tái tạo', 'Khoa Cơ khí - Công nghệ', 'DH22_RE01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7519007'), FALSE, FALSE, NOW(6), NOW(6)),
('22130028@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Võ Thành Ý', 'student', 'Sinh viên ngành Công nghệ kỹ thuật ô tô', 'Khoa Cơ khí - Công nghệ', 'DH22_AU02', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7510205'), FALSE, FALSE, NOW(6), NOW(6)),
('22130029@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Đỗ Thành Vinh', 'student', 'Sinh viên ngành Công nghệ kỹ thuật cơ khí', 'Khoa Cơ khí - Công nghệ', 'DH22_ME01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7510201'), FALSE, FALSE, NOW(6), NOW(6)),
('22130030@st.hcmuaf.edu.vn', '$2a$10$5CmseHv4gowuWPyCxsQqiur2HkMHkbwxkHqxocQfoNzGC4q2IHGpS', 'Hồ Sĩ Nguyên', 'student', 'Sinh viên ngành Kỹ thuật điều khiển và tự động hóa', 'Khoa Cơ khí - Công nghệ', 'DH22_AC01', 'K22 (2022 - 2026)', (SELECT id FROM majors WHERE code = '7520216'), FALSE, FALSE, NOW(6), NOW(6));

-- ============================================================
-- SCRIPT HOÀN THÀNH - DỮ LIỆU MOCK DATA ĐÃ ĐƯỢC CHÈN THÀNH CÔNG
-- ============================================================
