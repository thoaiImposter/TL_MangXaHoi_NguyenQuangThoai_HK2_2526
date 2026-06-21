export type UserRole = 'student' | 'advisor' | 'faculty_union' | 'school_union' | 'admin';

export interface User {
  id: number;
  email: string;
  fullName: string;
  role: UserRole;
  avatar: string | null;
  cover: string | null;
  bio: string | null;
  faculty: string | null;
  className: string | null;
  academicYear: string | null;
  academicTitle: string | null;
  majorId: number | null;
  majorCode: string | null;
  majorName: string | null;
  majorCampus: string | null;
  accountProtection: boolean;
  createdAt: string;
  updatedAt: string;
}

// SessionUser is the same as User, used for localStorage session
export type SessionUser = User;

export interface AuthSession {
  user: User;
  token: string;
}

export interface AuthPayload {
  email: string;
  password: string;
  fullName?: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  visibility: string;
  authorId: number;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
  updatedAt: string;
  isPoll?: boolean;
  pollEndDate?: string;
  pollAllowMultiple?: boolean;
  pollOptions?: PollOption[];
}

export interface PostMedia {
  id: number;
  mediaType: string; // image, video, file
  mediaUrl: string;
  mediaName?: string;
  mediaSize?: number;
  mediaOrder: number;
}

export interface PollOption {
  id: number;
  optionText: string;
  optionOrder: number;
  voteCount?: number;
  percentage?: number;
  votedByMe?: boolean;
}

export interface PollResults {
  postId: number;
  totalVotes: number;
  allowMultiple: boolean;
  endDate: string | null;
  isEnded: boolean;
  hasVoted: boolean;
  options: PollOption[];
}

export interface PostFeedItem extends Post {
  likeCount: number;
  commentCount: number;
  shareCount: number;
  likedByMe: boolean;
  hasSharedByMe: boolean;
  comments: PostComment[];
  media: PostMedia[];
}

export interface PostShare {
  id: number;
  originalPostId: number;
  originalPostTitle: string;
  originalPostContent: string;
  originalPostVisibility: string;
  originalAuthorId: number;
  originalAuthorName: string;
  originalAuthorAvatar: string | null;
  sharedPostId: number | null; // ID of the new post created for this share
  shareContent: string;
  shareVisibility: string;
  sharedByUserId: number;
  sharedByUserName: string;
  sharedByUserAvatar: string | null;
  sharedToGroupId: number | null;
  sharedToGroupName: string | null;
  createdAt: string;
  isOriginalPostAvailable: boolean;
  originalPostPoll: boolean;
  originalPostPollEndDate: string | null;
  originalPostPollAllowMultiple: boolean;
  originalPostMedia: PostMedia[];
}

export interface PostComment {
  id: number;
  postId: number;
  authorId: number;
  authorName: string;
  authorAvatar: string | null;
  content: string;
  createdAt: string;
  parentCommentId: number | null;
  media: CommentMedia[];
  likeCount: number;
  likedByMe: boolean;
}

export interface CommentMedia {
  id: number;
  mediaType: string; // image, video, file
  mediaUrl: string;
  mediaName?: string;
  mediaOrder: number;
}

export interface Friendship {
  id: number;
  requesterId: number;
  addresseeId: number;
  requesterName: string;
  addresseeName: string;
  requesterAvatar: string | null;
  addresseeAvatar: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface FriendshipStatus {
  status: 'self' | 'none' | 'pending' | 'pending_incoming' | 'accepted';
  friendshipId: number | null;
}

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  receiverId: number | null;
  receiverName: string | null;
  receiverAvatar: string | null;
  groupId: number | null;
  groupName: string | null;
  groupAvatar: string | null;
  content: string;
  mediaUrl: string | null;
  isRead: boolean;
  isRecalled: boolean;
  mentionedUserIds: string | null;
  isAllMentioned: boolean;
  createdAt: string;
}

export interface BlockedUser {
  id: number;
  blockedId: number;
  blockedName: string;
  blockedAvatar: string | null;
  createdAt: string;
}

export interface NotificationItem {
  id: number;
  recipientId: number;
  actorId: number;
  actorName: string;
  actorAvatar: string | null;
  type: string;
  message: string;
  targetType: string | null;
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  bio?: string;
  faculty?: string;
  facultyId?: number | null;
  className?: string;
  academicYear?: string;
  academicTitle?: string;
  majorId?: number | null;
  avatar?: string;
  cover?: string;
}

export interface Major {
  id: number;
  code: string;
  name: string;
  campus: string;
  facultyId: number | null;
  facultyName: string | null;
}

export interface Faculty {
  id: number;
  code: string;
  name: string;
}

// Group types
export interface Group {
  id: number;
  name: string;
  description: string | null;
  avatar: string | null;
  cover: string | null;
  privacy: 'public' | 'private';
  creatorId: number;
  creatorName: string;
  creatorAvatar: string | null;
  approvalRequired: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: number;
  groupId: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  role: 'gold_key' | 'silver_key' | 'member';
  status: 'active' | 'pending' | 'blocked';
  joinedAt: string;
}

export interface GroupJoinRequest {
  id: number;
  groupId: number;
  groupName: string;
  userId: number;
  userName: string;
  userAvatar: string | null;
  status: 'pending' | 'approved' | 'rejected';
  message: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GroupPost extends Post {
  id: number;
  postId: number;
  groupId: number;
  groupName: string;
  isApproved: boolean;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  media: PostMedia[];
  comments: PostComment[];
}

export interface GroupNotification {
  id: number;
  groupId: number;
  groupName: string;
  userId: number;
  type: 'join_request' | 'post_approved' | 'post_rejected' | 'member_removed' | 'role_changed' | 'join_approved' | 'join_rejected' | 'member_banned' | 'class_announcement' | 'group_post_like' | 'group_post_comment' | 'group_comment_reply';
  message: string;
  targetType: string | null;
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}

export type ReportTargetType = 'post' | 'comment' | 'user' | 'group';
export type ReportStatus = 'pending' | 'resolved' | 'rejected';

export interface ReportItem {
  id: number;
  reporterId: number;
  reporterName: string;
  targetType: ReportTargetType;
  targetId: number;
  targetOwnerId: number | null;
  targetTitle: string | null;
  targetSnapshot: string | null;
  targetUrl: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  resolution: string | null;
  adminNote: string | null;
  handledById: number | null;
  handledByName: string | null;
  createdAt: string;
  handledAt: string | null;
}

export type AdminSection = 'overview' | 'reports' | 'users' | 'groups' | 'posts' | 'comments';
export interface AdminStats { users: number; groups: number; posts: number; comments: number; pendingReports: number; }
export interface AdminUserItem { id: number; fullName: string; email: string; role: UserRole; avatar: string | null; locked: boolean; createdAt: string; }
export interface AdminGroupItem { id: number; name: string; description: string | null; avatar: string | null; privacy: string; creatorName: string; memberCount: number; createdAt: string; }
export interface AdminPostItem { id: number; content: string; visibility: string; authorName: string; commentCount: number; groupId?: number; groupName?: string; createdAt: string; }
export interface AdminCommentItem { id: number; content: string; authorName: string; postId: number; groupId?: number; parentCommentId: number | null; createdAt: string; }
