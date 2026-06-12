# Email Configuration Instructions for OTP System

## Quick Start: Using Gmail (Recommended)

Gmail SMTP is the most reliable option for sending OTP emails. Here's how to set it up:

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Under "Signing in to Google", click **2-Step Verification**
4. Follow the prompts to enable 2FA (you'll need your phone)

### Step 2: Generate an App Password

1. After enabling 2FA, go to: https://myaccount.google.com/apppasswords
2. Under "App passwords", select:
   - **App**: Mail
   - **Device**: Other (Custom name) → Enter "NLU Social"
3. Click **Generate**
4. Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 3: Configure Application Properties

Edit `backend/src/main/resources/application.properties`:

```properties
# Gmail SMTP Configuration
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=your_email@gmail.com
spring.mail.password=abcdefghijklmnop  # Remove spaces from the app password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.starttls.enable=true
spring.mail.properties.mail.smtp.connectiontimeout=5000
spring.mail.properties.mail.smtp.timeout=5000
spring.mail.properties.mail.smtp.writetimeout=5000
```

**Important**: Remove spaces from the app password when entering it.

### Step 4: Test the Configuration

1. Start your backend application
2. Try to register a new account
3. Check the email inbox (and spam folder) for the OTP email

---

## Alternative: Using HCMUAF Email

If you must use your HCMUAF student email, follow these steps:

### Configuration

Edit `backend/src/main/resources/application.properties`:

```properties
# HCMUAF SMTP Configuration
spring.mail.host=smtp.hcmuaf.edu.vn
spring.mail.port=465
spring.mail.username=22130273@st.hcmuaf.edu.vn
spring.mail.password=your_hcmuaf_password
spring.mail.properties.mail.smtp.auth=true
spring.mail.properties.mail.smtp.ssl.enable=true
spring.mail.properties.mail.smtp.connectiontimeout=10000
spring.mail.properties.mail.smtp.timeout=10000
spring.mail.properties.mail.smtp.writetimeout=10000
```

### Potential Issues with HCMUAF SMTP

1. **SSL Certificate Issues**: You may encounter `SSLHandshakeException` due to certificate validation
   - **Solution**: Use Gmail instead, or add JVM argument: `-Dmail.smtp.ssl.trust=smtp.hcmuaf.edu.vn`

2. **Port Blocked**: Port 465 might be blocked
   - **Solution**: Try port 587 with TLS instead of SSL

3. **Authentication Failed**: Your password might not work for SMTP
   - **Solution**: Reset your email password or contact HCMUAF IT support

---

## Troubleshooting Common Issues

### Issue: "Could not convert socket to TLS"

**Cause**: SSL/TLS configuration mismatch

**Solutions**:
1. Use Gmail SMTP instead (recommended)
2. If using HCMUAF, try changing port from 465 to 587 and use `starttls.enable=true`
3. Add JVM argument: `-Dmail.smtp.ssl.trust=smtp.hcmuaf.edu.vn`

### Issue: "Authentication failed"

**Cause**: Invalid username or password

**Solutions**:
1. For Gmail: Make sure you're using an **App Password**, not your regular password
2. Verify your email address is correct
3. Check if 2FA is enabled (required for Gmail app passwords)

### Issue: "Connection timed out"

**Cause**: Network/firewall blocking SMTP connection

**Solutions**:
1. Check if your firewall allows outbound connections on port 587 or 465
2. Try using a different network (e.g., mobile hotspot)
3. Contact your ISP if ports are blocked

### Issue: Email goes to spam

**Cause**: Email provider marking OTP emails as spam

**Solutions**:
1. Ask recipients to whitelist your email address
2. Check your email sending reputation
3. Consider using a transactional email service like SendGrid or Mailgun for production

---

## For Production: Using Transactional Email Services

For a production environment, consider using dedicated email services:

### SendGrid (Free tier available)

1. Sign up at https://sendgrid.com/
2. Create an API key
3. Add dependency to `pom.xml`:
   ```xml
   <dependency>
       <groupId>com.sendgrid</groupId>
       <artifactId>sendgrid-java</artifactId>
       <version>4.9.3</version>
   </dependency>
   ```
4. Update `OtpService.java` to use SendGrid API

### Mailgun (Free tier available)

1. Sign up at https://www.mailgun.com/
2. Get your API key and domain
3. Configure in `application.properties`:
   ```properties
   mailgun.api.key=your_api_key
   mailgun.domain=your_domain
   ```

---

## Testing Without Email (Development Mode)

For development/testing without actual email sending, you can modify `OtpService.java` to log the OTP instead of sending email:

```java
public void sendRegistrationOtp(String email) {
    OtpToken otpToken = createOtpToken(email);
    
    // For testing: Log OTP instead of sending email
    System.out.println("=== OTP FOR " + email + " ===");
    System.out.println("Your OTP code is: " + otpToken.getOtpCode());
    System.out.println("=============================");
    
    // Comment out the actual email sending for testing
    // sendOtpEmail(email, otpToken.getOtpCode(), "Đăng ký tài khoản NLU Social");
}
```

**Warning**: Only use this for development/testing. Never deploy to production without actual email sending.

---

## Quick Reference

| Setting | Gmail | HCMUAF |
|---------|-------|--------|
| Host | smtp.gmail.com | smtp.hcmuaf.edu.vn |
| Port | 587 | 465 |
| Security | STARTTLS | SSL |
| Auth | App Password | Regular Password |
| Reliability | High | Medium |
| Setup Difficulty | Easy | Medium |

---

## Need Help?

1. **Gmail Issues**: Check Google's support page for app passwords
2. **HCMUAF Issues**: Contact HCMUAF IT support
3. **Application Issues**: Check backend logs for detailed error messages