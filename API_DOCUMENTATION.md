# RESTful API Documentation - NLU Social Network

## Base URL
```
http://localhost:8080/api
```

## Authentication Endpoints

### Registration Flow (OTP-Based)

The registration process requires email verification via OTP (One-Time Password). It consists of 3 steps:

#### Step 1: Request OTP
```http
POST /auth/register/request-otp
Content-Type: application/json

{
  "email": "21045678@st.hcmuaf.edu.vn"
}
```

Response:
```json
{
  "message": "Mã OTP đã được gửi đến email của bạn",
  "expiresIn": 5
}
```

#### Step 2: Resend OTP (Optional)
```http
POST /auth/register/resend-otp
Content-Type: application/json

{
  "email": "21045678@st.hcmuaf.edu.vn"
}
```

#### Step 3: Complete Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "21045678@st.hcmuaf.edu.vn",
  "password": "SecurePass123!",
  "fullName": "Nguyễn Văn A",
  "faculty": "Khoa Công nghệ Thông tin",
  "className": "CNTT01",
  "academicYear": "2021-2025",
  "otp": "123456"
}
```

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*...)

**Email Format:**
- Must be in format: `{8 digits}@st.hcmuaf.edu.vn`
- Example: `21045678@st.hcmuaf.edu.vn`

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}
```

### Get Current User Profile
```http
GET /auth/me?userId={userId}
```

---

## User Endpoints

### Get User Profile
```http
GET /users/{userId}
```

### Search Users
```http
GET /users/search?q={query}
```

### Update Profile
```http
PUT /users/{userId}
Content-Type: application/json

{
  "fullName": "string",
  "email": "string",
  "bio": "string",
  "avatar": "string",
  "faculty": "string",
  "className": "string",
  "academicYear": "string"
}
```

### Change Password
```http
PUT /users/{userId}/password
Content-Type: application/json

{
  "oldPassword": "string",
  "newPassword": "string"
}
```

### Toggle Account Protection
```http
PATCH /users/{userId}/protection
```

---

## Friend Request Endpoints

### Send Friend Request
```http
POST /users/{userId}/friend-requests?targetId={targetId}
```

### Get Pending Friend Requests
```http
GET /users/{userId}/friend-requests/pending
```

### Accept Friend Request
```http
PUT /friend-requests/{friendshipId}/accept?userId={userId}
```

### Reject or Cancel Friend Request
```http
DELETE /friend-requests/{friendshipId}?userId={userId}
```

---

## Friendship Endpoints

### Get Friends List
```http
GET /users/{userId}/friends
```

### Unfriend
```http
DELETE /friendships/{friendshipId}?userId={userId}
```

### Get Friendship Status
```http
GET /users/{userId}/friendship-status/{targetId}
```

Response:
```json
{
  "status": "none|pending|pending_incoming|accepted"
}
```

---

## Feed & Post Endpoints

### Get Feed
```http
GET /feed?viewerId={viewerId}&page=0&size=10
```

### Get User Posts
```http
GET /users/{userId}/posts?viewerId={viewerId}&page=0&size=10
```

### Create Post
```http
POST /users/{userId}/posts
Content-Type: application/json

{
  "content": "string",
  "visibility": "public|friends|private",
  "media": ["string"]
}
```

### Get Post (with comments)
```http
GET /posts/{postId}
```

### Update Post
```http
PUT /posts/{postId}?userId={userId}
Content-Type: application/json

{
  "content": "string",
  "visibility": "public|friends|private",
  "media": ["string"]
}
```

### Delete Post
```http
DELETE /posts/{postId}?userId={userId}
```

---

## Share Endpoints

### Share a Post
Share a post to your timeline or to a group.

```http
POST /posts/{postId}/share?userId={userId}
Content-Type: application/json

{
  "shareContent": "Check out this post!",
  "shareVisibility": "public|friends|private",
  "targetGroupId": number  // Optional: share to a group instead of timeline
}
```

Response:
```json
{
  "id": number,
  "originalPostId": number,
  "originalPostTitle": "string",
  "originalPostContent": "string",
  "originalPostVisibility": "string",
  "originalAuthorId": number,
  "originalAuthorName": "string",
  "originalAuthorAvatar": "string",
  "shareContent": "string",
  "shareVisibility": "string",
  "sharedByUserId": number,
  "sharedByUserName": "string",
  "sharedByUserAvatar": "string",
  "sharedToGroupId": number,
  "sharedToGroupName": "string",
  "createdAt": "string",
  "isOriginalPostAvailable": boolean
}
```

### Get Post Shares
Get all visible shares for a specific post.

