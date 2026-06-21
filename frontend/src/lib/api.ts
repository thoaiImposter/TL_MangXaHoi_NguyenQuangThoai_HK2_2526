import type { AuthPayload, AuthSession, PostComment, PostFeedItem, Post, PostShare, ProfileUpdatePayload, User, Friendship, FriendshipStatus, Message, BlockedUser, NotificationItem, Group, GroupMember, GroupJoinRequest, GroupPost, GroupNotification, PollResults, ReportItem, ReportTargetType, ReportStatus, AdminStats, AdminUserItem, AdminGroupItem, AdminPostItem, AdminCommentItem, Faculty, Major } from '../types';
import { uploadFileDirect, type UploadFolder, type UploadProgress } from './upload';

const BASE_URL = 'http://localhost:8080/api';
const BACKEND_ORIGIN = 'http://localhost:8080';

/** Convert relative media URLs to full backend URLs */
export function resolveMediaUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) return url;
  return BACKEND_ORIGIN + url;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {};
  // Only set Content-Type if not using FormData (which sets its own boundary)
  if (!(init?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('social_token');
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  if (init?.headers) {
    Object.assign(headers, init.headers as Record<string, string>);
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    headers,
    ...init,
  });

  const text = await response.text();
  let payload: unknown = text;

  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    // Extract error message from payload
    let errorMessage = typeof payload === 'string' && payload ? payload : `Request failed (${response.status})`;
    
    // Backend controllers use either "message" or "error".
    if (typeof payload === 'object' && payload !== null) {
      if ('message' in payload && typeof payload.message === 'string') {
        errorMessage = payload.message;
      } else if ('error' in payload && typeof payload.error === 'string') {
        errorMessage = payload.error;
      }
    }
    
    throw new Error(errorMessage);
  }

  return payload as T;
}

type MediaItem = { url: string; type: string; name?: string; size?: number };

/** Convert MIME type to a proper file extension */
export function mimeToExtension(mimeType: string): string {
  if (!mimeType) return '.bin';
  const map: Record<string, string> = {
    'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
    'image/webp': '.webp', 'image/bmp': '.bmp', 'image/svg+xml': '.svg',
    'video/mp4': '.mp4', 'video/webm': '.webm', 'video/ogg': '.ogv',
    'video/quicktime': '.mov', 'video/x-msvideo': '.avi', 'video/3gpp': '.3gp',
    'application/pdf': '.pdf',
  };
  if (map[mimeType]) return map[mimeType];
  // Neu MIME type chua co trong map thi lay subtype lam duoi file.
  const parts = mimeType.split('/');
  if (parts.length === 2) {
    const sub = parts[1].replace(/[^a-z0-9]/g, '');
    return sub.length > 0 && sub.length <= 5 ? '.' + sub : '.bin';
  }
  return '.bin';
}

