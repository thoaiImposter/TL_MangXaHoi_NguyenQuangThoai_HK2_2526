# Group Chat Feature Implementation Guide

## Overview

This document provides a complete guide to the group chat feature that has been implemented in the NLU-social application. The feature allows group members to communicate in real-time using WebSocket connections.

## Features Implemented

### ✅ Core Features
1. **Real-time messaging** - Messages are delivered instantly via WebSocket
2. **@mention support** - Tag specific members with @username
3. **@all mention** - Notify all group members with @all
4. **Message recall** - Recall your own messages (personal and group chats)
5. **Image sharing** - Send images in group chat
6. **Member list display** - See all active members in the chat
7. **Online status** - See WebSocket connection status
8. **Message grouping by date** - Messages organized by date

### ✅ User Experience
- Messages only load when entering the chat tab (not on page load)
- Automatic reconnection if WebSocket disconnects
- Visual indicators for recalled messages
- Mention suggestions appear when typing @
- Messages from different users are visually distinguished

## Database Changes

### Migration Script
Run the following SQL migration to add group chat support:

```sql
-- File: migration_group_chat.sql
USE social_app;

-- Add group_id column to messages table
ALTER TABLE messages 
ADD COLUMN group_id BIGINT NULL AFTER receiver_id,
ADD CONSTRAINT fk_messages_group FOREIGN KEY (group_id) REFERENCES `groups` (id) ON DELETE CASCADE;

-- Add index for better query performance
CREATE INDEX idx_messages_group_id ON messages(group_id);

-- Add mentioned_user_ids column to store mentioned users
ALTER TABLE messages 
ADD COLUMN mentioned_user_ids VARCHAR(1000) NULL AFTER group_id;

-- Add is_all_mentioned flag for @all mentions
ALTER TABLE messages 
ADD COLUMN is_all_mentioned BOOLEAN NOT NULL DEFAULT FALSE AFTER mentioned_user_ids;
```

## Backend Implementation

### Key Files Modified

1. **Message.java** - Added group relationship and mention fields
2. **MessageResponse.java** - Added group and mention data to response
3. **MessageRepository.java** - Added group message queries
4. **MessageService.java** - Added group chat business logic
5. **ChatWebSocketHandler.java** - Added group chat room support
6. **MessageController.java** - Added group chat REST endpoints

### New API Endpoints

#### Send Group Message
```
POST /api/groups/{groupId}/messages
Body: {
  "senderId": number,
  "content": string,
  "mediaUrl": string (optional),
  "mentionedUserIds": number[] (optional),
  "isAllMentioned": boolean (optional)
}
```

#### Get Group Messages
```
GET /api/groups/{groupId}/messages?userId={userId}&page=0&size=50
```

#### Join Group Chat Room
```
POST /api/groups/{groupId}/chat/join?userId={userId}
```

#### Leave Group Chat Room
```
POST /api/groups/{groupId}/chat/leave?userId={userId}
```

#### Recall Message (works for both personal and group)
```
DELETE /api/messages/{messageId}/recall?userId={userId}
```

### WebSocket Protocol

#### Connection
```javascript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:8080/ws/chat');

// Authenticate after connection
ws.send(JSON.stringify({
  type: 'auth',
  userId: userId
}));
```

#### Join Group Chat Room
After authentication, join a group chat room:
```javascript
// Via REST API
POST /api/groups/{groupId}/chat/join?userId={userId}
```

#### Receive Messages
```javascript
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  if (data.type === 'new_group_message') {
    // New message received
    console.log(data.content);
  } else if (data.type === 'message_recalled') {
    // Message was recalled
    console.log('Message recalled:', data.messageId);
  }
};
```

#### Keep Connection Alive
Send ping every 30 seconds:
```javascript
ws.send(JSON.stringify({ type: 'ping' }));
```

## Frontend Implementation

### Key Files Created/Modified

1. **types.ts** - Updated Message interface with group chat fields
2. **api.ts** - Added group chat API methods
3. **GroupChat.tsx** - New component for group chat UI
4. **GroupDetailPage.tsx** - Added Chat tab integration

### GroupChat Component Features