```http
GET /posts/{postId}/shares?viewerId={viewerId}&page=0&size=10
```

### Get Share Count
Get the total number of shares for a post.

```http
GET /posts/{postId}/shares/count
```

Response:
```json
{
  "count": number
}
```

### Check Share Status
Check if a user has already shared a post.

```http
GET /posts/{postId}/share/status?userId={userId}
```

Response:
```json
{
  "hasShared": boolean
}
```

### Delete Share
Delete your own share of a post.

```http
DELETE /shares/{shareId}?userId={userId}
```

### Get Shares for Feed
Get shares that should appear in the user's feed.

```http
GET /feed/shares?viewerId={viewerId}&page=0&size=10
```

### Get Group Shares
Get shares in a specific group.

```http
GET /groups/{groupId}/shares?viewerId={viewerId}&page=0&size=10
```

---

## Comment Endpoints

### Get Post Comments
```http
GET /posts/{postId}/comments
```

### Add Comment
```http
POST /posts/{postId}/comments?userId={userId}
Content-Type: application/json

{
  "content": "string",
  "media": ["string"]
}
```

### Reply to Comment
```http
POST /posts/{postId}/comments/{commentId}/replies?userId={userId}
Content-Type: application/json

{
  "content": "string",
  "media": ["string"]
}
```

### Update Comment
```http
PUT /posts/comments/{commentId}?userId={userId}
Content-Type: application/json

{
  "content": "string"
}
```

### Delete Comment
```http
DELETE /posts/comments/{commentId}?userId={userId}
```

---

## Like Endpoints

### Toggle Post Like
```http
POST /posts/{postId}/likes?userId={userId}
```

Response:
```json
{
  "postId": number,
  "likeCount": number,
  "likedByMe": boolean
}
```

### Toggle Comment Like
```http
POST /posts/comments/{commentId}/likes?userId={userId}
```

Response:
```json
{
  "commentId": number,
  "likeCount": number,
  "likedByMe": boolean
}
```

---

## Message Endpoints

### Send Message
```http
POST /users/{userId}/messages
Content-Type: application/json

{
  "receiverId": number,
  "content": "string",
  "mediaUrl": "string"
}
```

### Get Conversation Between Users
```http
GET /conversations/between/{userId1}/{userId2}
```

### Get User Messages (with specific user)
```http
GET /users/{userId}/messages?otherId={otherId}
```

### Get User Conversations
```http
GET /users/{userId}/conversations
```

### Get Unread Messages
```http
GET /users/{userId}/messages/unread
```

### Mark Conversation as Read
```http
PUT /users/{userId}/conversations/{otherId}/read
```

### Recall Message
```http
DELETE /messages/{messageId}/recall?userId={userId}
```

---

## Notification Endpoints

### Get Notifications
```http
GET /users/{userId}/notifications
```

### Get Unread Notification Count
```http
GET /users/{userId}/notifications/unread-count
```

Response:
```json
{
  "count": number
}
```

### Mark Notification as Read
```http
PUT /notifications/{notificationId}/read
```

### Mark All Notifications as Read
```http
PUT /users/{userId}/notifications/read-all
```

---

## Block Endpoints

### Get Blocked List
```http
GET /users/{userId}/blocks
```

### Block User
```http
POST /users/{userId}/blocks
Content-Type: application/json

{
  "blockedId": number
}
```

### Unblock User
```http
DELETE /users/{userId}/blocks/{blockedId}
```

---

## Group Endpoints

### Group CRUD

#### Create Group
```http
POST /groups
Content-Type: application/json

{
  "userId": number,
  "name": "string",
  "description": "string",
  "avatar": "string",
  "cover": "string",
  "privacy": "public|private",
  "approvalRequired": boolean
}
```

#### Get Group
```http
GET /groups/{groupId}
```

#### Update Group
```http
PUT /groups/{groupId}
Content-Type: application/json

{
  "userId": number,
  "name": "string",
  "description": "string",
  "avatar": "string",
  "cover": "string",
  "privacy": "public|private",
  "approvalRequired": boolean
}
```

#### Delete Group
```http
DELETE /groups/{groupId}?userId={userId}
```

### Group Discovery

#### Get Public Groups
```http
GET /groups/public?page=0&size=10
```

#### Get My Groups
```http
GET /groups/my-groups?userId={userId}&page=0&size=10
```

#### Search Groups
```http
GET /groups/search?q={keyword}&page=0&size=10
```

### Member Management

#### Join Group
```http
POST /groups/{groupId}/join
Content-Type: application/json

{
  "userId": number
}
```

