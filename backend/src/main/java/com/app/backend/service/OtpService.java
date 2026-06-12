package com.app.backend.service;

import com.app.backend.entity.OtpToken;
import com.app.backend.repository.OtpTokenRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final JavaMailSender mailSender;

    @Value("${app.otp.expiration-minutes}")
    private int expirationMinutes;

    @Value("${app.otp.max-attempts:5}")
    private int maxAttempts;

    @Value("${app.otp.resend-cooldown-seconds:30}")
    private int resendCooldownSeconds;

    @Value("${spring.mail.username:noreply@nlusocial.edu.vn}")
    private String fromEmail;

    private static final String OTP_CHARACTERS = "0123456789";
    private static final int OTP_LENGTH = 6;

    public OtpService(OtpTokenRepository otpTokenRepository, JavaMailSender mailSender) {
        this.otpTokenRepository = otpTokenRepository;
        this.mailSender = mailSender;
    }

    /**
     * Generate a random 6-digit OTP code
     */
    public String generateOtpCode() {
        Random random = new Random();
        StringBuilder otp = new StringBuilder(OTP_LENGTH);
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(OTP_CHARACTERS.charAt(random.nextInt(OTP_CHARACTERS.length())));
        }
        return otp.toString();
    }

    /**
     * Create and save OTP token for registration
     */
    @Transactional
    public OtpToken createOtpToken(String email) {
        // Delete any existing OTP for this email
        otpTokenRepository.deleteByEmail(email);

        String otpCode = generateOtpCode();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(expirationMinutes);

        OtpToken otpToken = new OtpToken();
        otpToken.setEmail(email);
        otpToken.setOtpCode(otpCode);
        otpToken.setExpiresAt(expiresAt);
        otpToken.setUsed(false);
        otpToken.setAttemptCount(0);

        return otpTokenRepository.save(otpToken);
    }

    /**
     * Generate and send OTP via email for registration
     */
    public OtpToken sendRegistrationOtp(String email) {
        OtpToken otpToken = createOtpToken(email);
        
        // Send email with OTP
        sendOtpEmail(email, otpToken.getOtpCode(), expirationMinutes, maxAttempts);
        
        // Also log to console for debugging
        System.out.println("\n");
        System.out.println("════════════════════════════════════════════════════════");
        System.out.println("  🎓 NLU Social - Mã Xác Thực Đăng Ký");
        System.out.println("════════════════════════════════════════════════════════");
        System.out.println("  📧 Email: " + email);
        System.out.println("  🔐 Mã OTP: " + otpToken.getOtpCode());
        System.out.println("  ⏰ Hiệu lực: " + expirationMinutes + " phút");
        System.out.println("  🔒 Số lần thử tối đa: " + maxAttempts);
        System.out.println("════════════════════════════════════════════════════════");
        System.out.println("\n");
        
        return otpToken;
    }

    /**
     * Send OTP via email
     */
    private void sendOtpEmail(String toEmail, String otpCode, int expirationMinutes, int maxAttempts) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, StandardCharsets.UTF_8.name());

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("🎓 NLU Social - Mã Xác Thực Đăng Ký");

            String emailContent = buildEmailHtml(otpCode, expirationMinutes, maxAttempts);
            helper.setText(emailContent, true);

            mailSender.send(message);
            
            System.out.println("✅ Email OTP đã được gửi thành công đến: " + toEmail);
        } catch (MessagingException e) {
            System.err.println("❌ Không thể gửi email OTP: " + e.getMessage());
            throw new RuntimeException("Không thể gửi mã xác thực đến email của bạn. Vui lòng thử lại sau.", e);
        }
    }

    /**
     * Build HTML email content
     */
    private String buildEmailHtml(String otpCode, int expirationMinutes, int maxAttempts) {
        return "<!DOCTYPE html>\n" +
                "<html lang=\"vi\">\n" +
                "<head>\n" +
                "    <meta charset=\"UTF-8\">\n" +
                "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n" +
                "    <title>Mã Xác Thực Đăng Ký - NLU Social</title>\n" +
                "    <style>\n" +
                "        body {\n" +
                "            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;\n" +
                "            line-height: 1.6;\n" +
                "            color: #333;\n" +
                "            max-width: 600px;\n" +
                "            margin: 0 auto;\n" +
                "            padding: 20px;\n" +
                "            background-color: #f5f5f5;\n" +
                "        }\n" +
                "        .container {\n" +
                "            background-color: #ffffff;\n" +
                "            border-radius: 12px;\n" +
                "            padding: 30px;\n" +
                "            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);\n" +
                "        }\n" +
                "        .header {\n" +
                "            text-align: center;\n" +
                "            margin-bottom: 30px;\n" +
                "        }\n" +
                "        .header h1 {\n" +
                "            color: #1e40af;\n" +
                "            margin: 0;\n" +
                "            font-size: 24px;\n" +
                "        }\n" +
                "        .header p {\n" +
                "            color: #64748b;\n" +
                "            margin: 8px 0 0 0;\n" +
                "            font-size: 14px;\n" +
                "        }\n" +
                "        .otp-section {\n" +
                "            text-align: center;\n" +
                "            background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);\n" +
                "            border-radius: 12px;\n" +
                "            padding: 24px;\n" +
                "            margin: 24px 0;\n" +
                "        }\n" +
                "        .otp-label {\n" +
                "            font-size: 14px;\n" +
                "            color: #64748b;\n" +
                "            margin-bottom: 12px;\n" +
                "        }\n" +
                "        .otp-code {\n" +
                "            font-size: 36px;\n" +
                "            font-weight: 700;\n" +
                "            color: #1e40af;\n" +
                "            letter-spacing: 12px;\n" +
                "            font-family: 'Courier New', monospace;\n" +
                "            background-color: #ffffff;\n" +
                "            display: inline-block;\n" +
                "            padding: 12px 24px;\n" +
                "            border-radius: 8px;\n" +
                "            border: 2px dashed #3b82f6;\n" +
                "        }\n" +
                "        .info-box {\n" +
                "            background-color: #fef3c7;\n" +
                "            border-left: 4px solid #f59e0b;\n" +
                "            padding: 16px;\n" +
                "            border-radius: 4px;\n" +
                "            margin: 20px 0;\n" +
                "        }\n" +
                "        .info-box h3 {\n" +
                "            margin: 0 0 8px 0;\n" +
                "            color: #92400e;\n" +
                "            font-size: 14px;\n" +
                "        }\n" +
                "        .info-box ul {\n" +
                "            margin: 0;\n" +
                "            padding-left: 20px;\n" +
                "            color: #92400e;\n" +
                "            font-size: 13px;\n" +
                "        }\n" +
                "        .info-box li {\n" +
                "            margin-bottom: 4px;\n" +
                "        }\n" +
                "        .footer {\n" +
                "            text-align: center;\n" +
                "            margin-top: 30px;\n" +
                "            padding-top: 20px;\n" +
                "            border-top: 1px solid #e2e8f0;\n" +
                "            color: #94a3b8;\n" +
                "            font-size: 12px;\n" +
                "        }\n" +
                "        .security-note {\n" +
                "            background-color: #fef2f2;\n" +
                "            border-left: 4px solid #ef4444;\n" +
                "            padding: 12px;\n" +
                "            border-radius: 4px;\n" +
                "            margin: 16px 0;\n" +
                "            font-size: 13px;\n" +
                "            color: #dc2626;\n" +
                "        }\n" +
                "    </style>\n" +
                "</head>\n" +
                "<body>\n" +
                "    <div class=\"container\">\n" +
                "        <div class=\"header\">\n" +
                "            <h1>🎓 NLU Social</h1>\n" +
                "            <p>Mạng Xã Hội Sinh Viên Đại Học Nông Lâm</p>\n" +
                "        </div>\n" +
                "\n" +
                "        <p>Xin chào,</p>\n" +
                "        \n" +
                "        <p>Bạn đã yêu cầu đăng ký tài khoản NLU Social. Vui lòng sử dụng mã xác thực (OTP) dưới đây để hoàn tất quá trình đăng ký:</p>\n" +
                "\n" +
                "        <div class=\"otp-section\">\n" +
                "            <div class=\"otp-label\">Mã Xác Thực Của Bạn</div>\n" +
                "            <div class=\"otp-code\">" + otpCode + "</div>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"info-box\">\n" +
                "            <h3>📋 Thông tin quan trọng:</h3>\n" +
                "            <ul>\n" +
                "                <li>⏰ Mã có hiệu lực trong <strong>" + expirationMinutes + " phút</strong></li>\n" +
                "                <li>🔒 Bạn có tối đa <strong>" + maxAttempts + " lần thử</strong> để nhập đúng mã</li>\n" +
                "                <li>🔐 Không chia sẻ mã này với bất kỳ ai</li>\n" +
                "            </ul>\n" +
                "        </div>\n" +
                "\n" +
                "        <div class=\"security-note\">\n" +
                "            <strong>⚠️ Bảo mật:</strong> Nếu bạn không yêu cầu đăng ký tài khoản, vui lòng bỏ qua email này. Tài khoản của bạn vẫn an toàn.\n" +
                "        </div>\n" +
                "\n" +
                "        <p>Sau khi nhập mã thành công, bạn sẽ được chuyển đến trang hoàn tất thông tin cá nhân.</p>\n" +
                "\n" +
                "        <p>Trân trọng,<br><strong>Đội ngũ NLU Social</strong></p>\n" +
                "\n" +
                "        <div class=\"footer\">\n" +
                "            <p>© 2026 NLU Social - Đại Học Nông Lâm TP.HCM</p>\n" +
                "            <p>Email này được gửi tự động, vui lòng không trả lời.</p>\n" +
                "        </div>\n" +
                "    </div>\n" +
                "</body>\n" +
                "</html>";
    }

    /**
     * Verify OTP code for registration
     * @return VerificationResult containing success status and message
     */
    @Transactional
    public VerificationResult verifyOtp(String email, String otpCode) {
        Optional<OtpToken> otpTokenOpt = otpTokenRepository.findByEmailAndOtpCode(email, otpCode);
        
        if (otpTokenOpt.isEmpty()) {
            // Check if there's any OTP for this email to provide better error message
            Optional<OtpToken> anyOtp = otpTokenRepository.findByEmail(email);
            if (anyOtp.isPresent()) {
                OtpToken token = anyOtp.get();
                token.incrementAttemptCount();
                otpTokenRepository.save(token);
                
                if (token.isLocked()) {
                    return new VerificationResult(false, "Mã OTP đã bị khóa do quá nhiều lần thử sai. Vui lòng yêu cầu mã mới.");
                }
                return new VerificationResult(false, "Mã OTP không đúng. Còn " + (maxAttempts - token.getAttemptCount()) + " lần thử.");
            }
            return new VerificationResult(false, "Không tìm thấy mã OTP. Vui lòng yêu cầu mã mới.");
        }
        
        OtpToken otpToken = otpTokenOpt.get();
        
        // Check if locked due to too many attempts
        if (otpToken.isLocked()) {
            return new VerificationResult(false, "Mã OTP đã bị khóa do quá nhiều lần thử sai. Vui lòng yêu cầu mã mới.");
        }
        
        if (!otpToken.isValid()) {
            // Mark as used even if expired to prevent reuse
            otpToken.setUsed(true);
            otpTokenRepository.save(otpToken);
            
            if (otpToken.isExpired()) {
                return new VerificationResult(false, "Mã OTP đã hết hạn sau " + expirationMinutes + " phút. Vui lòng yêu cầu mã mới.");
            }
            return new VerificationResult(false, "Mã OTP không hợp lệ hoặc đã được sử dụng.");
        }
        
        // Success - mark as used
        otpToken.setUsed(true);
        otpTokenRepository.save(otpToken);
        return new VerificationResult(true, "Xác minh OTP thành công.");
    }

    /**
     * Check if can resend OTP (cooldown check)
     */
    public boolean canResendOtp(String email) {
        Optional<OtpToken> lastOtp = otpTokenRepository.findByEmail(email);
        if (lastOtp.isEmpty()) {
            return true;
        }
        
        LocalDateTime lastCreated = lastOtp.get().getCreatedAt();
        LocalDateTime cooldownEnd = lastCreated.plusSeconds(resendCooldownSeconds);
        return LocalDateTime.now().isAfter(cooldownEnd);
    }

    /**
     * Get remaining cooldown time in seconds
     */
    public long getResendCooldownRemaining(String email) {
        Optional<OtpToken> lastOtp = otpTokenRepository.findByEmail(email);
        if (lastOtp.isEmpty()) {
            return 0;
        }
        
        LocalDateTime lastCreated = lastOtp.get().getCreatedAt();
        LocalDateTime cooldownEnd = lastCreated.plusSeconds(resendCooldownSeconds);
        
        if (LocalDateTime.now().isAfter(cooldownEnd)) {
            return 0;
        }
        
        return Duration.between(LocalDateTime.now(), cooldownEnd).getSeconds();
    }

    /**
     * Resend OTP for the same email
     */
    @Transactional
    public OtpToken resendOtp(String email) {
        // Delete existing OTP and create new one
        return sendRegistrationOtp(email);
    }

    /**
     * Clean up expired OTP tokens (runs every hour)
     */
    @Scheduled(cron = "0 0 * * * *")
    @Transactional
    public void cleanupExpiredOtps() {
        List<OtpToken> expiredTokens = otpTokenRepository.findAll().stream()
            .filter(OtpToken::isExpired)
            .toList();
        otpTokenRepository.deleteAll(expiredTokens);
    }

    /**
     * Result class for OTP verification
     */
    public static class VerificationResult {
        private final boolean success;
        private final String message;

        public VerificationResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }
}