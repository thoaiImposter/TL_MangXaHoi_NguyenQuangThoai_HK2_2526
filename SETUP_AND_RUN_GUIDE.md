# 🚀 Hướng Dẫn Setup Và Chạy Hệ Thống Đăng Ký OTP

## 📋 Tổng quan

Hệ thống đăng ký đã được nâng cấp lên production-ready với:
- ✅ Gửi OTP qua email thực tế
- ✅ Password hashing BCrypt
- ✅ Bảo mật nhiều lớp
- ✅ UX chuyên nghiệp

## 🔧 Các bước cài đặt

### Bước 1: Cài đặt Database

```bash
# Chạy script SQL để tạo database và tables
mysql -u root -p < database.sql
```

Hoặc nếu đã có database, chạy migration:

```bash
mysql -u root -p < migration_otp_attempt_count.sql
```

### Bước 2: Cấu hình Email (BẮT BUỘC)

Để gửi OTP qua email, bạn cần cấu hình SMTP:

1. **Chọn email provider** (Gmail, Outlook, hoặc email doanh nghiệp)

2. **Tạo App Password** (nếu dùng Gmail):
   - Bật 2FA: https://myaccount.google.com/security
   - Tạo App Password: https://myaccount.google.com/apppasswords
   - Sao chép mật khẩu 16 ký tự

3. **Cập nhật `backend/src/main/resources/application.properties`**:

```properties
# Email Configuration (Gmail)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

📖 **Chi tiết**: Xem [EMAIL_CONFIGURATION_GUIDE.md](./EMAIL_CONFIGURATION_GUIDE.md)

### Bước 3: Chạy Backend

```bash
cd backend

# Option 1: Dùng Maven (nếu đã cài)
mvn spring-boot:run

# Option 2: Dùng Maven Wrapper
./mvnw spring-boot:run  # Linux/Mac
mvnw.cmd spring-boot:run  # Windows
```

**Kiểm tra backend đã chạy**:
- Mở browser: http://localhost:8080/api/auth/login
- Nếu thấy 404 hoặc 405 (Method Not Allowed) là OK (endpoint tồn tại)

### Bước 4: Chạy Frontend

Mở terminal mới:

```bash
cd frontend

# Cài đặt dependencies (lần đầu)
npm install

# Chạy development server
npm run dev
```

**Truy cập ứng dụng**:
- Mở browser: http://localhost:5173 (hoặc port hiển thị trong terminal)
- Click "Đăng ký" để test

## 🧪 Test tính năng đăng ký

### Kịch bản test 1: Đăng ký thành công

1. **Nhập email sinh viên**: `21045678@st.hcmuaf.edu.vn`
2. **Click "Gửi mã xác thực"**
3. **Kiểm tra email** (và Spam/Quảng cáo)
4. **Nhập OTP** (6 chữ số từ email)
5. **Nhập thông tin cá nhân**:
   - Mật khẩu: `MyP@ssw0rd123` (đủ mạnh)
   - Họ tên: `Nguyễn Văn A`
   - Các trường khác (tùy chọn)
6. **Click "Đăng ký"**
7. **Thành công** → Chuyển đến `/home`

### Kịch bản test 2: OTP sai

1. Nhập email và request OTP
2. Nhập OTP sai 5 lần
3. **Lỗi**: "Mã OTP đã bị khóa do quá nhiều lần thử sai"
4. **Giải pháp**: Request OTP mới

### Kịch bản test 3: Password yếu

1. Nhập mật khẩu: `12345678` (thiếu chữ hoa, ký tự đặc biệt)
2. **Lỗi**: "Mật khẩu phải có ít nhất 1 chữ hoa"
3. **Giải pháp**: Nhập mật khẩu đủ mạnh

## 🎨 Giao diện đăng ký

### Step 1: Email
- Input email sinh viên (8 số + @st.hcmuaf.edu.vn)
- Validate format
- Check email đã đăng ký

### Step 2: OTP
- Input 6 chữ số
- Hỗ trợ paste từ clipboard
- Hiển thị countdown resend (30 giây)
- Thông báo số lần thử còn lại

### Step 3: Thông tin cá nhân
- Mật khẩu với strength indicator (5 level)
- Xác nhận mật khẩu
- Họ tên (bắt buộc)
- Khoa, lớp, niên khóa (tùy chọn)
- Avatar (file upload, max 5MB)
- Bio (textarea, max 500 ký tự)

## 🔒 Tính năng bảo mật

### 1. Password Security
- **Hashing**: BCrypt (tự động salt)
- **Yêu cầu**: 
  - Tối thiểu 8 ký tự
  - Có chữ HOA (A-Z)
  - Có chữ thường (a-z)
  - Có số (0-9)
  - Có ký tự đặc biệt (!@#$%^&*...)

### 2. OTP Security
- **Độ dài**: 6 chữ số ngẫu nhiên
- **Hiệu lực**: 5 phút
- **Giới hạn**: 5 lần thử
- **Khóa**: Tự động khóa sau 5 lần sai
- **Cooldown**: 30 giây giữa các lần resend

### 3. Email Security
- **Xác thực**: Chỉ gửi đến email đã yêu cầu
- **HTML template**: Chuyên nghiệp, có branding
- **Security note**: Cảnh báo nếu không yêu cầu

### 4. Database Security
- **Unique constraint**: Email không trùng
- **Attempt tracking**: Theo dõi số lần thử OTP
- **Auto cleanup**: Xóa OTP hết hạn mỗi giờ

## 📊 Luồng dữ liệu

```
1. User nhập email → Frontend validate
   ↓
