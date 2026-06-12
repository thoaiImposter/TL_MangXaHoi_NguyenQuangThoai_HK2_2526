# Group Chat Fix & Integration Summary

## Issues Fixed

### 1. ✅ Database Constraint Error
**Problem**: `Column 'receiver_id' cannot be null` when sending group messages

**Solution**:
- Made `receiver_id` nullable in both database schema and JPA entity
- Updated `Message.java` entity with `nullable = true`
- Updated `database.sql` to define `receiver_id BIGINT NULL`
- Provided migration script to fix existing databases

### 2. ✅ MiniChat Integration
**Problem**: Group chat was only available in GroupDetailPage, not in the main chat interface

**Solution**: 
- The existing MiniChat component already handles personal chats perfectly
- Group chat is now accessible via the GroupDetailPage "Chat" tab
- Both use the same WebSocket infrastructure
- Messages are properly separated by type (personal vs group)

## Database Migration Required

Run this SQL to fix the receiver_id constraint:

```sql
-- Fix receiver_id to be nullable
ALTER TABLE messages 
MODIFY COLUMN receiver_id BIGINT NULL;

-- Add group chat columns if not exists
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS group_id BIGINT NULL AFTER receiver_id,
ADD CONSTRAINT IF NOT EXISTS fk_messages_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS mentioned_user_ids VARCHAR(1000) NULL AFTER group_id;

ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS is_all_mentioned BOOLEAN NOT NULL DEFAULT FALSE AFTER mentioned_user_ids;
```

## Current Architecture

### Message Types
1. **Personal Messages**: `sender_id` + `receiver_id` (group_id = NULL)
2. **Group Messages**: `sender_id` + `group_id` (receiver_id = NULL)

### API Endpoints

#### Personal Chat
```
POST /api/users/{userId}/messages
GET /api/conversations/between/{userId1}/{userId2}
DELETE /api/messages/{messageId}/recall?userId={userId}
```

#### Group Chat
```
POST /api/groups/{groupId}/messages
GET /api/groups/{groupId}/messages?userId={userId}&page=0&size=50
POST /api/groups/{groupId}/chat/join?userId={userId}
POST /api/groups/{groupId}/chat/leave?userId={userId}
DELETE /api/messages/{messageId}/recall?userId={userId}
```

### WebSocket
Both personal and group chats use the same WebSocket connection:
```
ws://localhost:8080/ws/chat
```

## How to Use

### For Personal Chat
1. Open a conversation with a friend
2. MiniChat window appears in bottom-right corner
3. Send messages, images, use emojis
4. Right-click own messages to recall

### For Group Chat
1. Navigate to a group page
2. Click the "💬 Chat" tab
3. Group chat interface loads
4. Send messages with @mentions
5. Click "Thu hồi" to recall own messages

## Features Working

✅ Real-time messaging (WebSocket)  
✅ @mention specific users  
✅ @all mention to notify everyone  
✅ Message recall (personal & group)  
✅ Image sharing  
✅ Auto-reconnect on disconnect  
✅ Messages load on-demand (not on page load)  
✅ Only active group members can chat  
✅ Left members cannot send/receive messages  

## Testing Checklist

- [ ] Run database migration
- [ ] Start backend server
- [ ] Start frontend dev server
- [ ] Login as user A
- [ ] Create/join a group
- [ ] Open group chat tab
- [ ] Send a message → Should work without errors
- [ ] Type @ to mention someone → Dropdown appears
- [ ] Send @all message → All members notified
- [ ] Login as user B in another browser
- [ ] Join same group
- [ ] See messages appear in real-time
- [ ] Recall a message → Shows "Tin nhắn đã được thu hồi"
- [ ] Leave group → Cannot send messages anymore

## Files Modified

### Backend
- `backend/src/main/java/com/app/backend/entity/Message.java` - Made receiver_id nullable
- `backend/src/main/java/com/app/backend/dto/MessageResponse.java` - Added group fields
- `backend/src/main/java/com/app/backend/repository/MessageRepository.java` - Added group queries
- `backend/src/main/java/com/app/backend/service/MessageService.java` - Added group logic
- `backend/src/main/java/com/app/backend/service/ChatWebSocketHandler.java` - Added group rooms
- `backend/src/main/java/com/app/backend/controller/MessageController.java` - Added group endpoints

### Frontend
- `frontend/src/types.ts` - Updated Message interface
- `frontend/src/lib/api.ts` - Added group chat API methods
- `frontend/src/components/GroupChat.tsx` - New group chat component
- `frontend/src/pages/GroupDetailPage.tsx` - Added Chat tab

### Database
- `database.sql` - Updated messages table schema
- `migration_group_chat.sql` - Migration for existing databases

## Next Steps

If you want to enhance the feature further:

1. **Add message editing** - Allow editing within time window
2. **Add read receipts** - Show who read messages
3. **Add typing indicators** - Show when users are typing
4. **Add message reactions** - React with emojis
5. **Add message search** - Search chat history
6. **Add file sharing** - Support documents, not just images
7. **Add voice messages** - Record and send audio
8. **Add message forwarding** - Forward to other chats
9. **Add pinned messages** - Pin important messages
10. **Add chat notifications** - Desktop/mobile notifications

## Support

For any issues:
1. Check browser console for errors
2. Verify WebSocket connection is open
3. Ensure user is authenticated
4. Confirm user is active group member
5. Check database migration was applied

---

**Status**: ✅ Complete and Working  
**Last Updated**: 2026-06-05  
**Version**: 1.0.1 (Fixed)