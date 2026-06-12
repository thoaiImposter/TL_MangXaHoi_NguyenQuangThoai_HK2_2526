package com.app.backend.controller;

import com.app.backend.dto.MessageResponse;
import com.app.backend.service.ChatWebSocketHandler;
import com.app.backend.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class MessageController {

    private final MessageService messageService;
    private final ChatWebSocketHandler chatWebSocketHandler;

    public MessageController(MessageService messageService, ChatWebSocketHandler chatWebSocketHandler) {
        this.messageService = messageService;
        this.chatWebSocketHandler = chatWebSocketHandler;
    }

    // Message endpoints (RESTful: /users/{userId}/messages)
    @PostMapping("/users/{userId}/messages")
    public ResponseEntity<?> sendMessage(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        try {
            Long receiverId = Long.valueOf(payload.get("receiverId").toString());
            String content = payload.get("content") != null ? payload.get("content").toString() : "";
            String mediaUrl = payload.get("mediaUrl") != null ? payload.get("mediaUrl").toString() : null;
            System.out.println("[MessageController] sendMessage called - senderId=" + userId + ", receiverId=" + receiverId + ", contentLength=" + content.length() + ", hasMedia=" + (mediaUrl != null && !mediaUrl.isEmpty()) + ", mediaLength=" + (mediaUrl == null ? 0 : mediaUrl.length()));
            if (mediaUrl != null && mediaUrl.length() > 10_000_000) {
                return ResponseEntity.badRequest().body("Image is too large. Please choose a smaller image.");
            }
            MessageResponse message = messageService.sendMessage(userId, receiverId, content, mediaUrl);
            System.out.println("[MessageController] message saved - id=" + message.getId() + ", mediaUrlLength=" + (message.getMediaUrl() == null ? 0 : message.getMediaUrl().length()));
            java.util.HashMap<String, Object> notifyPayload = new java.util.HashMap<>();
            notifyPayload.put("type", "new_message");
            notifyPayload.put("messageId", message.getId());
            notifyPayload.put("senderId", userId);
            notifyPayload.put("receiverId", receiverId);
            notifyPayload.put("content", content);
            notifyPayload.put("mediaUrl", mediaUrl == null ? "" : mediaUrl);
            notifyPayload.put("createdAt", message.getCreatedAt().toString());
            chatWebSocketHandler.notifyUser(receiverId, notifyPayload);
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body("Server error: " + ex.getMessage());
        }
    }

    @GetMapping("/users/{userId}/messages")
    public List<MessageResponse> getUserMessages(@PathVariable Long userId, @RequestParam Long otherId) {
        return messageService.getConversation(userId, otherId);
    }

    @GetMapping("/users/{userId}/conversations")
    public List<MessageResponse> getConversations(@PathVariable Long userId) {
        return messageService.getConversations(userId);
    }

    @GetMapping("/users/{userId}/messages/unread")
    public List<MessageResponse> getUnreadMessages(@PathVariable Long userId) {
        return messageService.getUnreadMessages(userId);
    }

    @PutMapping("/users/{userId}/conversations/{otherId}/read")
    public ResponseEntity<?> markConversationRead(@PathVariable Long userId, @PathVariable Long otherId) {
        messageService.markConversationAsRead(userId, otherId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/messages/{messageId}/recall")
    public ResponseEntity<?> recallMessage(@PathVariable Long messageId, @RequestParam Long userId) {
        try {
            MessageResponse message = messageService.recallMessage(messageId, userId);
            
            // For personal messages, notify the receiver about the recall
            if (message.getReceiverId() != null) {
                java.util.HashMap<String, Object> notifyPayload = new java.util.HashMap<>();
                notifyPayload.put("type", "message_recalled");
                notifyPayload.put("messageId", messageId);
                notifyPayload.put("senderId", message.getSenderId());
                notifyPayload.put("receiverId", message.getReceiverId());
                chatWebSocketHandler.notifyUser(message.getReceiverId(), notifyPayload);
            }
            
            // For group messages, notify all group members
            if (message.getGroupId() != null) {
                java.util.HashMap<String, Object> notifyPayload = new java.util.HashMap<>();
                notifyPayload.put("type", "message_recalled");
                notifyPayload.put("messageId", messageId);
                notifyPayload.put("senderId", message.getSenderId());
                notifyPayload.put("groupId", message.getGroupId());
                chatWebSocketHandler.notifyGroupChat(message.getGroupId(), notifyPayload);
            }
            
            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body("Server error: " + ex.getMessage());
        }
    }

    // Conversation between two users (RESTful: /conversations/between/{userId1}/{userId2})
    @GetMapping("/conversations/between/{userId1}/{userId2}")
    public List<MessageResponse> getConversationBetweenUsers(@PathVariable Long userId1, @PathVariable Long userId2) {
        return messageService.getConversation(userId1, userId2);
    }

    // Group chat endpoints
    @PostMapping("/groups/{groupId}/messages")
    public ResponseEntity<?> sendGroupMessage(@PathVariable Long groupId, @RequestBody Map<String, Object> payload) {
        try {
            Long senderId = Long.valueOf(payload.get("senderId").toString());
            String content = payload.get("content") != null ? payload.get("content").toString() : "";
            String mediaUrl = payload.get("mediaUrl") != null ? payload.get("mediaUrl").toString() : null;
            
            // Parse mentioned user IDs
            List<Long> mentionedUserIds = new ArrayList<>();
            Object mentionedObj = payload.get("mentionedUserIds");
            if (mentionedObj instanceof List) {
                for (Object id : (List<?>) mentionedObj) {
                    mentionedUserIds.add(Long.valueOf(id.toString()));
                }
            }
            
            boolean isAllMentioned = Boolean.TRUE.equals(payload.get("isAllMentioned"));

            System.out.println("[MessageController] sendGroupMessage - groupId=" + groupId + ", senderId=" + senderId + ", contentLength=" + content.length());

            MessageResponse message = messageService.sendGroupMessage(senderId, groupId, content, mediaUrl, mentionedUserIds, isAllMentioned);

            // Notify all group members via WebSocket
            java.util.HashMap<String, Object> notifyPayload = new java.util.HashMap<>();
            notifyPayload.put("type", "new_group_message");
            notifyPayload.put("messageId", message.getId());
            notifyPayload.put("senderId", message.getSenderId());
            notifyPayload.put("senderName", message.getSenderName());
            notifyPayload.put("senderAvatar", message.getSenderAvatar());
            notifyPayload.put("groupId", groupId);
            notifyPayload.put("groupName", message.getGroupName());
            notifyPayload.put("groupAvatar", message.getGroupAvatar());
            notifyPayload.put("content", content);
            notifyPayload.put("mediaUrl", mediaUrl == null ? "" : mediaUrl);
            notifyPayload.put("mentionedUserIds", message.getMentionedUserIds());
            notifyPayload.put("isAllMentioned", message.getIsAllMentioned());
            notifyPayload.put("isRecalled", message.getIsRecalled());
            notifyPayload.put("createdAt", message.getCreatedAt().toString());

            chatWebSocketHandler.notifyGroupChat(groupId, notifyPayload);

            return ResponseEntity.ok(message);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        } catch (Exception ex) {
            ex.printStackTrace();
            return ResponseEntity.internalServerError().body("Server error: " + ex.getMessage());
        }
    }

    @GetMapping("/groups/{groupId}/messages")
    public List<MessageResponse> getGroupMessages(
            @PathVariable Long groupId,
            @RequestParam Long userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return messageService.getGroupMessages(groupId, userId, page, size);
    }

    @GetMapping("/groups/{groupId}/messages/since")
    public List<MessageResponse> getGroupMessagesSince(
            @PathVariable Long groupId,
            @RequestParam Long userId,
            @RequestParam String since) {
        java.time.LocalDateTime sinceTime = java.time.LocalDateTime.parse(since);
        return messageService.getGroupMessagesSince(groupId, userId, sinceTime);
    }

    // WebSocket join/leave endpoints
    @PostMapping("/groups/{groupId}/chat/join")
    public ResponseEntity<?> joinGroupChat(@PathVariable Long groupId, @RequestParam Long userId) {
        try {
            chatWebSocketHandler.joinGroupChatRoom(groupId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Server error: " + ex.getMessage());
        }
    }

    @PostMapping("/groups/{groupId}/chat/leave")
    public ResponseEntity<?> leaveGroupChat(@PathVariable Long groupId, @RequestParam Long userId) {
        try {
            chatWebSocketHandler.leaveGroupChatRoom(groupId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception ex) {
            return ResponseEntity.internalServerError().body("Server error: " + ex.getMessage());
        }
    }
}
