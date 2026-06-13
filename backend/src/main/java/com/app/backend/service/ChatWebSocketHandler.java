package com.app.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final Map<Long, WebSocketSession> userSessions = new ConcurrentHashMap<>();
    private final Map<String, Set<Long>> groupChatRooms = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AuthTokenService authTokenService;

    public ChatWebSocketHandler(AuthTokenService authTokenService) {
        this.authTokenService = authTokenService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        // Connection established, waiting for auth message
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        try {
            Map<String, Object> payload = objectMapper.readValue(message.getPayload(), Map.class);
            String type = (String) payload.get("type");

            if ("auth".equals(type)) {
                Long userId = Long.valueOf(payload.get("userId").toString());
                Long tokenUserId = authTokenService.parseUserId(String.valueOf(payload.get("token")));
                if (!userId.equals(tokenUserId)) {
                    session.close(CloseStatus.POLICY_VIOLATION);
                    return;
                }
                userSessions.put(userId, session);
                session.getAttributes().put("userId", userId);
            } else if ("ping".equals(type)) {
                session.sendMessage(new TextMessage("{\"type\":\"pong\"}"));
            }
        } catch (Exception e) {
            // Ignore malformed messages
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Object userIdObj = session.getAttributes().get("userId");
        if (userIdObj != null) {
            Long userId = (Long) userIdObj;
            userSessions.remove(userId);
            // Remove user from all group chat rooms
            groupChatRooms.values().forEach(users -> users.remove(userId));
        }
    }

    // Personal chat methods
    public void notifyUser(Long userId, Map<String, Object> payload) {
        WebSocketSession session = userSessions.get(userId);
        if (session != null && session.isOpen()) {
            try {
                String json = objectMapper.writeValueAsString(payload);
                session.sendMessage(new TextMessage(json));
            } catch (Exception e) {
                // Ignore send errors
            }
        }
    }

    // Group chat methods
    public void joinGroupChatRoom(Long groupId, Long userId) {
        String roomId = "group_" + groupId;
        groupChatRooms.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(userId);
    }

    public void leaveGroupChatRoom(Long groupId, Long userId) {
        String roomId = "group_" + groupId;
        Set<Long> users = groupChatRooms.get(roomId);
        if (users != null) {
            users.remove(userId);
            if (users.isEmpty()) {
                groupChatRooms.remove(roomId);
            }
        }
    }

    public void leaveAllGroupChatRooms(Long userId) {
        groupChatRooms.values().forEach(users -> users.remove(userId));
    }

    public void notifyGroupChat(Long groupId, Map<String, Object> payload) {
        String roomId = "group_" + groupId;
        Set<Long> users = groupChatRooms.get(roomId);
        if (users != null) {
            try {
                String json = objectMapper.writeValueAsString(payload);
                TextMessage message = new TextMessage(json);
                for (Long userId : users) {
                    WebSocketSession session = userSessions.get(userId);
                    if (session != null && session.isOpen()) {
                        session.sendMessage(message);
                    }
                }
            } catch (Exception e) {
                // Ignore send errors
            }
        }
    }

    public void notifyGroupChatExceptSender(Long groupId, Long senderId, Map<String, Object> payload) {
        String roomId = "group_" + groupId;
        Set<Long> users = groupChatRooms.get(roomId);
        if (users != null) {
            try {
                String json = objectMapper.writeValueAsString(payload);
                TextMessage message = new TextMessage(json);
                for (Long userId : users) {
                    if (!userId.equals(senderId)) {
                        WebSocketSession session = userSessions.get(userId);
                        if (session != null && session.isOpen()) {
                            session.sendMessage(message);
                        }
                    }
                }
            } catch (Exception e) {
                // Ignore send errors
            }
        }
    }

    public boolean isInGroupChatRoom(Long groupId, Long userId) {
        String roomId = "group_" + groupId;
        Set<Long> users = groupChatRooms.get(roomId);
        return users != null && users.contains(userId);
    }
}