- **Real-time messaging** via WebSocket
- **Member mention** with autocomplete dropdown
- **@all mention** to notify everyone
- **Image upload** with preview
- **Message recall** for own messages
- **Member list** toggle
- **Online status** indicator
- **Auto-reconnect** on disconnect
- **Date grouping** for messages

### Usage in GroupDetailPage

The GroupChat component is integrated as a tab in the GroupDetailPage:

```tsx
{isMember && (
  <button onClick={() => setActiveTab('chat')}>
    💬 Chat
  </button>
)}

{activeTab === 'chat' && isMember && (
  <GroupChat groupId={groupId} user={user} members={members} />
)}
```

## How to Use

### For Users

1. **Join a group** - Click "Tham gia" on a group page
2. **Open chat** - Click the "💬 Chat" tab in the group
3. **Send message** - Type in the input box and press Enter or click "Gửi"
4. **Mention someone** - Type @ and select from the dropdown
5. **Mention all** - Type @all or select "@all - Nhắc đến tất cả mọi người"
6. **Send image** - Click the camera icon to select an image
7. **Recall message** - Click "Thu hồi" on your own message

### For Developers

#### Running the Application

1. **Apply database migration**:
   ```bash
   mysql -u root -p < migration_group_chat.sql
   ```

2. **Start backend** (Spring Boot):
   ```bash
   cd backend
   ./mvnw spring-boot:run
   ```

3. **Start frontend** (React):
   ```bash
   cd frontend
   npm run dev
   ```

4. **Test the feature**:
   - Create or join a group
   - Navigate to the group detail page
   - Click the "Chat" tab
   - Send messages and test mentions

#### Testing Group Chat

1. **Test real-time messaging**:
   - Open the same group in two different browsers/users
   - Send a message from one user
   - Verify it appears instantly on the other user's screen

2. **Test mentions**:
   - Type @ and verify the dropdown appears
   - Select a user and verify their name is added to the message
   - Type @all and verify it notifies all members

3. **Test message recall**:
   - Send a message
   - Click "Thu hồi" on your message
   - Verify the message content is replaced with "Tin nhắn đã được thu hồi"

4. **Test image sharing**:
   - Click the camera icon
   - Select an image
   - Verify the preview appears
   - Send and verify the image is displayed in the chat

5. **Test connection handling**:
   - Close and reopen the chat tab
   - Verify messages reload correctly
   - Disconnect network and verify auto-reconnect

## Security Considerations

1. **Membership validation** - Only active group members can send/view messages
2. **Recall permissions** - Only the message sender can recall their message
3. **WebSocket authentication** - Users must authenticate before joining chat rooms
4. **Input sanitization** - Message content is validated on both client and server

## Limitations

1. **No message editing** - Messages can only be recalled, not edited
2. **No message history pagination** - Currently loads last 50 messages
3. **No read receipts** - Messages don't show who has read them
4. **No typing indicators** - Users don't see when others are typing
5. **No message reactions** - Cannot react to messages with emojis

## Future Enhancements

Potential improvements for future versions:

1. **Message editing** - Allow editing within a time window
2. **Infinite scroll** - Load more messages as user scrolls up
3. **Read receipts** - Show which members have read messages
4. **Typing indicators** - Show when users are typing
5. **Message reactions** - React to messages with emojis
6. **Message search** - Search through chat history
7. **File sharing** - Support for documents and other file types
8. **Voice messages** - Record and send audio messages
9. **Message forwarding** - Forward messages to other chats
10. **Pinned messages** - Pin important messages to the top

## Troubleshooting

### WebSocket Connection Issues

If WebSocket connection fails:
1. Check if backend is running on port 8080
2. Verify CORS settings allow your frontend origin
3. Check browser console for error messages
4. Ensure firewall allows WebSocket connections

### Messages Not Appearing

If messages don't appear in real-time:
1. Verify user is authenticated in WebSocket
2. Check if user has joined the group chat room
3. Verify user is an active member of the group
4. Check browser console for JavaScript errors

### Database Errors

If you get database constraint errors:
1. Ensure migration script has been run successfully
2. Check foreign key relationships are properly set up
3. Verify group_id values reference existing groups

## Support

For issues or questions:
1. Check the console logs for error messages
2. Review the API documentation in API_DOCUMENTATION.md
3. Examine the source code comments for detailed explanations

---

**Last Updated**: 2026-06-05  
**Version**: 1.0.0