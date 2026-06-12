# Group Chat Implementation Plan

## Current State Analysis

### Existing Chat System:
- ✅ **Personal Chat**: Fully implemented with 1-on-1 messages
- ✅ **Message Recall**: Already supported (`is_recalled` field in messages table)
- ✅ **WebSocket**: Real-time messaging via `ChatWebSocketHandler`
- ❌ **Group Chat**: Not yet implemented

### Database Schema:
- `messages` table: Currently only supports `sender_id` and `receiver_id` (1-on-1)
- `group_members` table: Tracks group membership with roles and status

## Required Changes

### 1. Database Schema Updates

#### Option A: Add `group_id` to existing `messages` table (Recommended)
```sql
ALTER TABLE messages 
ADD COLUMN group_id BIGINT NULL AFTER receiver_id,
ADD CONSTRAINT fk_messages_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE;
```

**Pros:**
- Simple, single table for all messages
- Easy to query both personal and group messages
- Existing recall functionality works for both

**Cons:**
- Mixes personal and group messages in same table
- Need to handle `receiver_id` being NULL for group messages

#### Option B: Create new `group_messages` table
```sql
CREATE TABLE group_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    sender_id BIGINT NOT NULL,
    group_id BIGINT NOT NULL,
    content VARCHAR(2000) NOT NULL,
    media_url LONGTEXT NULL,
    is_recalled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME(6) NULL,
    PRIMARY KEY (id),
    KEY idx_group_messages_sender (sender_id),
    KEY idx_group_messages_group (group_id),
    CONSTRAINT fk_group_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_group_messages_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Pros:**
- Clean separation between personal and group messages
- Easier to maintain and optimize separately

**Cons:**
- Duplicate structure
- Need separate APIs and queries

### 2. Backend Implementation

#### Using Option A (Recommended - Single Table):

**Update Message Entity:**
```java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "group_id")
private Group group;
```

**Update MessageService:**
- Add `sendGroupMessage(Long senderId, Long groupId, String content, String mediaUrl)`
- Check if sender is active member of group before sending
- Add `getGroupMessages(Long groupId, Long viewerId, int page, int size)`
- Only return messages if viewer is active member
- Update `recallMessage()` to work with group messages

**Update MessageController:**
- Add endpoint: `POST /api/groups/{groupId}/messages`
- Add endpoint: `GET /api/groups/{groupId}/messages`
- Add endpoint: `DELETE /api/groups/messages/{messageId}/recall`

**Update ChatWebSocketHandler:**
- Add group chat room support: `joinGroupChatRoom(groupId, userId)`
- Broadcast to all group members: `notifyGroupChat(groupId, payload)`
- Remove user from group room on leave/kick

### 3. Frontend Implementation

**New Components:**
- `GroupChatPanel.tsx` - Chat interface for group messages
- `GroupChatMessage.tsx` - Individual message component
- `GroupChatInput.tsx` - Message input with send button

**Update GroupDetailPage:**
- Add "Chat" tab alongside Posts, Members, etc.
- Integrate GroupChatPanel component

**Features:**
- ✅ Load messages on tab click (not on page load)
- ✅ Real-time messaging via WebSocket
- ✅ Message recall (within time limit, e.g., 2 minutes)
- ✅ Show sender name and avatar
- ✅ Timestamp for each message
- ✅ Prevent sending if user left/was kicked from group

### 4. Business Logic Requirements

#### Sending Messages:
```java
public MessageResponse sendGroupMessage(Long senderId, Long groupId, String content, String mediaUrl) {
    // 1. Verify group exists
    Group group = groupRepository.findById(groupId)
        .orElseThrow(() -> new IllegalArgumentException("Group not found"));
    
    // 2. Verify sender is active member
    GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, senderId)
        .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));
    
    if (!"active".equals(member.getStatus())) {
        throw new IllegalArgumentException("You cannot send messages in this group");
    }
    
    // 3. Create and save message
    User sender = userRepository.findById(senderId).orElseThrow();
    Message message = new Message();
    message.setSender(sender);
    message.setGroup(group);
    message.setContent(content);
    message.setMediaUrl(mediaUrl);
    message.setIsRecalled(false);
    
    return toResponse(messageRepository.save(message));
}
```

#### Viewing Messages:
```java
public List<MessageResponse> getGroupMessages(Long groupId, Long viewerId, int page, int size) {
    // 1. Verify viewer is active member
    GroupMember member = groupMemberRepository.findByGroupIdAndUserId(groupId, viewerId)
        .orElseThrow(() -> new IllegalArgumentException("Access denied"));
    
    if (!"active".equals(member.getStatus())) {
        throw new IllegalArgumentException("You cannot view messages in this group");
    }
    
    // 2. Fetch messages
    Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
    return messageRepository.findByGroupId(groupId, pageable)
        .stream()
        .map(this::toResponse)
        .collect(Collectors.toList());
}
```

#### Recall Message:
```java
public MessageResponse recallMessage(Long messageId, Long userId) {
    Message message = messageRepository.findById(messageId)
        .orElseThrow(() -> new IllegalArgumentException("Message not found"));
    
    // 1. Only sender can recall
    if (!message.getSender().getId().equals(userId)) {
        throw new IllegalArgumentException("Only the sender can recall this message");
    }
    
    // 2. Optional: Time limit (e.g., 2 minutes)
    // if (Duration.between(message.getCreatedAt(), LocalDateTime.now()).toMinutes() > 2) {
    //     throw new IllegalArgumentException("Cannot recall message after 2 minutes");
    // }
    
    // 3. For group messages, verify user is still a member
    if (message.getGroup() != null) {
        GroupMember member = groupMemberRepository.findByGroupIdAndUserId(
            message.getGroup().getId(), userId)
            .orElseThrow(() -> new IllegalArgumentException("You are not a member of this group"));
        
        if (!"active".equals(member.getStatus())) {
            throw new IllegalArgumentException("You cannot recall messages in this group");
        }
    }
    
    message.setIsRecalled(true);
    return toResponse(messageRepository.save(message));
}
```

#### Leave/Kick Handling:
When a user leaves or is kicked from a group:
1. Update `group_members.status` to 'blocked' or delete the record
2. Remove user from WebSocket group chat room
3. User can no longer send messages
4. User can no longer view new messages (but can see old ones they sent)

### 5. WebSocket Updates

**Current:** 1-on-1 chat rooms like `chat_user_123`

**Add:** Group chat rooms like `group_chat_456`

```java
public void joinGroupChatRoom(Long groupId, Long userId) {
    String roomId = "group_chat_" + groupId;
    // Add user's session to the room
}

public void leaveGroupChatRoom(Long groupId, Long userId) {
    String roomId = "group_chat_" + groupId;
    // Remove user's session from the room
}

public void notifyGroupChat(Long groupId, Map<String, Object> payload) {
    String roomId = "group_chat_" + groupId;
    // Broadcast to all sessions in the room
}
```

## Implementation Priority

1. **Phase 1**: Database schema update (Option A)
2. **Phase 2**: Backend entity and repository updates
3. **Phase 3**: Backend service and controller endpoints
4. **Phase 4**: WebSocket group chat support
5. **Phase 5**: Frontend UI components
6. **Phase 6**: Testing and refinement

## Estimated Effort

- Backend: 4-6 hours
- Frontend: 6-8 hours
- Testing: 2-3 hours
- **Total: 12-17 hours**

## Notes

- The existing message recall functionality already works for both personal and group messages
- The main work is adding group_id support and membership validation
- WebSocket needs minimal changes - just add group room support
- Frontend needs new components but can reuse existing chat styles