# Group and Role Management Feature - Implementation Guide

## Overview

This document provides a comprehensive guide to the group and role management feature implemented for the NLU Social Network project.

## Features Implemented

### 1. Group Creation and Management
- ✅ Create groups with name, description, avatar, and cover
- ✅ Set group privacy (public/private)
- ✅ Enable/disable member approval requirement
- ✅ Edit group settings (admin only)
- ✅ Delete groups (creator only)

### 2. Role-Based Access Control
- ✅ **Gold Key (Creator)**: Full control over the group
- ✅ **Silver Key (Admin)**: Can manage posts, members, and join requests
- ✅ **Member**: Regular member with posting privileges

### 3. Member Management
- ✅ Join public groups directly
- ✅ Request to join private/approval-required groups
- ✅ Approve/reject join requests (admin)
- ✅ Remove members (admin)
- ✅ Leave groups
- ✅ Ban/unban users (admin)

### 4. Group Posts
- ✅ Create posts within groups
- ✅ Posts inherit group privacy settings
- ✅ Post approval workflow (if enabled)
- ✅ Approve/reject posts (admin)
- ✅ Delete posts (admin can delete any, members can delete own)
- ✅ Like and comment on group posts

### 5. Group Notifications
- ✅ Notifications for join requests
- ✅ Notifications for post approval/rejection
- ✅ Notifications for member removal
- ✅ Notifications for role changes

## Database Schema

The following tables were added to support groups:

1. **groups** - Main group information
2. **group_members** - Member relationships with roles
3. **group_posts** - Links posts to groups with approval status
4. **group_join_requests** - Pending membership requests
5. **group_notifications** - Group-specific notifications
6. **group_bans** - Banned users list

See `database.sql` for the complete schema (all tables including groups are in one file).

## Backend Implementation

### Entities
- `Group.java` - Main group entity
- `GroupMember.java` - Member with role and status
- `GroupPost.java` - Post with approval status
- `GroupJoinRequest.java` - Join request with status
- `GroupNotification.java` - Group notification
- `GroupBan.java` - Ban record

### Repositories
- `GroupRepository.java`
- `GroupMemberRepository.java`
- `GroupPostRepository.java`
- `GroupJoinRequestRepository.java`
- `GroupNotificationRepository.java`
- `GroupBanRepository.java`

### Service
- `GroupService.java` - Complete business logic for all group operations

### Controller
- `GroupController.java` - RESTful API endpoints

### DTOs
- `GroupResponse.java`
- `GroupRequest.java`
- `GroupMemberResponse.java`
- `GroupJoinRequestResponse.java`
- `GroupPostResponse.java`
- `GroupNotificationResponse.java`

## Frontend Implementation

### Pages
- `GroupsPage.tsx` - Group discovery and management
- `GroupDetailPage.tsx` - Group detail view with tabs for posts, members, requests, and settings

### Components Updated
- `AppLayout.tsx` - Added "Nhóm" navigation link
- `App.tsx` - Added group routes

### Types
- Added group-related TypeScript interfaces to `types.ts`

### API
- Extended `api.ts` with all group-related API functions

## API Endpoints

All endpoints are documented in `API_DOCUMENTATION.md`. Key endpoints include:

### Group Management
- `POST /api/groups` - Create group
- `GET /api/groups/{groupId}` - Get group details
- `PUT /api/groups/{groupId}` - Update group
- `DELETE /api/groups/{groupId}?userId={userId}` - Delete group

### Discovery
- `GET /api/groups/public` - Browse public groups
- `GET /api/groups/my-groups?userId={userId}` - User's groups
- `GET /api/groups/search?q={keyword}` - Search groups

### Member Management
- `POST /api/groups/{groupId}/join` - Join/request to join
- `POST /api/groups/{groupId}/leave?userId={userId}` - Leave group
- `GET /api/groups/{groupId}/members` - Get members
- `DELETE /api/groups/{groupId}/members/{memberId}?adminId={adminId}` - Remove member

### Join Requests
- `GET /api/groups/{groupId}/join-requests?adminId={adminId}` - Get pending requests
- `PUT /api/groups/{groupId}/join-requests/{requestId}/approve?adminId={adminId}` - Approve
- `DELETE /api/groups/{groupId}/join-requests/{requestId}?adminId={adminId}` - Reject

### Role Management
- `PUT /api/groups/{groupId}/members/{targetUserId}/grant-admin?adminId={adminId}` - Grant admin
- `PUT /api/groups/{groupId}/members/{targetUserId}/revoke-admin?adminId={adminId}` - Revoke admin

### Group Posts
- `POST /api/groups/{groupId}/posts` - Create post
- `GET /api/groups/{groupId}/posts` - Get posts
- `PUT /api/groups/{groupId}/posts/{postId}/approve?adminId={adminId}` - Approve post
- `DELETE /api/groups/{groupId}/posts/{postId}/reject?adminId={adminId}` - Reject post
- `DELETE /api/groups/{groupId}/posts/{postId}?userId={userId}` - Delete post

## Setup Instructions

### 1. Database Setup
Run the main SQL script to create all tables:
```sql
source database.sql
```

> **Note**: The `groups` table uses backticks in the SQL schema because "groups" is a reserved keyword in MySQL. The Java entity also uses `@Table(name = "\`groups\`")` to match.