Response:
```json
{
  "id": number,
  "groupId": number,
  "userId": number,
  "userName": "string",
  "userAvatar": "string",
  "role": "member|silver_key|gold_key",
  "status": "active|pending|blocked",
  "joinedAt": "string"
}
```

Or if approval is required:
```json
{
  "message": "Yêu cầu tham gia đã được gửi. Chờ phê duyệt."
}
```

#### Leave Group
```http
POST /groups/{groupId}/leave?userId={userId}
```

#### Get Group Members
```http
GET /groups/{groupId}/members?role=member
```

#### Remove Member
```http
DELETE /groups/{groupId}/members/{memberId}?adminId={adminId}
```

### Join Requests

#### Get Pending Join Requests
```http
GET /groups/{groupId}/join-requests?adminId={adminId}
```

#### Approve Join Request
```http
PUT /groups/{groupId}/join-requests/{requestId}/approve?adminId={adminId}
```

#### Reject Join Request
```http
DELETE /groups/{groupId}/join-requests/{requestId}?adminId={adminId}
```

### Role Management

#### Grant Admin Role
```http
PUT /groups/{groupId}/members/{targetUserId}/grant-admin?adminId={adminId}
```

#### Revoke Admin Role
```http
PUT /groups/{groupId}/members/{targetUserId}/revoke-admin?adminId={adminId}
```

### Ban Management

#### Ban User
```http
POST /groups/{groupId}/bans
Content-Type: application/json

{
  "adminId": number,
  "targetUserId": number,
  "reason": "string"
}
```

#### Unban User
```http
DELETE /groups/{groupId}/bans/{targetUserId}?adminId={adminId}
```

### Group Posts

#### Create Group Post
```http
POST /groups/{groupId}/posts
Content-Type: application/json

{
  "userId": number,
  "content": "string",
  "media": ["string"]
}
```

#### Get Group Posts
```http
GET /groups/{groupId}/posts?viewerId={viewerId}&filter=approved|pending&page=0&size=10
```

#### Approve Group Post
```http
PUT /groups/{groupId}/posts/{postId}/approve?adminId={adminId}
```

#### Reject Group Post
```http
DELETE /groups/{groupId}/posts/{postId}/reject?adminId={adminId}
```

#### Delete Group Post
```http
DELETE /groups/{groupId}/posts/{postId}?userId={userId}
```

### Group Post Interactions

#### Toggle Like on Group Post
```http
POST /groups/posts/{postId}/likes?userId={userId}
```

#### Add Comment to Group Post
```http
POST /groups/posts/{postId}/comments
Content-Type: application/json

{
  "userId": number,
  "content": "string",
  "parentCommentId": number,
  "media": ["string"]
}
```

### Group Notifications

#### Get Group Notifications
```http
GET /groups/notifications?userId={userId}
```

#### Get Unread Group Notification Count
```http
GET /groups/notifications/unread-count?userId={userId}
```

#### Mark Group Notification as Read
```http
PUT /groups/notifications/{notificationId}/read
```

#### Mark All Group Notifications as Read
```http
PUT /groups/notifications/read-all?userId={userId}
```

---

## Role Hierarchy

| Role | Description | Permissions |
|------|-------------|-------------|
| gold_key | Group Creator | Full control - can manage all settings, members, posts, and other admins |
| silver_key | Administrator | Can approve/reject posts and join requests, remove regular members, delete any post |
| member | Regular Member | Can create posts (subject to approval if enabled), view content |

### Key Permissions

| Action | gold_key | silver_key | member |
|--------|----------|------------|--------|
| Edit group settings | ✅ | ❌ | ❌ |
| Delete group | ✅ | ❌ | ❌ |
| Grant/revoke admin | ✅ | ❌ | ❌ |
| Remove any member | ✅ | ❌ | ❌ |
| Remove regular members | ✅ | ✅ | ❌ |
| Approve/reject posts | ✅ | ✅ | ❌ |
| Approve/reject join requests | ✅ | ✅ | ❌ |
| Ban/unban users | ✅ | ✅ | ❌ |
| Delete any post | ✅ | ✅ | ❌ |
| Delete own post | ✅ | ✅ | ✅ |
| Create posts | ✅ | ✅ | ✅ |

---

## RESTful API Design Principles Applied

### 1. Resource-Based URLs
- All endpoints use nouns (resources) instead of verbs
- Example: `/users/{userId}/friends` instead of `/api/getFriends?userId=1`

### 2. HTTP Methods for Actions
- **GET**: Retrieve resources
- **POST**: Create new resources
- **PUT**: Update resources
- **PATCH**: Partial updates
- **DELETE**: Remove resources

### 3. Hierarchical Structure
- Resources are organized hierarchically
- Example: `/users/{userId}/posts` - posts belonging to a user
- Example: `/posts/{postId}/comments` - comments belonging to a post

