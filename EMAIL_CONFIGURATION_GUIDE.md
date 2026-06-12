# 📧 Hướng Dẫn Cấu Hình Email Để Gửi OTP

## Tổng quan

Hệ thống đăng ký hiện tại đã được nâng cấp để **gửi OTP thực sự qua email** thay vì chỉ hiển thị trong console. Để tính năng này hoạt động, bạn cần cấu hình SMTP email.

## 🔧 Các bước cấu hình

### Bước 1: Chọn nhà cung cấp email

Bạn có thể sử dụng một trong các dịch vụ sau:

#### 1. Gmail (Khuyến nghị cho development)
- Miễn phí
- Dễ cấu hình
- Đáng tin cậy

#### 2. Outlook/Hotmail
- Miễn phí
- Tương tự Gmail

#### 3. Email doanh nghiệp (VD: name@nlusocial.edu.vn)
- Chuyên nghiệp hơn
- Cần có hosting email

### Bước 2: Cấu hình Gmail SMTP (Phổ biến nhất)

#### 2.1. Tạo App Password cho Gmail

Gmail yêu cầu sử dụng **App Password** thay vì mật khẩu thông thường:

1. **Bật xác thực 2 yếu tố (2FA)**:
   - Đăng nhập vào Gmail
   - Vào [Google Account](https://myaccount.google.com/)
   - Chọn **Security** → **2-Step Verification**
   - Bật 2FA nếu chưa bật

2. **Tạo App Password**:
   - Truy cập: https://myaccount.google.com/apppasswords
   - Chọn **Mail** và **Other (Custom name)**
   - Nhập tên: "NLU Social Backend"
   - Click **Generate**
   - **Sao chép mật khẩu 16 ký tự** (không có khoảng trắng)

#### 2.2. Cập nhật application.properties

Mở file `backend/src/main/resources/application.properties` và cập nhật:

```properties
# Email Configuration (Gmail SMTP)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000

# From email address
app.mail.from=YOUR_EMAIL@gmail.com
```

**Thay thế**:
- `YOUR_EMAIL@gmail.com` = Email Gmail của bạn
- `YOUR_APP_PASSWORD` = App Password 16 ký tự bạn vừa tạo

### Bước 3: Cấu hình Outlook/Hotmail SMTP

Nếu dùng Outlook/Hotmail:

```properties
spring.mail.host=smtp-mail.outlook.com
spring.mail.port=587
spring.mail.username=YOUR_EMAIL@outlook.com
spring.mail.password=YOUR_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
```

### Bước 4: Cấu hình Email doanh nghiệp

Nếu có email doanh nghiệp (ví dụ: noreply@nlusocial.edu.vn):

```properties
spring.mail.host=mail.nlusocial.edu.vn
spring.mail.port=587
spring.mail.username=noreply@nlusocial.edu.vn
spring.mail.password=YOUR_PASSWORD
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
```

## 🧪 Kiểm tra cấu hình

### Cách 1: Chạy backend và test

1. Khởi động backend:
```bash
cd backend
mvn spring-boot:run
```

2. Truy cập frontend và thử đăng ký với email sinh viên

3. Kiểm tra:
   - Email đến (và mục Spam/Quảng cáo)
   - Console backend xem có log thành công không

### Cách 2: Test kết nối SMTP

Tạo file test `EmailTest.java`:

```java
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
            
            // Test connection
            Transport transport = session.getTransport("smtp");
            transport.connect(host, Integer.parseInt(port), username, password);
            System.out.println("✅ Kết nối SMTP thành công!");
            transport.close();
        } catch (Exception e) {
            System.err.println("❌ Kết nối thất bại: " + e.getMessage());
        }
    }
}
```

## 🔒 Bảo mật

### Không bao giờ commit thông tin email lên Git!

1. **Thêm vào .gitignore**:
```gitignore
# Email credentials
application-local.properties
```

2. **Sử dụng environment variables** (Production):

Thay vì hardcode trong properties, dùng:

```properties
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

Sau đó set environment variables:
```bash
export MAIL_USERNAME="your-email@gmail.com"
export MAIL_PASSWORD="your-app-password"
```

## 🚨 Troubleshooting

### 1. Lỗi: "Authentication failed"
**Nguyên nhân**: Sai mật khẩu hoặc App Password
**Giải pháp**:
- Kiểm tra lại App Password (16 ký tự, không khoảng trắng)
- Đảm bảo đã bật 2FA
- Thử tạo App Password mới

### 2. Lỗi: "Could not connect to SMTP host"
**Nguyên nhân**: Sai host/port hoặc firewall
**Giải pháp**:
- Kiểm tra lại host và port
- Tắt firewall tạm thời để test
- Đảm bảo kết nối internet

### 3. Lỗi: "Connection timed out"
**Nguyên nhân**: Network issues hoặc SMTP server down
**Giải pháp**:
- Kiểm tra kết nối internet
- Thử lại sau
- Dùng SMTP khác (Outlook thay Gmail)

### 4. Email không gửi được
**Nguyên nhân**: Cấu hình sai
**Giải pháp**:
- Kiểm tra console backend để xem lỗi chi tiết
- Đảm bảo `spring.mail.properties.mail.smtp.auth=true`
- Đảm bảo `spring.mail.properties.mail.smtp.starttls.enable=true`

### 5. Email vào Spam
**Nguyên nhân**: Domain uy tín thấp
**Giải pháp**:
- Đây là bình thường với Gmail cá nhân
- Dùng email doanh nghiệp để chuyên nghiệp hơn
- Cấu hình SPF, DKIM records (cho production)

## 📝 Ví dụ cấu hình hoàn chỉnh

File: `backend/src/main/resources/application.properties`

```properties
spring.application.name=backend

# Database Configuration
spring.datasource.url=jdbc:mysql://localhost:3306/social_app?useSSL=false&serverTimezone=Asia/Bangkok&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=123456
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

spring.jpa.hibernate.ddl-auto=none
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# OTP Configuration
app.otp.expiration-minutes=5
app.otp.max-attempts=5
app.otp.resend-cooldown-seconds=30

# Email Configuration (Gmail)
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=nguyenvana@gmail.com
spring.mail.password=abcd efgh ijkl mnop
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.starttls.required=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000

# From email
app.mail.from=nguyenvana@gmail.com
```

## 🎯 Production Recommendations

### 1. Sử dụng Email Service chuyên nghiệp

Thay vì Gmail cá nhân, dùng:

- **SendGrid**: 100 emails/ngày miễn phí
- **Mailgun**: 5000 emails/tháng miễn phí
- **Amazon SES**: 62,000 emails/tháng miễn phí (từ EC2)

### 2. Cấu hình DNS records

Để email không vào spam:

- **SPF Record**: `v=spf1 include:_spf.google.com ~all`
- **DKIM**: Ký điện tử cho email
- **DMARC**: Chính sách bảo vệ domain

### 3. Rate limiting

Giới hạn số email gửi để tránh bị block:

```java
@RateLimiter(value = "10/minute")
public void sendOtpEmail(...) {
    // ...
}
```

## 📚 Tài liệu tham khảo

- [Spring Boot Email Documentation](https://docs.spring.io/spring-boot/docs/current/reference/htmlsingle/#features.email)
- [Gmail SMTP Settings](https://support.google.com/mail/answer/7126229)
- [SendGrid Documentation](https://docs.sendgrid.com/)

---

**Version:** 1.0  
**Last Updated:** 2026-01-06  
**Contact:** Support Team