### 2. Backend Setup
The Spring Boot application will automatically create the tables if using `ddl-auto=update`, or you can run the migration script manually.

### 3. Frontend Setup
No additional setup required. The group pages are already integrated into the routing.

### 4. Running the Application
```bash
# Start backend
cd backend
mvn spring-boot:run

# Start frontend
cd frontend
npm run dev
```

## Usage Guide

### Creating a Group
1. Navigate to `/groups` or click "Nhóm" in the user menu
2. Click "+ Tạo nhóm mới"
3. Fill in group details:
   - Name (required)
   - Description (optional)
   - Privacy setting (public/private)
   - Toggle approval requirement
4. Click "Tạo nhóm"

### Joining a Group
- **Public groups**: Click "Tham gia" to join immediately
- **Private/approval groups**: Click "Tham gia" to send a request, wait for admin approval

### Managing a Group (Admin)
1. Navigate to your group
2. Click "Cài đặt" to edit group settings
3. Use the tabs to manage:
   - **Bài viết**: View, approve, or delete posts
   - **Thành viên**: View members, grant/revoke admin, remove members
   - **Yêu cầu**: Approve or reject join requests
   - **Quản lý**: Delete the group (creator only)

### Posting in a Group
1. Navigate to the group
2. Click "+ Đăng bài"
3. Write your content
4. Click "Đăng"
5. If approval is required, post will be reviewed by admins

## Role Permissions

| Permission | Gold Key | Silver Key | Member |
|-----------|----------|------------|--------|
| Create posts | ✅ | ✅ | ✅ |
| Edit group settings | ✅ | ❌ | ❌ |
| Delete group | ✅ | ❌ | ❌ |
| Manage roles | ✅ | ❌ | ❌ |
| Approve posts | ✅ | ✅ | ❌ |
| Approve join requests | ✅ | ✅ | ❌ |
| Remove members | ✅ | ✅ (regular only) | ❌ |
| Ban users | ✅ | ✅ | ❌ |
| Delete any post | ✅ | ✅ | ❌ |
| Delete own post | ✅ | ✅ | ✅ |

## Testing

### Manual Testing Checklist

1. **Group Creation**
   - [ ] Create a public group
   - [ ] Create a private group
   - [ ] Create a group with approval required
   - [ ] Verify creator is gold key

2. **Group Discovery**
   - [ ] Browse public groups
   - [ ] Search groups by name
   - [ ] View joined groups

3. **Joining Groups**
   - [ ] Join a public group directly
   - [ ] Request to join a private group
   - [ ] Verify pending status
   - [ ] Admin approves request
   - [ ] Verify membership

4. **Member Management**
   - [ ] View member list
   - [ ] Grant admin role (gold key only)
   - [ ] Revoke admin role (gold key only)
   - [ ] Remove member (admin)
   - [ ] Leave group (non-creator)

5. **Post Management**
   - [ ] Create post in group
   - [ ] Post appears immediately (no approval)
   - [ ] Post requires approval (when enabled)
   - [ ] Admin approves post
   - [ ] Admin rejects post
   - [ ] Delete own post
   - [ ] Admin deletes any post

6. **Group Settings**
   - [ ] Update group name
   - [ ] Update description
   - [ ] Change privacy setting
   - [ ] Toggle approval requirement
   - [ ] Delete group (creator only)

## Known Limitations

1. **Media in Group Posts**: Currently supports text only. Media upload can be added by extending the existing media handling from regular posts.

2. **Group Chat**: Not implemented. Groups currently support posts and comments, but not real-time group chat.

3. **Group Events**: Not implemented. This could be added as a future enhancement.

4. **Group Analytics**: No statistics or analytics dashboard for group admins.

5. **Bulk Actions**: No bulk member management or bulk post actions.

## Future Enhancements

1. **Group Chat**: Add real-time group messaging using WebSocket
2. **Group Events**: Create and manage events within groups
3. **Group Files**: Share and manage files in groups
4. **Group Analytics**: Dashboard with member activity, post engagement, etc.
5. **Group Templates**: Pre-defined group settings for common use cases
6. **Group Recommendations**: Suggest groups based on user interests
7. **Group Notifications Settings**: Allow members to customize notification preferences
8. **Group Search Filters**: Advanced filtering by category, size, activity level
9. **Group Moderation Tools**: Enhanced tools for content moderation
10. **Group Insights**: Member growth, engagement metrics, popular posts

## Troubleshooting

### Database Errors
If you encounter database errors, ensure:
1. The `social_app` database exists
2. The `database.sql` script has been executed
3. Foreign key constraints are satisfied
4. If you see errors about the `groups` table, make sure backticks are used (it's a reserved keyword)

### Backend Errors
If the backend fails to start:
1. Check that all entity classes are in the correct package
2. Verify that all repository interfaces extend `JpaRepository`
3. Ensure the `GroupService` is properly annotated with `@Service`
4. Check that the `GroupController` is annotated with `@RestController`

### Frontend Errors
If the frontend doesn't show group features:
1. Verify that all group pages are imported in `App.tsx`
2. Check that routes are correctly defined
3. Ensure the API functions in `api.ts` are correctly implemented
4. Clear browser cache and restart the development server

## Support

For questions or issues, please refer to:
- `API_DOCUMENTATION.md` for API details
- `database.sql` for complete database schema
- Source code comments in service and controller classes