### 4. Consistent Naming Conventions
- Plural nouns for collections: `/users`, `/posts`, `/comments`
- Lowercase letters with hyphens for multi-word resources
- Path parameters in curly braces: `{userId}`, `{postId}`

### 5. Proper Use of Query Parameters
- Query parameters for filtering, pagination, and optional data
- Example: `/feed?viewerId=1&page=0&size=10`
- Path parameters for required resource identifiers

### 6. Stateless Communication
- Each request contains all information needed
- No session state stored on server between requests

### 7. Standardized Response Format
- Consistent JSON response structure
- Appropriate HTTP status codes (200, 201, 400, 404, 500, etc.)

## Migration Notes

### Old API → New API Mapping

| Old Endpoint | New Endpoint | Method Change |
|-------------|--------------|---------------|
| `POST /friendships/request?requesterId=1&addresseeId=2` | `POST /users/{userId}/friend-requests?targetId=2` | ✓ |
| `POST /friendships/accept?addresseeId=1&requesterId=2` | `PUT /friend-requests/{friendshipId}/accept?userId=1` | POST → PUT |
| `POST /friendships/reject?addresseeId=1&requesterId=2` | `DELETE /friend-requests/{friendshipId}?userId=1` | POST → DELETE |
| `POST /friendships/cancel?requesterId=1&addresseeId=2` | `DELETE /friend-requests/{friendshipId}?userId=1` | POST → DELETE |
| `POST /friendships/unfriend?userId=1&friendId=2` | `DELETE /friendships/{friendshipId}?userId=1` | POST → DELETE |
| `GET /friendships/pending?userId=1` | `GET /users/{userId}/friend-requests/pending` | ✓ |
| `GET /friendships/friends?userId=1` | `GET /users/{userId}/friends` | ✓ |
| `POST /messages/send` | `POST /users/{userId}/messages` | ✓ |
| `GET /messages/conversation?userId1=1&userId2=2` | `GET /conversations/between/{userId1}/{userId2}` | ✓ |
| `POST /messages/read?userId=1&otherId=2` | `PUT /users/{userId}/conversations/{otherId}/read` | POST → PUT |
| `POST /messages/recall` | `DELETE /messages/{messageId}/recall?userId=1` | POST → DELETE |
| `GET /notifications?userId=1` | `GET /users/{userId}/notifications` | ✓ |
| `POST /notifications/{id}/read` | `PUT /notifications/{notificationId}/read` | POST → PUT |
| `POST /notifications/read-all?userId=1` | `PUT /users/{userId}/notifications/read-all` | POST → PUT |
| `POST /blocks` | `POST /users/{userId}/blocks` | ✓ |
| `DELETE /blocks?blockerId=1&blockedId=2` | `DELETE /users/{userId}/blocks/{blockedId}` | ✓ |
| `GET /blocks?blockerId=1` | `GET /users/{userId}/blocks` | ✓ |
| `POST /posts/user/{userId}` | `POST /users/{userId}/posts` | ✓ |
| `PUT /posts/{postId}/user/{userId}` | `PUT /posts/{postId}?userId={userId}` | ✓ |
| `DELETE /posts/{postId}/user/{userId}` | `DELETE /posts/{postId}?userId={userId}` | ✓ |
| `POST /posts/{postId}/comments/user/{userId}` | `POST /posts/{postId}/comments?userId={userId}` | ✓ |
| `POST /posts/{postId}/comments/{commentId}/reply/user/{userId}` | `POST /posts/{postId}/comments/{commentId}/replies?userId={userId}` | ✓ |
| `PUT /posts/comments/{commentId}/user/{userId}` | `PUT /posts/comments/{commentId}?userId={userId}` | ✓ |
| `DELETE /posts/comments/{commentId}/user/{userId}` | `DELETE /posts/comments/{commentId}?userId={userId}` | ✓ |
| `POST /posts/{postId}/likes/user/{userId}` | `POST /posts/{postId}/likes?userId={userId}` | ✓ |
| `POST /posts/comments/{commentId}/likes/user/{userId}` | `POST /posts/comments/{commentId}/likes?userId={userId}` | ✓ |

## Benefits of RESTful Design

1. **Discoverability**: Clear, predictable URL structure makes API easier to explore
2. **Scalability**: Stateless design allows for better horizontal scaling
3. **Interoperability**: Standard HTTP methods work with any client
4. **Maintainability**: Consistent patterns make code easier to maintain
5. **Caching**: Proper use of HTTP methods enables effective caching
6. **Separation of Concerns**: Clear separation between client and server