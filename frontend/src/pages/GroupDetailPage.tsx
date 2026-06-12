import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import GroupPostCard from '../components/GroupPostCard';
import GroupChat from '../components/GroupChat';
import PollCreator from '../components/PollCreator';
import PostComposer from '../components/PostComposer';
import type { Group, GroupMember, GroupPost, GroupJoinRequest, PostComment, User } from '../types';

type Draft = { content: string; media: string[] };
type CommentLikeState = Record<number, { likeCount: number; likedByMe: boolean }>;

export default function GroupDetailPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  
  // Get userId from stored user object
  const getUser = () => {
    const stored = localStorage.getItem('social_user');
    return stored ? JSON.parse(stored) : null;
  };
  
  const user = getUser();
  const userId = user?.id || 0;

  const [group, setGroup] = useState<Group | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'chat' | 'members' | 'requests' | 'settings'>('posts');
  const [showPostModal, setShowPostModal] = useState(false);
  const [showEditSettings, setShowEditSettings] = useState(false);
  const [editSettings, setEditSettings] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private',
    approvalRequired: false,
  });
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [newAvatar, setNewAvatar] = useState<string | null>(null);
  const [newCover, setNewCover] = useState<string | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);

  // Advisor management states
  const [showAdvisorModal, setShowAdvisorModal] = useState(false);
  const [advisorTab, setAdvisorTab] = useState<'list' | 'invite'>('list');
  const [advisors, setAdvisors] = useState<User[]>([]);
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteResult, setInviteResult] = useState<{ link: string; qr: string } | null>(null);
  const [advisorLoading, setAdvisorLoading] = useState(false);

  // Student invite states (Step 4)
  const [showStudentInviteModal, setShowStudentInviteModal] = useState(false);
  const [studentInviteEmail, setStudentInviteEmail] = useState('');
  const [studentInviteResult, setStudentInviteResult] = useState<{ link: string; qr: string } | null>(null);
  const [studentInviteLoading, setStudentInviteLoading] = useState(false);
  const [studentExcelFile, setStudentExcelFile] = useState<File | null>(null);
  const [bulkInviteResult, setBulkInviteResult] = useState<{
    message: string; added: number; skipped: number; invited: number; errors: number; total: number;
    addedNames: string[]; invitedEmails: string[]; errorDetails: string[];
  } | null>(null);

  // Post interaction states
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, Draft>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, Draft>>({});
  const [replyTarget, setReplyTarget] = useState<Record<number, number | null>>({});
  const [commentLikeState, setCommentLikeState] = useState<CommentLikeState>({});
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // File to base64 converter
  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      const groupData = await api.getGroup(parseInt(groupId));
      setGroup(groupData);
      setEditSettings({
        name: groupData.name,
        description: groupData.description || '',
        privacy: groupData.privacy,
        approvalRequired: groupData.approvalRequired,
      });

      // Check if user is member
      try {
        const membersData = await api.getGroupMembers(parseInt(groupId));
        setMembers(membersData);
        const myMembership = membersData.find((m) => m.userId === userId);
        if (myMembership) {
          setIsMember(true);
          setMyRole(myMembership.role);
        }
      } catch {
        setIsMember(false);
      }

      // Load posts
      try {
        const postsData = await api.getGroupPosts(parseInt(groupId), userId);
        setPosts(postsData);
      } catch {
        setPosts([]);
      }

      // Load join requests if admin
      if (myRole === 'gold_key' || myRole === 'silver_key') {
        try {
          const requests = await api.getPendingJoinRequests(parseInt(groupId), userId);
          setJoinRequests(requests);
        } catch {
          setJoinRequests([]);
        }
      }
    } catch (error) {
      console.error('Failed to load group:', error);
    }
    setLoading(false);
  };

  const handleJoinGroup = async () => {
    if (!groupId) return;
    try {
      const result = await api.joinGroup(parseInt(groupId), userId);
      if ('message' in result) {
        alert(result.message);
      } else {
        alert('Đã tham gia nhóm thành công!');
        loadGroupData();
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Không thể tham gia nhóm.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!groupId) return;
    if (!confirm('Bạn có chắc muốn rời nhóm?')) return;
    try {
      await api.leaveGroup(parseInt(groupId), userId);
      alert('Đã rời nhóm.');
      navigate('/groups');
    } catch (error) {
      console.error('Failed to leave group:', error);
      alert('Không thể rời nhóm.');
    }
  };

  const handleCreatePostSuccess = async () => {
    setShowPostModal(false);
    await loadGroupData();
    alert('Đã đăng bài thành công!');
  };

  const handleApprovePost = async (postId: number) => {
    if (!groupId) return;
    try {
      await api.approveGroupPost(parseInt(groupId), postId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to approve post:', error);
    }
  };

  const handleRejectPost = async (postId: number) => {
    if (!groupId) return;
    if (!confirm('Bạn có chắc muốn từ chối bài viết this?')) return;
    try {
      await api.rejectGroupPost(parseInt(groupId), postId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to reject post:', error);
    }
  };

  const handleDeletePost = async (postId: number) => {
    if (!groupId) return;
    if (!confirm('Bạn có chắc muốn xóa bài viết this?')) return;
    try {
      await api.deleteGroupPost(parseInt(groupId), postId, userId);
      setPosts(posts.filter((p) => p.postId !== postId));
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleLikePost = async (postId: number) => {
    try {
      await api.toggleLikeGroupPost(parseInt(groupId!), postId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = async (postId: number) => {
    const draft = commentDrafts[postId];
    if (!draft?.content.trim()) return;
    try {
      await api.addCommentGroupPost(parseInt(groupId!), postId, userId, { content: draft.content, media: draft.media });
      setCommentDrafts(current => ({ ...current, [postId]: { content: '', media: [] } }));
      loadGroupData();
    } catch (error) {
      console.error('Failed to comment:', error);
    }
  };

  const handleReply = async (postId: number, commentId: number) => {
    const draft = replyDrafts[commentId];
    if (!draft?.content.trim()) return;
    try {
      await api.addCommentGroupPost(parseInt(groupId!), postId, userId, { content: draft.content, media: draft.media, parentCommentId: commentId });
      setReplyDrafts(current => ({ ...current, [commentId]: { content: '', media: [] } }));
      setReplyTarget(current => ({ ...current, [postId]: null }));
      loadGroupData();
    } catch (error) {
      console.error('Failed to reply:', error);
    }
  };

  const handleToggleCommentLike = async (commentId: number) => {
    try {
      const result = await api.toggleCommentLike(commentId, userId);
      setCommentLikeState(current => ({
        ...current,
        [commentId]: { likeCount: result.likeCount, likedByMe: result.likedByMe },
      }));
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
    }
  };

  const handlePickCommentMedia = async (postId: number, files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 10);
    const encoded = await Promise.all(picked.map((file) => fileToBase64(file)));
    setCommentDrafts(current => ({
      ...current,
      [postId]: { content: current[postId]?.content ?? '', media: [...(current[postId]?.media ?? []), ...encoded].slice(0, 10) },
    }));
  };

  const handlePickReplyMedia = async (commentId: number, files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 10);
    const encoded = await Promise.all(picked.map((file) => fileToBase64(file)));
    setReplyDrafts(current => ({
      ...current,
      [commentId]: { content: current[commentId]?.content ?? '', media: [...(current[commentId]?.media ?? []), ...encoded].slice(0, 10) },
    }));
  };

  const handleApproveMember = async (requestId: number, requestUserId: number) => {
    if (!groupId) return;
    try {
      await api.approveJoinRequest(parseInt(groupId), requestId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to approve member:', error);
    }
  };

  const handleRejectMember = async (requestId: number) => {
    if (!groupId) return;
    try {
      await api.rejectJoinRequest(parseInt(groupId), requestId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to reject member:', error);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!groupId) return;
    if (!confirm('Bạn có chắc muốn xóa thành viên này khỏi nhóm?')) return;
    try {
      await api.removeMember(parseInt(groupId), memberId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to remove member:', error);
    }
  };

  const handleGrantAdmin = async (targetUserId: number) => {
    if (!groupId) return;
    try {
      await api.grantAdminRole(parseInt(groupId), targetUserId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to grant admin:', error);
    }
  };

  const handleRevokeAdmin = async (targetUserId: number) => {
    if (!groupId) return;
    try {
      await api.revokeAdminRole(parseInt(groupId), targetUserId, userId);
      loadGroupData();
    } catch (error) {
      console.error('Failed to revoke admin:', error);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupId) return;
    try {
      await api.updateGroup(parseInt(groupId), userId, editSettings);
      loadGroupData();
      setShowEditSettings(false);
      alert('Đã cập nhật thiết đặt nhóm.');
    } catch (error) {
      console.error('Failed to update settings:', error);
      alert('Không thể cập nhật thiết đặt.');
    }
  };

  const handleDeleteGroup = async () => {
    if (!groupId) return;
    if (!confirm('Bạn có chắc muốn xóa nhóm? Hành động này không thể hoàn tác.')) return;
    try {
      await api.deleteGroup(parseInt(groupId), userId);
      navigate('/groups');
    } catch (error) {
      console.error('Failed to delete group:', error);
      alert('Không thể xóa nhóm.');
    }
  };

  const handleCreatePoll = async (pollData: { title: string; content: string; options: string[]; endDate?: string; allowMultiple: boolean }) => {
    if (!groupId) return;
    setLoading(true);
    try {
      await api.createGroupPoll(parseInt(groupId), userId, pollData);
      setShowPollCreator(false);
      alert('Đã tạo bình chọn thành công!');
      loadGroupData();
    } catch (err) {
      console.error('Failed to create poll:', err);
      alert('Không tạo được bình chọn: ' + (err instanceof Error ? err.message : 'Lỗi không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = myRole === 'gold_key' || myRole === 'silver_key';
  const isCreator = myRole === 'gold_key';

  // Advisor management functions
  const loadAdvisors = async () => {
    setAdvisorLoading(true);
    try {
      const data = await api.getAdvisorsByFaculty(user?.faculty || undefined);
      setAdvisors(data);
    } catch (err) {
      console.error('Failed to load advisors:', err);
    }
    setAdvisorLoading(false);
  };

  const handleAddAdvisor = async (advisorId: number) => {
    if (!groupId) return;
    try {
      await api.addAdvisorToGroup(parseInt(groupId), userId, advisorId);
      alert('Đã thêm cố vấn học tập vào nhóm!');
      loadGroupData();
      loadAdvisors();
    } catch (err: any) {
      alert(err?.message || 'Không thể thêm cố vấn');
    }
  };

  const handleInviteAdvisor = async () => {
    if (!groupId || !inviteEmail.trim()) return;
    setAdvisorLoading(true);
    setInviteResult(null);
    try {
      const result = await api.inviteAdvisorToGroup(parseInt(groupId), inviteEmail.trim());
      setInviteResult({ link: result.inviteLink, qr: result.qrImageUrl });
      setInviteEmail('');
      alert(result.message);
    } catch (err: any) {
      alert(err?.message || 'Không thể gửi lời mời');
    }
    setAdvisorLoading(false);
  };

  // Filter advisors by search
  const filteredAdvisors = advisors.filter(a =>
    a.fullName.toLowerCase().includes(advisorSearch.toLowerCase()) ||
    a.email.toLowerCase().includes(advisorSearch.toLowerCase())
  );

  // Get current member IDs to check who's already in group
  const memberIds = members.map(m => m.userId);

  // Student invite handler (Step 4)
  const handleInviteStudent = async () => {
    if (!groupId || !studentInviteEmail.trim()) return;
    setStudentInviteLoading(true);
    setStudentInviteResult(null);
    try {
      const result = await api.inviteStudentToGroup(parseInt(groupId), studentInviteEmail.trim());
      setStudentInviteResult({ link: result.inviteLink, qr: result.qrImageUrl });
      setStudentInviteEmail('');
      alert(result.message);
    } catch (err: any) {
      alert(err?.message || 'Không thể gửi lời mời');
    }
    setStudentInviteLoading(false);
  };

  // Bulk invite from Excel handler
  const handleBulkInviteStudents = async () => {
    if (!groupId || !studentExcelFile) return;
    setStudentInviteLoading(true);
    setBulkInviteResult(null);
    try {
      const result = await api.bulkInviteStudents(parseInt(groupId), userId, studentExcelFile);
      setBulkInviteResult(result);
      setStudentExcelFile(null);
      loadGroupData(); // Refresh members
    } catch (err: any) {
      alert(err?.message || 'Lỗi xử lý file Excel');
    }
    setStudentInviteLoading(false);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        Đang tải...
      </div>
    );
  }

  if (!group) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        Không tìm thấy nhóm.
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Group Header */}
      <div
        style={{
          background: group.cover || '#e4e6eb',
          height: '200px',
          borderRadius: '8px',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          marginBottom: '16px',
          position: 'relative',
        }}
      >
        {isAdmin && (
          <>
            <button
              onClick={() => setShowCoverUpload(true)}
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              📷 Đổi ảnh bìa
            </button>
            <button
              onClick={() => setShowAvatarUpload(true)}
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '110px',
                padding: '6px 12px',
                background: 'rgba(0,0,0,0.6)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                zIndex: 10,
              }}
            >
              📷 Đổi avatar
            </button>
          </>
        )}
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '20px',
            width: '80px',
            height: '80px',
            borderRadius: '8px',
            background: group.avatar || '#1876f2',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            border: '3px solid #fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            color: '#fff',
          }}
        >
          {!group.avatar && '👥'}
        </div>
      </div>

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { setShowAvatarUpload(false); setNewAvatar(null); }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '400px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px' }}>Đổi ảnh đại diện nhóm</h2>
            {newAvatar ? (
              <div style={{ marginBottom: '16px' }}>
                <img src={newAvatar} alt="preview" style={{ width: '100%', borderRadius: '8px' }} />
              </div>
            ) : (
              <div
                style={{
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  cursor: 'pointer',
                }}
                onClick={() => document.getElementById('avatar-input')?.click()}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>📷</div>
                <div style={{ color: '#65676b' }}>Nhấp để chọn ảnh</div>
              </div>
            )}
            <input
              id="avatar-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setNewAvatar(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowAvatarUpload(false); setNewAvatar(null); }}
                style={{ padding: '10px 20px' }}
              >
                Hủy
              </button>
              {newAvatar && (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!groupId) return;
                    try {
                      await api.updateGroup(parseInt(groupId), userId, { ...editSettings, avatar: newAvatar! });
                      loadGroupData();
                      setShowAvatarUpload(false);
                      setNewAvatar(null);
                      alert('Đã cập nhật ảnh đại diện!');
                    } catch (error) {
                      console.error('Failed to update avatar:', error);
                      alert('Không thể cập nhật ảnh đại diện.');
                    }
                  }}
                  style={{ padding: '10px 20px' }}
                >
                  Lưu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cover Upload Modal */}
      {showCoverUpload && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => { setShowCoverUpload(false); setNewCover(null); }}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px' }}>Đổi ảnh bìa nhóm</h2>
            {newCover ? (
              <div style={{ marginBottom: '16px' }}>
                <img src={newCover} alt="preview" style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px' }} />
              </div>
            ) : (
              <div
                style={{
                  border: '2px dashed #ddd',
                  borderRadius: '8px',
                  padding: '40px',
                  textAlign: 'center',
                  marginBottom: '16px',
                  cursor: 'pointer',
                  height: '150px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                }}
                onClick={() => document.getElementById('cover-input')?.click()}
              >
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🖼️</div>
                <div style={{ color: '#65676b' }}>Nhấp để chọn ảnh bìa</div>
              </div>
            )}
            <input
              id="cover-input"
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setNewCover(ev.target?.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowCoverUpload(false); setNewCover(null); }}
                style={{ padding: '10px 20px' }}
              >
                Hủy
              </button>
              {newCover && (
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (!groupId) return;
                    try {
                      await api.updateGroup(parseInt(groupId), userId, { ...editSettings, cover: newCover! });
                      loadGroupData();
                      setShowCoverUpload(false);
                      setNewCover(null);
                      alert('Đã cập nhật ảnh bìa!');
                    } catch (error) {
                      console.error('Failed to update cover:', error);
                      alert('Không thể cập nhật ảnh bìa.');
                    }
                  }}
                  style={{ padding: '10px 20px' }}
                >
                  Lưu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: '50px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px' }}>{group.name}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
              {group.privacy === 'private' && (
                <span style={{ fontSize: '12px', color: '#65676b' }}>🔒 Riêng tư</span>
              )}
              <span style={{ fontSize: '14px', color: '#65676b' }}>
                {group.memberCount} thành viên
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {isMember ? (
              <>
                <button
                  className="btn btn-secondary"
                  onClick={handleLeaveGroup}
                  style={{ padding: '8px 16px' }}
                >
                  Rời nhóm
                </button>
                {isAdmin && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowEditSettings(true)}
                    style={{ padding: '8px 16px' }}
                  >
                    Cài đặt
                  </button>
                )}
                {isCreator && user?.role === 'faculty_union' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      setShowAdvisorModal(true);
                      loadAdvisors();
                    }}
                    style={{ padding: '8px 16px' }}
                  >
                    👨‍🏫 Thêm cố vấn
                  </button>
                )}
                {myRole === 'silver_key' && (
                  <button
                    className="btn btn-primary"
                    onClick={() => { setShowStudentInviteModal(true); setStudentInviteResult(null); setBulkInviteResult(null); setStudentExcelFile(null); }}
                    style={{ padding: '8px 16px', background: '#16a34a' }}
                  >
                    🎓 Thêm sinh viên
                  </button>
                )}
              </>
            ) : (
              <button
                className="btn btn-primary"
                onClick={handleJoinGroup}
                style={{ padding: '8px 16px' }}
              >
                Tham gia
              </button>
            )}
          </div>
        </div>
        {group.description && (
          <p style={{ marginTop: '16px', color: '#65676b' }}>{group.description}</p>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #ddd', paddingBottom: '10px' }}>
        <button
          className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: activeTab === 'posts' ? '#1876f2' : '#e4e6eb',
            color: activeTab === 'posts' ? '#fff' : '#050505',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Bài viết
        </button>
        {isMember && (
          <button
            className={`tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setActiveTab('chat')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'chat' ? '#1876f2' : '#e4e6eb',
              color: activeTab === 'chat' ? '#fff' : '#050505',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            💬 Chat
          </button>
        )}
        <button
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
          style={{
            padding: '8px 16px',
            border: 'none',
            background: activeTab === 'members' ? '#1876f2' : '#e4e6eb',
            color: activeTab === 'members' ? '#fff' : '#050505',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          Thành viên
        </button>
        {isAdmin && joinRequests.length > 0 && (
          <button
            className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
            onClick={() => setActiveTab('requests')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'requests' ? '#1876f2' : '#e4e6eb',
              color: activeTab === 'requests' ? '#fff' : '#050505',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Yêu cầu ({joinRequests.length})
          </button>
        )}
        {isAdmin && (
          <button
            className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === 'settings' ? '#1876f2' : '#e4e6eb',
              color: activeTab === 'settings' ? '#fff' : '#050505',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
          >
            Quản lý
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'chat' && isMember && (
        <div>
          <GroupChat groupId={parseInt(groupId!)} user={user} members={members} />
        </div>
      )}

      {activeTab === 'posts' && (
        <div>
          {isMember && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowPostModal(true)}
                style={{ padding: '10px 20px' }}
              >
                + Đăng bài
              </button>
              {isAdmin && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowPollCreator(true)}
                  style={{ padding: '10px 20px' }}
                >
                  📊 Tạo bình chọn
                </button>
              )}
            </div>
          )}

          {posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#65676b' }}>
              Chưa có bài viết nào.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {posts.map((post) => (
                <GroupPostCard
                  key={post.id}
                  post={post}
                  user={user}
                  groupId={parseInt(groupId!)}
                  expandedPost={expandedPosts[post.postId] ?? false}
                  expandedComments={expandedComments[post.postId] ?? false}
                  commentDraft={commentDrafts[post.postId]}
                  replyDrafts={replyDrafts}
                  replyTarget={replyTarget}
                  commentLikeState={commentLikeState}
                  onToggleExpandedPost={(postId) => setExpandedPosts(current => ({ ...current, [postId]: !current[postId] }))}
                  onToggleExpandedComments={(postId) => setExpandedComments(current => ({ ...current, [postId]: !current[postId] }))}
                  onRemove={handleDeletePost}
                  onLikePost={handleLikePost}
                  onSubmitComment={handleComment}
                  onSubmitReply={handleReply}
                  onToggleCommentLike={handleToggleCommentLike}
                  onSetCommentDraft={setCommentDrafts}
                  onSetReplyDrafts={setReplyDrafts}
                  onSetReplyTarget={setReplyTarget}
                  onOpenViewer={setViewerImage}
                  onPickCommentMedia={handlePickCommentMedia}
                  onPickReplyMedia={handlePickReplyMedia}
                  onApprovePost={handleApprovePost}
                  onRejectPost={handleRejectPost}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'members' && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Thành viên ({members.length})</h3>
          {members.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#65676b' }}>
              Chưa có thành viên.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {members.map((member) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: member.userAvatar || '#e4e6eb',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{member.userName}</div>
                    <div style={{ fontSize: '12px', color: '#65676b' }}>
                      Tham gia {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {member.role === 'gold_key' && (
                      <span style={{ background: '#ffc107', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        👑 Tạo nhóm
                      </span>
                    )}
                    {member.role === 'silver_key' && (
                      <span style={{ background: '#6c757d', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>
                        🛡 Quản trị
                      </span>
                    )}
                    {isAdmin && member.userId !== userId && member.role !== 'gold_key' && (
                      <>
                        {member.role === 'member' ? (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleGrantAdmin(member.userId)}
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                          >
                            Cấp quyền
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleRevokeAdmin(member.userId)}
                            style={{ padding: '4px 12px', fontSize: '12px' }}
                          >
                            Gỡ quyền
                          </button>
                        )}
                        <button
                          className="btn btn-danger"
                          onClick={() => handleRemoveMember(member.userId)}
                          style={{ padding: '4px 12px', fontSize: '12px' }}
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && isAdmin && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Yêu cầu tham gia ({joinRequests.length})</h3>
          {joinRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#65676b' }}>
              Không có yêu cầu nào.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {joinRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                  }}
                >
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: request.userAvatar || '#e4e6eb',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '500' }}>{request.userName}</div>
                    {request.message && (
                      <div style={{ fontSize: '12px', color: '#65676b' }}>
                        "{request.message}"
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => handleApproveMember(request.id, request.userId)}
                      style={{ padding: '6px 16px' }}
                    >
                      Duyệt
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleRejectMember(request.id)}
                      style={{ padding: '6px 16px' }}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && isAdmin && (
        <div>
          <h3 style={{ marginBottom: '16px' }}>Quản lý nhóm</h3>

          {isCreator && (
            <div style={{ padding: '16px', border: '1px solid #dc3545', borderRadius: '8px', marginBottom: '16px' }}>
              <h4 style={{ color: '#dc3545', marginTop: 0 }}>Vùng nguy hiểm</h4>
              <p style={{ fontSize: '14px', color: '#65676b' }}>
                Xóa nhóm là hành động không thể hoàn tác. Tất cả bài viết và thành viên sẽ bị xóa.
              </p>
              <button
                className="btn btn-danger"
                onClick={handleDeleteGroup}
                style={{ padding: '8px 16px' }}
              >
                Xóa nhóm
              </button>
            </div>
          )}

          <div style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h4 style={{ marginTop: 0 }}>Thông tin nhóm</h4>
            <p style={{ fontSize: '14px', color: '#65676b' }}>
              Sử dụng nút "Cài đặt" ở trên để chỉnh sửa thông tin nhóm.
            </p>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showPostModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowPostModal(false)}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="side-row">
              <div>
                <span className="eyebrow">Tạo bài viết</span>
                <h1 className="section-title">Đăng bài trong nhóm {group?.name}</h1>
              </div>
              <button className="ghost-button" type="button" onClick={() => setShowPostModal(false)}>
                Đóng
              </button>
            </div>

            <PostComposer
              user={user}
              mode="group"
              groupId={parseInt(groupId || '0')}
              onSuccess={handleCreatePostSuccess}
              onClose={() => setShowPostModal(false)}
            />
          </div>
        </div>
      )}

      {/* Image Viewer */}
      {viewerImage && (
        <div className="image-viewer" onClick={() => setViewerImage(null)} role="presentation">
          <img src={viewerImage} alt="viewer" />
        </div>
      )}

      {/* Poll Creator Modal */}
      {showPollCreator && isAdmin && (
        <div className="modal-backdrop" onClick={() => setShowPollCreator(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <PollCreator
              onSubmit={handleCreatePoll}
              onCancel={() => setShowPollCreator(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Settings Modal */}
      {showEditSettings && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowEditSettings(false)}
        >
          <div
            style={{
              background: '#fff',
              padding: '24px',
              borderRadius: '8px',
              width: '100%',
              maxWidth: '500px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: '20px' }}>Cài đặt nhóm</h2>
            <form onSubmit={handleUpdateSettings}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Tên nhóm
                </label>
                <input
                  type="text"
                  value={editSettings.name}
                  onChange={(e) => setEditSettings({ ...editSettings, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Mô tả
                </label>
                <textarea
                  value={editSettings.description}
                  onChange={(e) => setEditSettings({ ...editSettings, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
                  Chế độ riêng tư
                </label>
                <select
                  value={editSettings.privacy}
                  onChange={(e) => setEditSettings({ ...editSettings, privacy: e.target.value as 'public' | 'private' })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '14px',
                  }}
                >
                  <option value="public">Công khai</option>
                  <option value="private">Riêng tư</option>
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editSettings.approvalRequired}
                    onChange={(e) => setEditSettings({ ...editSettings, approvalRequired: e.target.checked })}
                  />
                  <span>Yêu cầu phê duyệt thành viên</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditSettings(false)}
                  style={{ padding: '10px 20px' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Advisor Modal */}
      {showAdvisorModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => { setShowAdvisorModal(false); setInviteResult(null); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: '12px', width: '100%',
              maxWidth: '550px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e6eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>👨‍🏫 Thêm cố vấn học tập</h2>
              <button
                onClick={() => { setShowAdvisorModal(false); setInviteResult(null); }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#65676b' }}
              >×</button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #e4e6eb' }}>
              <button
                onClick={() => setAdvisorTab('list')}
                style={{
                  flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                  background: advisorTab === 'list' ? '#e7f3ff' : 'transparent',
                  color: advisorTab === 'list' ? '#1876f2' : '#65676b',
                  fontWeight: advisorTab === 'list' ? '600' : '400', fontSize: '14px',
                  borderBottom: advisorTab === 'list' ? '2px solid #1876f2' : '2px solid transparent',
                }}
              >
                Danh sách cố vấn
              </button>
              <button
                onClick={() => { setAdvisorTab('invite'); setInviteResult(null); }}
                style={{
                  flex: 1, padding: '12px', border: 'none', cursor: 'pointer',
                  background: advisorTab === 'invite' ? '#e7f3ff' : 'transparent',
                  color: advisorTab === 'invite' ? '#1876f2' : '#65676b',
                  fontWeight: advisorTab === 'invite' ? '600' : '400', fontSize: '14px',
                  borderBottom: advisorTab === 'invite' ? '2px solid #1876f2' : '2px solid transparent',
                }}
              >
                Mời qua email
              </button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {advisorTab === 'list' ? (
                <>
                  {/* Search */}
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Tìm theo tên hoặc email..."
                    value={advisorSearch}
                    onChange={(e) => setAdvisorSearch(e.target.value)}
                    style={{ marginBottom: '16px' }}
                  />

                  {advisorLoading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <span className="spinner" style={{ width: '24px', height: '24px', borderWidth: '2px' }}></span>
                      <p style={{ color: '#65676b', marginTop: '8px' }}>Đang tải...</p>
                    </div>
                  ) : filteredAdvisors.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#65676b' }}>
                      <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔍</div>
                      <p>Không tìm thấy cố vấn nào</p>
                      <p style={{ fontSize: '13px' }}>Chuyển sang tab "Mời qua email" để gửi lời mời</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {filteredAdvisors.map((advisor) => {
                        const alreadyInGroup = memberIds.includes(advisor.id);
                        return (
                          <div
                            key={advisor.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '12px', borderRadius: '8px',
                              background: alreadyInGroup ? '#f0fdf4' : '#f8f9fa',
                              border: '1px solid ' + (alreadyInGroup ? '#bbf7d0' : '#e4e6eb'),
                            }}
                          >
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '50%',
                              background: advisor.avatar ? `url(${advisor.avatar}) center/cover` : '#1876f2',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: '16px', flexShrink: 0,
                            }}>
                              {!advisor.avatar && '👨‍🏫'}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: '600', fontSize: '14px' }}>{advisor.fullName}</div>
                              <div style={{ fontSize: '12px', color: '#65676b' }}>
                                {advisor.academicTitle && <span>{advisor.academicTitle} • </span>}
                                {advisor.email}
                              </div>
                            </div>
                            {alreadyInGroup ? (
                              <span style={{ fontSize: '12px', color: '#22c55e', fontWeight: '600' }}>✓ Đã thêm</span>
                            ) : (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleAddAdvisor(advisor.id)}
                                style={{ padding: '6px 14px', fontSize: '13px' }}
                              >
                                Thêm
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ color: '#65676b', fontSize: '14px', margin: '0 0 12px' }}>
                      Không tìm thấy cố vấn trong danh sách? Nhập email để gửi lời mời tham gia nhóm.
                    </p>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="example@hcmuaf.edu.vn"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        style={{ flex: 1 }}
                        onKeyPress={(e) => e.key === 'Enter' && handleInviteAdvisor()}
                      />
                      <button
                        className="btn btn-primary"
                        onClick={handleInviteAdvisor}
                        disabled={advisorLoading || !inviteEmail.trim()}
                        style={{ padding: '8px 20px' }}
                      >
                        {advisorLoading ? '...' : 'Gửi mời'}
                      </button>
                    </div>
                  </div>

                  {inviteResult && (
                    <div style={{
                      background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)',
                      borderRadius: '12px', padding: '20px', textAlign: 'center',
                    }}>
                      <p style={{ fontWeight: '600', color: '#1e40af', margin: '0 0 12px' }}>✅ Lời mời đã gửi!</p>
                      <p style={{ fontSize: '13px', color: '#65676b', margin: '0 0 12px' }}>Link tham gia nhóm:</p>
                      <div style={{
                        background: '#fff', border: '1px solid #e4e6eb', borderRadius: '8px',
                        padding: '10px', marginBottom: '16px', wordBreak: 'break-all', fontSize: '13px',
                      }}>
                        <a href={inviteResult.link} target="_blank" rel="noreferrer" style={{ color: '#1876f2' }}>
                          {inviteResult.link}
                        </a>
                      </div>
                      <p style={{ fontSize: '13px', color: '#65676b', margin: '0 0 8px' }}>Hoặc quét mã QR:</p>
                      <img
                        src={inviteResult.qr}
                        alt="QR Code"
                        style={{ width: '160px', height: '160px', borderRadius: '8px', border: '1px solid #e4e6eb' }}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Invite Modal (Step 4) */}
      {showStudentInviteModal && (
        <div
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          }}
          onClick={() => { setShowStudentInviteModal(false); setStudentInviteResult(null); }}
        >
          <div
            style={{
              background: '#fff', borderRadius: '12px', width: '100%',
              maxWidth: '500px', maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e6eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '20px' }}>🎓 Mời sinh viên tham gia nhóm</h2>
              <button
                onClick={() => { setShowStudentInviteModal(false); setStudentInviteResult(null); }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#65676b' }}
              >×</button>
            </div>

            {/* Content */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
              {/* Excel Upload Section */}
              <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px', border: '1px solid #e4e6eb' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: '15px', color: '#166534' }}>📋 Upload danh sách Excel</h3>
                <p style={{ fontSize: '13px', color: '#65676b', margin: '0 0 12px' }}>
                  File Excel cần có cột <strong>"MSSV"</strong> chứa mã sinh viên (8 số).
                  Hệ thống tự động: thêm SV đã đăng ký vào nhóm, gửi email mời cho SV chưa đăng ký.
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <label style={{
                    padding: '8px 16px', background: '#16a34a', color: '#fff', borderRadius: '6px',
                    cursor: 'pointer', fontSize: '13px', fontWeight: '600',
                  }}>
                    Chọn file Excel
                    <input
                      type="file"
                      accept=".xlsx,.xls"
                      style={{ display: 'none' }}
                      onChange={(e) => { setStudentExcelFile(e.target.files?.[0] || null); setBulkInviteResult(null); }}
                    />
                  </label>
                  <span style={{ fontSize: '13px', color: '#65676b' }}>
                    {studentExcelFile ? studentExcelFile.name : 'Chưa chọn file'}
                  </span>
                  {studentExcelFile && (
                    <button
                      className="btn btn-primary"
                      onClick={handleBulkInviteStudents}
                      disabled={studentInviteLoading}
                      style={{ padding: '8px 16px', background: '#16a34a', marginLeft: 'auto' }}
                    >
                      {studentInviteLoading ? 'Đang xử lý...' : 'Xử lý'}
                    </button>
                  )}
                </div>
              </div>

              {/* Bulk Result */}
              {bulkInviteResult && (
                <div style={{ marginBottom: '16px', padding: '16px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <p style={{ fontWeight: '600', color: '#166534', margin: '0 0 8px' }}>{bulkInviteResult.message}</p>
                  <div style={{ fontSize: '13px', color: '#374151' }}>
                    <div>Tổng MSSV đọc được: <strong>{bulkInviteResult.total}</strong></div>
                    {bulkInviteResult.added > 0 && (
                      <div style={{ color: '#16a34a' }}>✅ Đã thêm vào nhóm: {bulkInviteResult.added}
                        <div style={{ fontSize: '12px', color: '#65676b', paddingLeft: '12px' }}>
                          {bulkInviteResult.addedNames.slice(0, 5).join(', ')}
                          {bulkInviteResult.addedNames.length > 5 && ` và ${bulkInviteResult.addedNames.length - 5} người khác`}
                        </div>
                      </div>
                    )}
                    {bulkInviteResult.skipped > 0 && (
                      <div style={{ color: '#65676b' }}>↩️ Đã trong nhóm: {bulkInviteResult.skipped}</div>
                    )}
                    {bulkInviteResult.invited > 0 && (
                      <div style={{ color: '#2563eb' }}>📧 Đã gửi email mời: {bulkInviteResult.invited}
                        <div style={{ fontSize: '12px', color: '#65676b', paddingLeft: '12px' }}>
                          {bulkInviteResult.invitedEmails.slice(0, 3).join(', ')}
                          {bulkInviteResult.invitedEmails.length > 3 && ` và ${bulkInviteResult.invitedEmails.length - 3} email khác`}
                        </div>
                      </div>
                    )}
                    {bulkInviteResult.errors > 0 && (
                      <div style={{ color: '#dc2626' }}>❌ Lỗi: {bulkInviteResult.errors}
                        <div style={{ fontSize: '12px', paddingLeft: '12px' }}>
                          {bulkInviteResult.errorDetails.slice(0, 3).map((e, i) => <div key={i}>{e}</div>)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <hr style={{ border: 'none', borderTop: '1px solid #e4e6eb', margin: '16px 0' }} />

              {/* Single Email Section */}
              <p style={{ color: '#65676b', fontSize: '14px', margin: '0 0 12px' }}>
                Hoặc gửi mời từng sinh viên qua email:
              </p>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                <input
                  type="email"
                  className="form-input"
                  placeholder="MSSV@st.hcmuaf.edu.vn"
                  value={studentInviteEmail}
                  onChange={(e) => setStudentInviteEmail(e.target.value)}
                  style={{ flex: 1 }}
                  onKeyPress={(e) => e.key === 'Enter' && handleInviteStudent()}
                />
                <button
                  className="btn btn-primary"
                  onClick={handleInviteStudent}
                  disabled={studentInviteLoading || !studentInviteEmail.trim()}
                  style={{ padding: '8px 20px', background: '#16a34a' }}
                >
                  {studentInviteLoading ? '...' : 'Gửi mời'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px' }}>
                Email phải có dạng: MSSV@st.hcmuaf.edu.vn (8 chữ số)
              </p>

              {studentInviteResult && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
                  borderRadius: '12px', padding: '20px', textAlign: 'center',
                }}>
                  <p style={{ fontWeight: '600', color: '#166534', margin: '0 0 12px' }}>✅ Lời mời đã gửi!</p>
                  <p style={{ fontSize: '13px', color: '#65676b', margin: '0 0 12px' }}>Link tham gia nhóm:</p>
                  <div style={{
                    background: '#fff', border: '1px solid #e4e6eb', borderRadius: '8px',
                    padding: '10px', marginBottom: '16px', wordBreak: 'break-all', fontSize: '13px',
                  }}>
                    <a href={studentInviteResult.link} target="_blank" rel="noreferrer" style={{ color: '#16a34a' }}>
                      {studentInviteResult.link}
                    </a>
                  </div>
                  <p style={{ fontSize: '13px', color: '#65676b', margin: '0 0 8px' }}>Hoặc quét mã QR:</p>
                  <img
                    src={studentInviteResult.qr}
                    alt="QR Code"
                    style={{ width: '160px', height: '160px', borderRadius: '8px', border: '1px solid #e4e6eb' }}
                  />
                  <p style={{ fontSize: '12px', color: '#94a3b8', margin: '12px 0 0' }}>
                    Sinh viên chưa có tài khoản? Họ chỉ cần đăng ký rồi quét lại QR.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}