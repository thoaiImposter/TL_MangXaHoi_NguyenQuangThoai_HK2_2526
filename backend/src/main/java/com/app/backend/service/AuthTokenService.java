package com.app.backend.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class AuthTokenService {
    private final byte[] secret;
    private final long expirationSeconds;

    public AuthTokenService(
            @Value("${app.auth.secret:}") String configuredSecret,
            @Value("${app.auth.expiration-seconds:604800}") long expirationSeconds) {
        String secret = configuredSecret == null ? "" : configuredSecret.trim();
        if (secret.isBlank()) {
            byte[] generated = new byte[32];
            new SecureRandom().nextBytes(generated);
            this.secret = generated;
            System.out.println("[AUTH] APP_AUTH_SECRET is not set. Generated an ephemeral secret; sessions will expire after restart.");
        } else {
            if (secret.length() < 32) {
                throw new IllegalStateException("APP_AUTH_SECRET must contain at least 32 characters");
            }
            this.secret = secret.getBytes(StandardCharsets.UTF_8);
        }
        this.expirationSeconds = expirationSeconds;
    }

    /**
     * Ham tao token dang nhap tu userId va thoi diem het han.
     */
    public String createToken(Long userId) {
        long expiresAt = Instant.now().getEpochSecond() + expirationSeconds;
        String payload = userId + ":" + expiresAt;
        return encode(payload) + "." + sign(payload);
    }

    /**
     * Ham kiem tra token hop le va lay userId ben trong token.
     */
    public Long parseUserId(String token) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Missing authentication token");
        }
        String[] parts = token.split("\\.", 2);
        if (parts.length != 2) {
            throw new IllegalArgumentException("Invalid authentication token");
        }
        String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(parts[0]), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid authentication token");
        }
        if (!MessageDigest.isEqual(sign(payload).getBytes(StandardCharsets.UTF_8), parts[1].getBytes(StandardCharsets.UTF_8))) {
            throw new IllegalArgumentException("Invalid authentication token");
        }
        String[] values = payload.split(":", 2);
        if (values.length != 2 || Long.parseLong(values[1]) < Instant.now().getEpochSecond()) {
            throw new IllegalArgumentException("Authentication token has expired");
        }
        return Long.parseLong(values[0]);
    }

    /**
     * Ham encode payload token bang Base64 URL-safe.
     */
    private String encode(String value) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(value.getBytes(StandardCharsets.UTF_8));
    }

    /**
     * Ham ky payload bang HMAC-SHA256 de chong sua token.
     */
    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret, "HmacSHA256"));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("Could not create authentication token", ex);
        }
    }
}
