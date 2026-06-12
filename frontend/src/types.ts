export type UserRole = 'student' | 'advisor' | 'faculty_union' | 'school_union';

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
  accountProtection: boolean;
  createdAt: string;
  updatedAt: string;
}

// SessionUser is the same as User, used for localStorage session
export type SessionUser = User;

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
  className?: string;
  academicYear?: string;
  avatar?: string;
  cover?: string;
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
  type: 'join_request' | 'post_approved' | 'post_rejected' | 'member_removed' | 'role_changed' | 'join_approved' | 'join_rejected' | 'member_banned';
  message: string;
  targetType: string | null;
  targetId: number | null;
  isRead: boolean;
  createdAt: string;
}