2. Frontend gọi API /auth/register/request-otp
   ↓
3. Backend validate email format + check duplicate
   ↓
4. Backend tạo OTP (6 digits) → Lưu vào database
   ↓
5. Backend gửi email với OTP (HTML template)
   ↓
6. User nhận email → Nhập OTP vào form
   ↓
7. Frontend gọi API /auth/register với OTP + thông tin
   ↓
8. Backend verify OTP (check code, expiry, attempts)
   ↓
9. Nếu OTP đúng → Hash password (BCrypt) → Lưu user
   ↓
10. Trả về user info → Frontend login → Redirect /home
```

## 🛠️ Troubleshooting

### 1. Email không gửi được

**Triệu chứng**: Lỗi "Không thể gửi OTP"

**Kiểm tra**:
- Console backend có log lỗi SMTP không?
- Đã cấu hình đúng email/password chưa?
- Đã bật 2FA và tạo App Password chưa?

**Giải pháp**:
- Xem [EMAIL_CONFIGURATION_GUIDE.md](./EMAIL_CONFIGURATION_GUIDE.md)
- Test kết nối SMTP với công cụ bên dưới

### 2. Lỗi kết nối database

**Triệu chứng**: "Connection refused"

**Giải pháp**:
- Kiểm tra MySQL đang chạy: `mysql -u root -p`
- Đảm bảo database `social_app` tồn tại
- Kiểm tra username/password trong application.properties

### 3. Frontend không gọi được API

**Triệu chứng**: Lỗi CORS hoặc network error

**Giải pháp**:
- Đảm bảo backend đang chạy trên port 8080
- Kiểm tra BASE_URL trong `frontend/src/lib/api.ts`
- Backend đã có `@CrossOrigin(origins = "*")` nên sẽ không lỗi CORS

### 4. OTP không hoạt động

**Triệu chứng**: "Mã OTP không hợp lệ"

**Kiểm tra**:
- OTP có đúng 6 chữ số không?
- OTP còn hiệu lực (5 phút) không?
- Đã quá 5 lần thử chưa?

**Giải pháp**:
- Request OTP mới
- Kiểm tra database: `SELECT * FROM otp_tokens WHERE email = '...';`

### 5. Email vào Spam

**Triệu chứng**: Không thấy email trong Inbox

**Giải pháp**:
- Kiểm tra Spam/Quảng cáo
- Đây là bình thường với Gmail cá nhân
- Dùng email doanh nghiệp để cải thiện

## 🔍 Debug Tools

### Xem OTP trong database

```sql
USE social_app;
SELECT email, otp_code, expires_at, used, attempt_count, created_at 
FROM otp_tokens 
ORDER BY created_at DESC 
LIMIT 10;
```

### Xóa OTP cũ (test)

```sql
DELETE FROM otp_tokens WHERE expires_at < NOW();
```

### Kiểm tra user đã đăng ký

```sql
SELECT id, email, full_name, created_at 
FROM users 
ORDER BY created_at DESC;
```

### Test kết nối email (Java)

Tạo file `EmailTest.java` trong backend:

```java
package com.app.backend;

import jakarta.mail.*;
import jakarta.mail.internet.*;
import java.util.Properties;

public class EmailTest {
    public static void main(String[] args) {
        String host = "smtp.gmail.com";
        String port = "587";
        String username = "your-email@gmail.com";
        String password = "your-app-password";
        
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", port);
        
        try {
            Session session = Session.getInstance(props, new Authenticator() {
                protected PasswordAuthentication getPasswordAuthentication() {
                    return new PasswordAuthentication(username, password);
                }
            });
            
            Transport transport = session.getTransport("smtp");
            transport.connect(host, Integer.parseInt(port), username, password);
            System.out.println("✅ SMTP Connection Successful!");
            transport.close();
        } catch (Exception e) {
            System.err.println("❌ SMTP Connection Failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
```

## 📝 Checklist trước khi deploy

- [ ] Database đã được tạo và migrate
- [ ] Email SMTP đã được cấu hình và test
- [ ] Backend có thể kết nối database
- [ ] Frontend có thể gọi API backend
- [ ] Test đăng ký thành công với email thật
- [ ] Password được hash đúng (kiểm tra database)
- [ ] OTP expire sau 5 phút
- [ ] OTP lock sau 5 lần sai
- [ ] Email không vào spam (hoặc đã check spam folder)

## 🎯 Production Deployment

### 1. Environment Variables

Không hardcode credentials, dùng environment variables:

```properties
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
spring.datasource.password=${DB_PASSWORD}
```

### 2. Professional Email Service

Thay Gmail bằng:
- **SendGrid**: 100 emails/ngày free
- **Mailgun**: 5000 emails/tháng free
- **Amazon SES**: 62000 emails/tháng free (từ EC2)

### 3. HTTPS

Đảm bảo frontend và backend dùng HTTPS trong production.

### 4. Monitoring

- Log tất cả email gửi
- Theo dõi OTP success/failure rate
- Alert khi có lỗi SMTP

## 📚 Tài liệu liên quan

- [REGISTRATION_SYSTEM_GUIDE.md](./REGISTRATION_SYSTEM_GUIDE.md) - Chi tiết kỹ thuật
- [EMAIL_CONFIGURATION_GUIDE.md](./EMAIL_CONFIGURATION_GUIDE.md) - Cấu hình email
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API reference

---

**Version:** 2.0.0 (Production Ready with Email)  
**Last Updated:** 2026-01-06  
**Status:** ✅ Ready to Deploy