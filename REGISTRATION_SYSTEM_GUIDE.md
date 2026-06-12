# Hệ Thống Đăng Ký OTP - Production Ready

## Tổng quan

Hệ thống đăng ký đã được nâng cấp lên production-ready với các tính năng bảo mật và trải nghiệm người dùng chuyên nghiệp:

### ✅ Tính năng đã hoàn thiện

1. **Gửi OTP xác thực email**
   - OTP 6 chữ số ngẫu nhiên
   - Hiệu lực 5 phút
   - Giới hạn 5 lần thử sai
   -Cooldown 30 giây khi gửi lại

2. **Bảo mật mật khẩu**
   - Hash BCrypt tự động
   - Yêu cầu độ mạnh mật khẩu:
     * Tối thiểu 8 ký tự
     * Có chữ hoa (A-Z)
     * Có chữ thường (a-z)
     * Có số (0-9)
     * Có ký tự đặc biệt (!@#$%^&*...)

3. **Trải nghiệm người dùng**
   - Giao diện 3 bước rõ ràng
   - Hiển thị độ mạnh mật khẩu trực quan
   - Hỗ trợ paste OTP
   - Tự động focus input
   - Thông báo lỗi chi tiết
   - Đếm ngược thời gian chờ

## 📋 Chi tiết kỹ thuật

### Backend Changes

#### 1. OtpToken Entity (Mới)
```java
@Entity
@Table(name = "otp_tokens")
public class OtpToken {
    private String email;
    private String otpCode;
    private LocalDateTime expiresAt;
    private boolean used;
    private int attemptCount; // MỚI: Theo dõi số lần thử
    private LocalDateTime createdAt;
    
    public boolean isLocked() {
        return attemptCount >= 5; // Khóa sau 5 lần thử sai
    }
    
    public boolean isValid() {
        return !used && !isExpired() && !isLocked();
    }
}
```

#### 2. OtpService (Nâng cấp)
```java
@Service
public class OtpService {
    // Cấu hình từ application.properties
    @Value("${app.otp.expiration-minutes}")
    private int expirationMinutes; // 5 phút
    
    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts; // 5 lần thử
    
    @Value("${app.otp.resend-cooldown-seconds:30}")
    private int resendCooldownSeconds; // 30 giây chờ
    
    // Kết quả xác minh chi tiết
    public VerificationResult verifyOtp(String email, String otpCode) {
        // Trả về thông tin chi tiết về lý do thất bại
        if (token.isLocked()) {
            return new VerificationResult(false, 
                "Mã OTP đã bị khóa do quá nhiều lần thử sai.");
        }
        // ...
    }
}
```

#### 3. AuthController (Nâng cấp)
```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    
    @PostMapping("/register/request-otp")
    public ResponseEntity<?> requestRegistrationOtp(@RequestBody Map<String, String> request) {
        // Trả về thông tin cấu hình OTP
        return ResponseEntity.ok(Map.of(
            "message", "Mã OTP đã được gửi...",
            "expiresIn", 5,
            "maxAttempts", 5,
            "resendCooldown", 30
        ));
    }
    
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        // Xác minh OTP với kết quả chi tiết
        OtpService.VerificationResult result = 
            otpService.verifyOtp(email, otpCode);
        
        if (!result.isSuccess()) {
            return ResponseEntity.badRequest()
                .body(result.getMessage());
        }
        // ...
    }
}
```

### Frontend Changes

#### 1. RegisterPage (Nâng cấp)
```typescript
function RegisterPage({ onAuth }: { onAuth: (user: User) => void }) {
  // Quản lý cấu hình OTP từ server
  const [otpConfig, setOtpConfig] = useState({
    expiresIn: 5,
    maxAttempts: 5,
    resendCooldown: 30,
  });
  
  // Hiển thị độ mạnh mật khẩu
  const getPasswordStrengthScore = () => {
    return Object.values(passwordStrength).filter(Boolean).length;
  };
  
  const getPasswordStrengthLabel = () => {
    const score = getPasswordStrengthScore();
    if (score <= 2) return { text: 'Yếu', color: '#ef4444' };
    if (score <= 3) return { text: 'Trung bình', color: '#f59e0b' };
    if (score <= 4) return { text: 'Mạnh', color: '#3b82f6' };
    return { text: 'Rất mạnh', color: '#22c55e' };
  };
}
```

### Database Schema

#### OTP Tokens Table (Updated)
```sql
CREATE TABLE otp_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  expires_at DATETIME(6) NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  attempt_count INT NOT NULL DEFAULT 0, -- MỚI
  created_at DATETIME(6) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_otp_tokens_email (email)
) ENGINE=InnoDB;
```

## 🚀 Hướng dẫn sử dụng

### 1. Cài đặt Database

```bash
# Chạy script SQL để cập nhật schema
mysql -u root -p < database.sql
```

Hoặc nếu database đã tồn tại, chỉ cần thêm column mới:

```sql
USE social_app;
ALTER TABLE otp_tokens ADD COLUMN attempt_count INT NOT NULL DEFAULT 0;
```

### 2. Cấu hình Backend

File: `backend/src/main/resources/application.properties`

```properties
# OTP Configuration
app.otp.expiration-minutes=5
app.otp.max-attempts=5
app.otp.resend-cooldown-seconds=30
```

### 3. Chạy ứng dụng

```bash
# Backend
cd backend
mvn spring-boot:run

# Frontend (terminal mới)
cd frontend
npm run dev
```

### 4. Kiểm tra OTP

Khi người dùng đăng ký, OTP sẽ được hiển thị trong console backend:

```
════════════════════════════════════════════════════════
  🎓 NLU Social - Mã Xác Thực Đăng Ký
════════════════════════════════════════════════════════
  📧 Email: 21045678@st.hcmuaf.edu.vn
  🔐 Mã OTP: 123456
  ⏰ Hiệu lực: 5 phút
  🔒 Số lần thử tối đa: 5
════════════════════════════════════════════════════════
```

## 🔒 Tính năng bảo mật

### 1. Chống brute force
- Giới hạn 5 lần thử OTP
- Tự động khóa sau 5 lần sai
- Phải yêu cầu OTP mới

### 2. Chống spam
- Cooldown 30 giây giữa các lần gửi
- OTP chỉ hiệu lực 5 phút
- Tự động xóa OTP hết hạn (mỗi giờ)

### 3. Bảo mật mật khẩu
- Hash BCrypt với salt tự động
- Yêu cầu độ mạnh cao
- Không lưu mật khẩu plain text

### 4. Validation
- Email format validation (client + server)
- Password strength validation (client + server)
- OTP format validation
- Duplicate email check

## 📊 Luồng đăng ký

```
1. Nhập email sinh viên
   ↓
2. Gửi OTP → Hiển thị trong console backend
   ↓
3. Nhập OTP (6 chữ số)
   ↓
4. Nhập thông tin cá nhân & mật khẩu
   ↓
5. Xác minh OTP & Tạo tài khoản
   ↓
6. Đăng nhập thành công → Chuyển đến /home
```

## 🎯 UX Improvements

### 1. Password Strength Indicator
- Thanh progress 5 level
- Màu sắc thay đổi theo độ mạnh
- Checklist trực quan

### 2. OTP Input
- Tự động focus khi vào bước OTP
- Hỗ trợ paste từ clipboard
- Chỉ cho phép nhập số
- Hiển thị countdown resend

### 3. Error Messages
- Chi tiết và cụ thể
- Hiển thị số lần thử còn lại
- Hướng dẫn khắc phục

### 4. Success Feedback
- Thông báo thành công màu xanh
- Tự động chuyển bước
- Loading states rõ ràng

## 🧪 Testing

### Test cases nên test:

1. **Email validation**
   - ✅ Email đúng format: `21045678@st.hcmuaf.edu.vn`
   - ❌ Email sai format: `abc@st.hcmuaf.edu.vn`
   - ❌ Email đã đăng ký

2. **OTP verification**
   - ✅ OTP đúng
   - ❌ OTP sai (kiểm tra attempt count)
   - ❌ OTP hết hạn
   - ❌ OTP đã sử dụng
   - ❌ OTP bị khóa (sau 5 lần sai)

3. **Password validation**
   - ✅ Mật khẩu đủ mạnh
   - ❌ Thiếu chữ hoa
   - ❌ Thiếu số
   - ❌ Thiếu ký tự đặc biệt
   - ❌ Quá ngắn
   - ❌ Mật khẩu xác nhận không khớp

4. **Resend OTP**
   - ✅ Resend sau cooldown
   - ❌ Resend trước cooldown

5. **Registration flow**
   - ✅ Hoàn thành đăng ký thành công
   - ❌ Thiếu thông tin bắt buộc

## 📝 API Endpoints

### 1. Request OTP
```http
POST /api/auth/register/request-otp
Content-Type: application/json

{
  "email": "21045678@st.hcmuaf.edu.vn"
}
```

Response:
```json
{
  "message": "Mã OTP đã được gửi đến email của bạn. Kiểm tra console backend để lấy mã.",
  "expiresIn": 5,
  "maxAttempts": 5,
  "resendCooldown": 30
}
```

### 2. Resend OTP
```http
POST /api/auth/register/resend-otp
Content-Type: application/json

{
  "email": "21045678@st.hcmuaf.edu.vn"
}
```

### 3. Complete Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "21045678@st.hcmuaf.edu.vn",
  "password": "MyP@ssw0rd123",
  "fullName": "Nguyễn Văn A",
  "faculty": "Khoa Công nghệ Thông tin",
  "className": "CNTT01",
  "academicYear": "2021-2025",
  "otp": "123456"
}
```

## 🔧 Troubleshooting

### 1. OTP không hiển thị
- Kiểm tra console backend (terminal chạy backend)
- Đảm bảo backend đang chạy

### 2. Lỗi "Mã OTP đã bị khóa"
- OTP bị khóa sau 5 lần thử sai
- Giải pháp: Request OTP mới

### 3. Lỗi "Không thể gửi OTP"
- Kiểm tra email format
- Kiểm tra email đã đăng ký chưa
- Kiểm tra backend logs

### 4. Database error
- Chạy script `database.sql` để tạo/update schema
- Kiểm tra kết nối database

## 📚 Tài liệu liên quan

- [OTP_SETUP_GUIDE.md](./OTP_SETUP_GUIDE.md) - Hướng dẫn setup OTP
- [EMAIL_SETUP_INSTRUCTIONS.md](./EMAIL_SETUP_INSTRUCTIONS.md) - Hướng dẫn email
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API documentation

---

**Version:** 2.0.0 (Production Ready)  
**Last Updated:** 2026-01-06  
**Author:** Development Team