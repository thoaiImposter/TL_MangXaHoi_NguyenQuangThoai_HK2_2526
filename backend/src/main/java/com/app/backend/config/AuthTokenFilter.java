package com.app.backend.config;

import com.app.backend.service.AuthTokenService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ReadListener;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletInputStream;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    private static final Set<String> IDENTITY_FIELDS = Set.of("userId", "viewerId", "adminId", "senderId", "authorId");
    private static final Pattern USER_PATH = Pattern.compile("^/api/users/(\\d+)(/.*)?$");
    private static final Pattern CONVERSATION_PATH = Pattern.compile("^/api/conversations/between/(\\d+)/(\\d+)$");

    private final AuthTokenService tokenService;
    private final ObjectMapper objectMapper;

    public AuthTokenFilter(AuthTokenService tokenService, ObjectMapper objectMapper) {
        this.tokenService = tokenService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return "OPTIONS".equalsIgnoreCase(request.getMethod())
                || path.equals("/ws/chat")
                || path.equals("/api/auth/login")
                || path.equals("/api/auth/register")
                || path.equals("/api/auth/register/request-otp")
                || path.equals("/api/auth/register/resend-otp");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        try {
            String header = request.getHeader("Authorization");
            String token = header != null && header.startsWith("Bearer ") ? header.substring(7) : null;
            Long currentUserId = tokenService.parseUserId(token);
            HttpServletRequest guardedRequest = guardJsonBody(request, currentUserId);
            guardRequestIdentity(guardedRequest, currentUserId);

            var authentication = new UsernamePasswordAuthenticationToken(
                    String.valueOf(currentUserId), null, List.of());
            SecurityContextHolder.getContext().setAuthentication(authentication);
            chain.doFilter(guardedRequest, response);
        } catch (IllegalArgumentException ex) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write(objectMapper.writeValueAsString(java.util.Map.of("error", ex.getMessage())));
        } finally {
            SecurityContextHolder.clearContext();
        }
    }

    private HttpServletRequest guardJsonBody(HttpServletRequest request, Long currentUserId) throws IOException {
        String contentType = request.getContentType();
        if (contentType == null || !contentType.contains(MediaType.APPLICATION_JSON_VALUE)) {
            return request;
        }
        byte[] body = request.getInputStream().readAllBytes();
        if (body.length == 0) {
            return new CachedBodyRequest(request, body);
        }
        JsonNode root = objectMapper.readTree(body);
        for (String field : IDENTITY_FIELDS) {
            JsonNode value = root.get(field);
            if (value != null && value.canConvertToLong() && value.asLong() != currentUserId) {
                throw new IllegalArgumentException("You cannot act as another user");
            }
        }
        return new CachedBodyRequest(request, body);
    }

    private void guardRequestIdentity(HttpServletRequest request, Long currentUserId) {
        for (String field : IDENTITY_FIELDS) {
            String value = request.getParameter(field);
            if (value != null && !value.isBlank() && Long.parseLong(value) != currentUserId) {
                throw new IllegalArgumentException("You cannot act as another user");
            }
        }

        String path = request.getRequestURI();
        Matcher conversation = CONVERSATION_PATH.matcher(path);
        if (conversation.matches()
                && Long.parseLong(conversation.group(1)) != currentUserId
                && Long.parseLong(conversation.group(2)) != currentUserId) {
            throw new IllegalArgumentException("You cannot read another user's conversation");
        }

        Matcher userPath = USER_PATH.matcher(path);
        if (!userPath.matches()) return;
        long pathUserId = Long.parseLong(userPath.group(1));
        String suffix = userPath.group(2) == null ? "" : userPath.group(2);
        boolean publicRead = "GET".equalsIgnoreCase(request.getMethod())
                && (suffix.isEmpty() || suffix.startsWith("/posts") || suffix.startsWith("/shares") || suffix.equals("/friends"));
        if (!publicRead && pathUserId != currentUserId) {
            throw new IllegalArgumentException("You cannot act as another user");
        }
    }

    private static final class CachedBodyRequest extends HttpServletRequestWrapper {
        private final byte[] body;

        private CachedBodyRequest(HttpServletRequest request, byte[] body) {
            super(request);
            this.body = body;
        }

        @Override
        public ServletInputStream getInputStream() {
            ByteArrayInputStream input = new ByteArrayInputStream(body);
            return new ServletInputStream() {
                @Override public boolean isFinished() { return input.available() == 0; }
                @Override public boolean isReady() { return true; }
                @Override public void setReadListener(ReadListener readListener) { }
                @Override public int read() { return input.read(); }
            };
        }

        @Override
        public BufferedReader getReader() {
            return new BufferedReader(new InputStreamReader(getInputStream(), StandardCharsets.UTF_8));
        }
    }
}