export const api = {
  // Auth endpoints
  login: (payload: AuthPayload) =>
    request<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  // OTP-based registration endpoints
  requestRegistrationOtp: (email: string, role: string = 'student') =>
    request<{ message: string; expiresIn: number; maxAttempts?: number; resendCooldown?: number }>('/auth/register/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  resendRegistrationOtp: (email: string, role: string = 'student') =>
    request<{ message: string; expiresIn: number }>('/auth/register/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),
  register: (payload: {
    email: string;
    password: string;
    fullName: string;
    role: string;
    avatar?: string;
    cover?: string;
    bio?: string;
    faculty?: string;
    facultyId?: number;
    className?: string;
    academicYear?: string;
    academicTitle?: string;
    majorId?: number;
    otp: string;
  }) =>
    request<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getCurrentUserProfile: (_userId: number) => request<User>('/auth/me'),
  getFaculties: () => request<Faculty[]>('/catalog/faculties'),
  getMajors: (facultyId?: number) => request<Major[]>(`/catalog/majors${facultyId ? `?facultyId=${facultyId}` : ''}`),

  // User endpoints
  getProfile: (userId: number) => request<User>(`/users/${userId}`),
  updateProfile: (userId: number, payload: ProfileUpdatePayload) =>
    request<User>(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  changePassword: (userId: number, payload: { oldPassword: string; newPassword: string }) =>
    request<{ success: boolean }>(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  setProtection: (userId: number, enabled: boolean) => request<User>(`/users/${userId}/protection`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  }),
  searchUsers: (q: string) => request<User[]>(`/users/search?q=${encodeURIComponent(q)}`),
  getFacultyUnions: (_requesterId: number) => request<User[]>('/users/faculty-unions'),
  searchPosts: (q: string, viewerId?: number, page = 0, size = 20) =>
    request<PostFeedItem[]>(`/posts/search?q=${encodeURIComponent(q)}${viewerId ? `&viewerId=${viewerId}` : ''}&page=${page}&size=${size}`),

  createReport: (_reporterId: number, payload: { targetType: ReportTargetType; targetId: number; reason: string; details?: string }) =>
    request<ReportItem>('/reports', { method: 'POST', body: JSON.stringify(payload) }),
  getAdminReports: (_adminId: number, status: ReportStatus | 'all' = 'pending', page = 0, size = 30) =>
    request<ReportItem[]>(`/admin/reports?status=${status}&page=${page}&size=${size}`),
  getAdminReportStats: (_adminId: number) =>
    request<Record<'all' | ReportStatus, number>>('/admin/reports/stats'),
  resolveReport: (reportId: number, _adminId: number, payload: { action: 'dismiss' | 'resolve' | 'delete_target'; adminNote?: string }) =>
    request<ReportItem>(`/admin/reports/${reportId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getAdminStats: (_adminId: number) => request<AdminStats>('/admin/stats'),
  getAdminUsers: (_adminId: number, q = '', role = 'all', status = 'all') =>
    request<AdminUserItem[]>(`/admin/users?q=${encodeURIComponent(q)}&role=${role}&status=${status}`),
  getAdminGroups: (_adminId: number, q = '', privacy = 'all') =>
    request<AdminGroupItem[]>(`/admin/groups?q=${encodeURIComponent(q)}&privacy=${privacy}`),
  getAdminPosts: (_adminId: number, q = '', visibility = 'all') =>
    request<AdminPostItem[]>(`/admin/posts?q=${encodeURIComponent(q)}&visibility=${visibility}`),
  getAdminComments: (_adminId: number, q = '') =>
    request<AdminCommentItem[]>(`/admin/comments?q=${encodeURIComponent(q)}`),
  setAdminUserLocked: (_adminId: number, userId: number, locked: boolean) =>
    request<AdminUserItem>(`/admin/users/${userId}/lock?locked=${locked}`, { method: 'PATCH' }),
  deleteAdminItem: (_adminId: number, type: 'users' | 'groups' | 'posts' | 'comments', id: number) =>
    request<void>(`/admin/${type}/${id}`, { method: 'DELETE' }),

  // Feed endpoints
  getFeed: (viewerId?: number, page = 0, size = 10) => request<PostFeedItem[]>(`/feed?${viewerId ? `viewerId=${viewerId}&` : ''}page=${page}&size=${size}`),

  // Post endpoints (RESTful: /users/{userId}/posts)
  getUserPosts: (userId: number, viewerId?: number, page = 0, size = 10, personalOnly = false) => request<PostFeedItem[]>(`/users/${userId}/posts?${viewerId ? `viewerId=${viewerId}&` : ''}personalOnly=${personalOnly}&page=${page}&size=${size}`),
  createPost: (_userId: number, payload: { content: string; visibility?: string; media?: MediaItem[] }) =>
    request<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updatePost: (postId: number, _userId: number, payload: { content: string; visibility?: string; media?: MediaItem[] }) =>
    request<Post>(`/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deletePost: (postId: number, _userId: number) =>
    request<void>(`/posts/${postId}`, {
      method: 'DELETE',
    }),
  getPost: (postId: number, viewerId?: number) =>
    request<PostFeedItem>(`/posts/${postId}${viewerId ? `?viewerId=${viewerId}` : ''}`),

  // Post like endpoints (RESTful: /posts/{postId}/likes)
  toggleLike: (postId: number, _userId: number) =>
    request<{ postId: number; likeCount: number; likedByMe: boolean }>(`/posts/${postId}/likes`, {
      method: 'POST',
    }),

  // Post comment endpoints (RESTful: /posts/{postId}/comments)
  getComments: (postId: number, viewerId?: number) =>
    request<PostComment[]>(`/posts/${postId}/comments${viewerId ? `?viewerId=${viewerId}` : ''}`),
  addComment: (postId: number, _userId: number, payload: { content: string; media?: string[] }) =>
    request<PostComment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  replyComment: (postId: number, commentId: number, _userId: number, payload: { content: string; media?: string[] }) =>
    request<PostComment>(`/posts/${postId}/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateComment: (commentId: number, _userId: number, content: string) =>
    request<PostComment>(`/posts/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  deleteComment: (commentId: number, _userId: number) =>
    request<void>(`/posts/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // Comment like endpoints (RESTful: /posts/comments/{commentId}/likes)
  toggleCommentLike: (commentId: number, _userId: number) =>
    request<{ commentId: number; likeCount: number; likedByMe: boolean }>(`/posts/comments/${commentId}/likes`, {
      method: 'POST',
    }),

  // Friend request endpoints (RESTful: /users/{userId}/friend-requests)
  sendFriendRequest: (_userId: number, targetId: number) =>
    request<Friendship>(`/friend-requests?targetId=${targetId}`, { method: 'POST' }),
  getPendingFriendRequests: (userId: number) => request<Friendship[]>(`/users/${userId}/friend-requests/pending`),
  acceptFriendRequest: (friendshipId: number, _userId: number) =>
    request<Friendship>(`/friend-requests/${friendshipId}/accept`, { method: 'PUT' }),
  rejectOrCancelFriendRequest: (friendshipId: number, _userId: number) =>
    request<void>(`/friend-requests/${friendshipId}`, { method: 'DELETE' }),

  // Friendship endpoints (RESTful: /users/{userId}/friends)
  getFriends: (userId: number) => request<Friendship[]>(`/users/${userId}/friends`),
  unfriend: (friendshipId: number, _userId: number) =>
    request<void>(`/friendships/${friendshipId}`, { method: 'DELETE' }),
  getFriendshipStatus: (viewerId: number, targetId: number) =>
    request<FriendshipStatus>(`/users/${viewerId}/friendship-status/${targetId}`),

  // Message endpoints (RESTful: /users/{userId}/messages)
  sendMessage: (_senderId: number, receiverId: number, content: string, mediaUrl?: string) =>
    request<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiverId, content, mediaUrl }),
    }),
  getMessages: (userId1: number, userId2: number) => request<Message[]>(`/conversations/between/${userId1}/${userId2}`),
  getConversations: (userId: number) => request<Message[]>(`/users/${userId}/conversations`),
  getUnreadMessages: (userId: number) => request<Message[]>(`/users/${userId}/messages/unread`),
  markRead: (userId: number, otherId: number) =>
    request<void>(`/users/${userId}/conversations/${otherId}/read`, { method: 'PUT' }),
  recallMessage: (messageId: number, _userId: number) =>
    request<Message>(`/messages/${messageId}/recall`, { method: 'DELETE' }),

  // Block endpoints (RESTful: /users/{userId}/blocks)
  blockUser: (userId: number, blockedId: number) =>
    request<void>(`/users/${userId}/blocks`, {
      method: 'POST',
      body: JSON.stringify({ blockedId }),
    }),
  unblockUser: (userId: number, blockedId: number) =>
    request<void>(`/users/${userId}/blocks/${blockedId}`, { method: 'DELETE' }),
  getBlockedList: (userId: number) => request<BlockedUser[]>(`/users/${userId}/blocks`),

  // Notification endpoints (RESTful: /users/{userId}/notifications)
  getNotifications: (userId: number) => request<NotificationItem[]>(`/users/${userId}/notifications`),
  getUnreadNotificationCount: (userId: number) => request<{ count: number }>(`/users/${userId}/notifications/unread-count`),
  markNotificationRead: (id: number) => request<void>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: (userId: number) => request<void>(`/users/${userId}/notifications/read-all`, { method: 'PUT' }),

  // Group endpoints
  // Group CRUD
  createGroup: (_userId: number, payload: { name: string; description?: string; avatar?: string; cover?: string; privacy?: 'public' | 'private'; approvalRequired?: boolean }) =>
    request<Group>('/groups', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getGroup: (groupId: number) => request<Group>(`/groups/${groupId}`),
  updateGroup: (groupId: number, _userId: number, payload: { name?: string; description?: string; avatar?: string; cover?: string; privacy?: 'public' | 'private'; approvalRequired?: boolean }) =>
    request<Group>(`/groups/${groupId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  deleteGroup: (groupId: number, _userId: number) =>
    request<void>(`/groups/${groupId}`, { method: 'DELETE' }),

  // Group Discovery
  getPublicGroups: (page = 0, size = 10) => request<Group[]>(`/groups/public?page=${page}&size=${size}`),
  getMyGroups: (_userId: number, page = 0, size = 10) => request<Group[]>(`/groups/my-groups?page=${page}&size=${size}`),
  searchGroups: (q: string, page = 0, size = 10) => request<Group[]>(`/groups/search?q=${encodeURIComponent(q)}&page=${page}&size=${size}`),

  // Member Management
  joinGroup: (groupId: number, _userId: number) =>
    request<GroupMember | { message: string }>(`/groups/${groupId}/join`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),
  leaveGroup: (groupId: number, _userId: number) =>
    request<void>(`/groups/${groupId}/leave`, { method: 'POST' }),
  getGroupMembers: (groupId: number, role?: string) =>
    request<GroupMember[]>(`/groups/${groupId}/members${role ? `?role=${role}` : ''}`),
  removeMember: (groupId: number, memberId: number, _adminId: number) =>
    request<void>(`/groups/${groupId}/members/${memberId}`, { method: 'DELETE' }),

  // Join Requests
  getMyPendingGroupJoinRequests: (_userId: number) =>
    request<GroupJoinRequest[]>('/groups/join-requests/pending'),
  getPendingJoinRequests: (groupId: number, _adminId: number) =>
    request<GroupJoinRequest[]>(`/groups/${groupId}/join-requests`),
  approveJoinRequest: (groupId: number, requestId: number, _adminId: number) =>
    request<GroupMember>(`/groups/${groupId}/join-requests/${requestId}/approve`, { method: 'PUT' }),
  rejectJoinRequest: (groupId: number, requestId: number, _adminId: number) =>
    request<void>(`/groups/${groupId}/join-requests/${requestId}`, { method: 'DELETE' }),

  // Role Management
  grantAdminRole: (groupId: number, targetUserId: number, _adminId: number) =>
    request<GroupMember>(`/groups/${groupId}/members/${targetUserId}/grant-admin`, { method: 'PUT' }),
  revokeAdminRole: (groupId: number, targetUserId: number, _adminId: number) =>
    request<GroupMember>(`/groups/${groupId}/members/${targetUserId}/revoke-admin`, { method: 'PUT' }),

  // Ban Management
  banUser: (groupId: number, _adminId: number, targetUserId: number, reason?: string) =>
    request<void>(`/groups/${groupId}/bans`, {
      method: 'POST',
      body: JSON.stringify({ targetUserId, reason }),
    }),
  unbanUser: (groupId: number, targetUserId: number, _adminId: number) =>
    request<void>(`/groups/${groupId}/bans/${targetUserId}`, { method: 'DELETE' }),

  // Group Posts
  createGroupPost: (groupId: number, _userId: number, payload: { content: string; media?: MediaItem[] }) =>
    request<GroupPost>(`/groups/${groupId}/posts`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createGroupAnnouncement: (groupId: number, _userId: number, payload: { content: string; media?: MediaItem[] }) =>
    request<GroupPost>(`/groups/${groupId}/announcements`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getGroupPosts: (groupId: number, viewerId?: number, filter?: string, page = 0, size = 10) =>
    request<GroupPost[]>(`/groups/${groupId}/posts?${viewerId ? `viewerId=${viewerId}&` : ''}${filter ? `filter=${filter}&` : ''}page=${page}&size=${size}`),
  approveGroupPost: (groupId: number, postId: number, _adminId: number) =>
    request<GroupPost>(`/groups/${groupId}/posts/${postId}/approve`, { method: 'PUT' }),
  rejectGroupPost: (groupId: number, postId: number, _adminId: number) =>
    request<void>(`/groups/${groupId}/posts/${postId}/reject`, { method: 'DELETE' }),
  deleteGroupPost: (groupId: number, postId: number, _userId: number) =>
    request<void>(`/groups/${groupId}/posts/${postId}`, { method: 'DELETE' }),

  // Group Post Interactions
  toggleLikeGroupPost: (groupId: number, postId: number, _userId: number) =>
    request<{ postId: number; likeCount: number; likedByMe: boolean }>(`/groups/${groupId}/posts/${postId}/likes`, { method: 'POST' }),
  addCommentGroupPost: (groupId: number, postId: number, _userId: number, payload: { content: string; parentCommentId?: number; media?: string[] }) =>
    request<PostComment>(`/groups/${groupId}/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // Group Notifications
  getGroupNotifications: (_userId: number) => request<GroupNotification[]>('/groups/notifications'),
  getUnreadGroupNotificationCount: (_userId: number) => request<{ count: number }>('/groups/notifications/unread-count'),
  markGroupNotificationRead: (notificationId: number) => request<void>(`/groups/notifications/${notificationId}/read`, { method: 'PUT' }),
  markAllGroupNotificationsRead: (_userId: number) => request<void>('/groups/notifications/read-all', { method: 'PUT' }),

  // Post Share endpoints
  sharePost: (postId: number, _userId: number, payload: { shareContent?: string; shareVisibility?: 'public' | 'friends' | 'private' }) =>
    request<PostShare>(`/posts/${postId}/share`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getPostShares: (postId: number, viewerId?: number, page = 0, size = 10) =>
    request<PostShare[]>(`/posts/${postId}/shares?${viewerId ? `viewerId=${viewerId}&` : ''}page=${page}&size=${size}`),
  getShareCount: (postId: number) =>
    request<{ count: number }>(`/posts/${postId}/shares/count`),
  getShareStatus: (postId: number, _userId: number) =>
    request<{ hasShared: boolean }>(`/posts/${postId}/share/status`),
  deleteShare: (shareId: number, _userId: number) =>
    request<void>(`/shares/${shareId}`, { method: 'DELETE' }),
  getSharesForFeed: (viewerId?: number, page = 0, size = 10) =>
    request<PostShare[]>(`/feed/shares?${viewerId ? `viewerId=${viewerId}&` : ''}page=${page}&size=${size}`),
  getGroupShares: (groupId: number, viewerId?: number, page = 0, size = 10) =>
    request<PostShare[]>(`/groups/${groupId}/shares?${viewerId ? `viewerId=${viewerId}&` : ''}page=${page}&size=${size}`),
  getUserShares: (userId: number, viewerId?: number, page = 0, size = 10) =>
    request<PostShare[]>(`/users/${userId}/shares?${viewerId ? `viewerId=${viewerId}&` : ''}page=${page}&size=${size}`),

  // Group Chat endpoints
  sendGroupMessage: (groupId: number, _senderId: number, content: string, mediaUrl?: string, mentionedUserIds?: number[], isAllMentioned?: boolean) =>
    request<Message>(`/groups/${groupId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content,
        mediaUrl,
        mentionedUserIds,
        isAllMentioned
      }),
    }),
  getGroupMessages: (groupId: number, _userId: number, page = 0, size = 50) =>
    request<Message[]>(`/groups/${groupId}/messages?page=${page}&size=${size}`),
  joinGroupChat: (groupId: number, _userId: number) =>
    request<void>(`/groups/${groupId}/chat/join`, { method: 'POST' }),
  leaveGroupChat: (groupId: number, _userId: number) =>
    request<void>(`/groups/${groupId}/chat/leave`, { method: 'POST' }),

  // File upload endpoint (multipart form)
  uploadFile: (file: File, type?: 'image' | 'video' | 'file', folder: UploadFolder = 'posts', onProgress?: UploadProgress) =>
    uploadFileDirect(file, type, folder, onProgress),

  // Poll endpoints
  createPoll: (_userId: number, payload: { title: string; content: string; visibility?: string; options: string[]; endDate?: string; allowMultiple?: boolean }) =>
    request<Post>(`/polls`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createGroupPoll: (groupId: number, _userId: number, payload: { title: string; content: string; options: string[]; endDate?: string; allowMultiple?: boolean }) =>
    request<GroupPost>(`/groups/${groupId}/posts/poll`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  votePoll: (postId: number, _userId: number, optionIds: number[]) =>
    request<PollResults>(`/polls/${postId}/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionIds }),
    }),
  getPollResults: (postId: number, _userId: number) =>
    request<PollResults>(`/polls/${postId}/results`),
  removePollVote: (postId: number, _userId: number) =>
    request<void>(`/polls/${postId}/vote`, { method: 'DELETE' }),

  // Lay danh sach co van theo khoa de them vao nhom/lop.
  getAdvisorsByFaculty: (_requesterId: number) =>
    request<User[]>('/groups/advisors'),
  // Them truc tiep mot co van da co tai khoan vao nhom.
  addAdvisorToGroup: (groupId: number, _adminId: number, advisorId: number) =>
    request<GroupMember>(`/groups/${groupId}/add-advisor?advisorId=${advisorId}`, { method: 'POST' }),
  // Gui email moi co van vao nhom khi biet email.
  inviteAdvisorToGroup: (groupId: number, _adminId: number, email: string) =>
    request<{ message: string; inviteLink: string; qrImageUrl: string }>(`/groups/${groupId}/invite-advisor`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Moi mot sinh vien vao nhom bang email MSSV@st.hcmuaf.edu.vn.
  inviteStudentToGroup: (groupId: number, _adminId: number, email: string) =>
    request<{ message: string; inviteLink: string; qrImageUrl: string }>(`/groups/${groupId}/invite-student`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  // Doc file Excel, lay cot MSSV va them/moi nhieu sinh vien vao nhom.
  bulkInviteStudents: (groupId: number, _adminId: number, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ message: string; added: number; skipped: number; invited: number; errors: number; total: number; addedNames: string[]; invitedEmails: string[]; errorDetails: string[] }>(
      `/groups/${groupId}/bulk-invite-students`,
      { method: 'POST', body: formData }
    );
  },
};
