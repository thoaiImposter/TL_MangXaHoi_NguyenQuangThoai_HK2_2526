import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import PostComposer from '../components/PostComposer';
import PostComposerBar from '../components/PostComposerBar';
import ProfilePage from './ProfilePage';
import { api } from '../lib/api';
import type { Friendship, PostFeedItem, User } from '../types';

type UserProfilePageProps = {
  currentUser: User;
  onOpenMiniChat?: (userId: number) => void;
};

type Draft = { content: string; media: string[] };

function UserProfilePage({ currentUser, onOpenMiniChat }: UserProfilePageProps) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const targetId = Number(userId);
  const isMyProfile = targetId === currentUser.id;
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [feed, setFeed] = useState<PostFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [error, setError] = useState('');

  const [composerOpen, setComposerOpen] = useState(false);
  const [editingData, setEditingData] = useState<{ id: number; content: string; media: { mediaUrl: string }[]; visibility?: string } | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, Draft>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, Draft>>({});
  const [replyTarget, setReplyTarget] = useState<Record<number, number | null>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [commentLikeState, setCommentLikeState] = useState<Record<number, { likeCount: number; likedByMe: boolean }>>({});
  const [profileTab, setProfileTab] = useState<'intro' | 'friends'>('intro');
  const [feedPage, setFeedPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadProfile = async (page = 0, append = false) => {
    if (isMyProfile || !Number.isFinite(targetId)) return;
    if (page === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const [p, status, fList, posts] = await Promise.all([
        api.getProfile(targetId),
        api.getFriendshipStatus(currentUser.id, targetId),
        api.getFriends(targetId),
        api.getUserPosts(targetId, currentUser.id, page, 10, true),
      ]);
      setProfile(p);
      setFriendStatus(status.status);
      setFriends(fList);
      setFeed((current) => (append ? [...current, ...posts] : posts));
      if (posts.length < 10) setHasMore(false);
      else setHasMore(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadProfile(0, false);
  }, [targetId, isMyProfile, currentUser.id]);

  const refreshStatus = async () => {
    try {
      const status = await api.getFriendshipStatus(currentUser.id, targetId);
      setFriendStatus(status.status);
      const fList = await api.getFriends(targetId);
      setFriends(fList);
      const posts = await api.getUserPosts(targetId, currentUser.id, 0, 10, true);
      setFeed(posts);
      setFeedPage(0);
      setHasMore(posts.length === 10);
      const p = await api.getProfile(targetId);
      setProfile(p);
    } catch {
      // ignore
    }
  };

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = feedPage + 1;
    setFeedPage(next);
    loadProfile(next, true);
  };

  const sendRequest = async () => {
    setError('');
    try {
      await api.sendFriendRequest(currentUser.id, targetId);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được lời mời');
    }
  };

  const cancelRequest = async () => {
    setError('');
    try {
      // Find the friendship ID from the friends list
      const friendship = friends.find(f => f.status === 'pending' && 
        ((f.requesterId === currentUser.id && f.addresseeId === targetId) ||
         (f.requesterId === targetId && f.addresseeId === currentUser.id)));
      if (friendship) {
        await api.rejectOrCancelFriendRequest(friendship.id, currentUser.id);
      }
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy được lời mời');
    }
  };

  const acceptRequest = async () => {
    setError('');
    try {
      // Find the friendship ID from the friends list
      const friendship = friends.find(f => f.status === 'pending' && 
        ((f.requesterId === currentUser.id && f.addresseeId === targetId) ||
         (f.requesterId === targetId && f.addresseeId === currentUser.id)));
      if (friendship) {
        await api.acceptFriendRequest(friendship.id, currentUser.id);
      }
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không chấp nhận được lời mời');
    }
  };

  const rejectRequest = async () => {
    setError('');
    try {
      // Find the friendship ID from the friends list
      const friendship = friends.find(f => f.status === 'pending' && 
        ((f.requesterId === currentUser.id && f.addresseeId === targetId) ||
         (f.requesterId === targetId && f.addresseeId === currentUser.id)));
      if (friendship) {
        await api.rejectOrCancelFriendRequest(friendship.id, currentUser.id);
      }
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không từ chối được lời mời');
    }
  };

  const unfriend = async () => {
    setError('');
    try {
      // Find the friendship ID from the friends list
      const friendship = friends.find(f => f.status === 'accepted' && 
        ((f.requesterId === currentUser.id && f.addresseeId === targetId) ||
         (f.requesterId === targetId && f.addresseeId === currentUser.id)));
      if (friendship) {
        await api.unfriend(friendship.id, currentUser.id);
      }
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy kết bạn được');
    }
  };

  const renderFriendAction = () => {
    const handleMessage = () => {
      if (onOpenMiniChat) {
        onOpenMiniChat(targetId);
      } else {
        navigate(`/chat/${targetId}`);
      }
    };
    const msgButton = (
      <button className="primary-button" type="button" onClick={handleMessage}>
        Nhắn tin
      </button>
    );
    const protectedNotice = (
      <span className="subtle" style={{ fontSize: 12, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        NgườI dùng đã bật bảo vệ tài khoản
      </span>
    );
    const showProtection = profile?.accountProtection && friendStatus !== 'accepted';
    switch (friendStatus) {
      case 'none':
        return (
          <div className="feed-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="primary-button" type="button" onClick={sendRequest}>Kết bạn</button>
            {showProtection ? protectedNotice : msgButton}
          </div>
        );
      case 'pending':
        return (
          <div className="feed-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="chip" type="button" onClick={cancelRequest}>Hủy lờI mờI</button>
            {showProtection ? protectedNotice : msgButton}
          </div>
        );
      case 'pending_incoming':
        return (
          <div className="feed-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="primary-button" type="button" onClick={acceptRequest}>Chấp nhận</button>
            <button className="chip" type="button" onClick={rejectRequest}>Từ chốI</button>
            {showProtection ? protectedNotice : msgButton}
          </div>
        );
      case 'accepted':
        return (
          <div className="feed-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="chip" type="button" onClick={unfriend}>Hủy kết bạn</button>
            {msgButton}
          </div>
        );
      default:
        return showProtection ? protectedNotice : msgButton;
    }
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const loadFeed = async (page = 0, append = false) => {
    if (page === 0) setFeedLoading(true);
    else setLoadingMore(true);
    try {
      const posts = await api.getUserPosts(targetId, currentUser.id, page, 10, true);
      setFeed((current) => (append ? [...current, ...posts] : posts));
      if (posts.length < 10) setHasMore(false);
      else setHasMore(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được bài viết');
    } finally {
      setFeedLoading(false);
      setLoadingMore(false);
    }
  };

  const resetComposer = () => {
    setComposerOpen(false);
    setEditingData(null);
  };

  const handleComposerSuccess = async (msg?: string) => {
    if (msg) setMessage(msg);
    resetComposer();
    setFeedPage(0);
    await loadFeed(0, false);
  };

  const beginEdit = (postId: number) => {
    const post = feed.find((item) => item.id === postId);
    if (!post) return;
    setEditingData({
      id: post.id,
      content: post.content,
      media: post.media.map((item) => ({ mediaUrl: item.mediaUrl })),
      visibility: post.visibility,
    });
    setComposerOpen(true);
  };

  const removePost = async (postId: number) => {
    setError('');
    try {
      await api.deletePost(postId, currentUser.id);
      setFeedPage(0);
      await loadFeed(0, false);
      setMessage('Đã xoá bài viết.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xoá được bài viết');
    }
  };

  const likePost = async (postId: number) => {
    try {
      await api.toggleLike(postId, currentUser.id);
      await loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thích được bài viết');
    }
  };

  const submitComment = async (postId: number) => {
    const draft = commentDrafts[postId];
    const content = draft?.content.trim();
    if (!content) return;
    await api.addComment(postId, currentUser.id, { content, media: draft.media });
    setCommentDrafts((current) => ({ ...current, [postId]: { content: '', media: [] } }));
    await loadFeed();
  };

  const submitReply = async (postId: number, commentId: number) => {
    const draft = replyDrafts[commentId];
    const content = draft?.content.trim();
    if (!content) return;
    await api.replyComment(postId, commentId, currentUser.id, { content, media: draft.media });
    setReplyDrafts((current) => ({ ...current, [commentId]: { content: '', media: [] } }));
    setReplyTarget((current) => ({ ...current, [postId]: null }));
    await loadFeed();
  };

  const toggleCommentLike = async (commentId: number) => {
    const result = await api.toggleCommentLike(commentId, currentUser.id);
    setCommentLikeState((current) => ({
      ...current,
      [commentId]: { likeCount: result.likeCount, likedByMe: result.likedByMe },
    }));
  };

  const updateComment = async (commentId: number, content: string) => {
    try {
      await api.updateComment(commentId, currentUser.id, content);
      setFeedPage(0);
      await loadFeed(0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được bình luận');
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      await api.deleteComment(commentId, currentUser.id);
      setFeedPage(0);
      await loadFeed(0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được bình luận');
    }
  };

  const onPickCommentMedia = async (postId: number, files: FileList | null) => {
    if (!files?.length) return;
    const picked = await Promise.all(Array.from(files).slice(0, 10).map((file) => fileToBase64(file)));
    setCommentDrafts((current) => ({
      ...current,
      [postId]: { content: current[postId]?.content ?? '', media: [...(current[postId]?.media ?? []), ...picked].slice(0, 10) },
    }));
  };

  const onPickReplyMedia = async (commentId: number, files: FileList | null) => {
    if (!files?.length) return;
    const picked = await Promise.all(Array.from(files).slice(0, 10).map((file) => fileToBase64(file)));
    setReplyDrafts((current) => ({
      ...current,
      [commentId]: { content: current[commentId]?.content ?? '', media: [...(current[commentId]?.media ?? []), ...picked].slice(0, 10) },
    }));
  };

  if (isMyProfile) {
    return <ProfilePage user={currentUser} />;
  }

  return (
    <div className="profile-shell">
      <aside className="stack">
        <section className="panel profile-tabs-panel">
          <div className="profile-tabs">
            <button className={profileTab === 'intro' ? 'profile-tab active' : 'profile-tab'} type="button" onClick={() => setProfileTab('intro')}>Giới thiệu</button>
            <button className={profileTab === 'friends' ? 'profile-tab active' : 'profile-tab'} type="button" onClick={() => setProfileTab('friends')}>Bạn bè</button>
          </div>

          {profileTab === 'intro' && (
            <div className="profile-tab-content">
              <div className="profile-intro-head">
                <div className="avatar-preview">{profile?.avatar ? <img src={profile.avatar} alt={profile.fullName} /> : (profile?.fullName ?? 'U').charAt(0).toUpperCase()}</div>
                <div>
                  <h2 style={{ margin: 0 }}>{profile?.fullName ?? 'Đang tải...'}</h2>
                  <p className="subtle" style={{ margin: '4px 0 0' }}>{profile?.email}</p>
                </div>
              </div>
              <p className="lead">{profile?.bio || 'Chưa có bio.'}</p>
              <div className="intro-details">
                {profile?.faculty && <div className="intro-detail-row"><span className="subtle">Khoa:</span> {profile.faculty}</div>}
                {profile?.className && <div className="intro-detail-row"><span className="subtle">Lớp:</span> {profile.className}</div>}
                {profile?.academicYear && <div className="intro-detail-row"><span className="subtle">Niên khóa:</span> {profile.academicYear}</div>}
              </div>
              {renderFriendAction()}
              {error && <div className="form-error" style={{ marginTop: 8 }}>{error}</div>}
            </div>
          )}

          {profileTab === 'friends' && (
            <div className="profile-tab-content">
              <div className="friends-panel-header">
                <span className="eyebrow">Bạn bè ({friends.length})</span>
                {friends.length > 0 && (
                  <button className="ghost-button" type="button" onClick={() => navigate(`/friends`)}>Xem tất cả</button>
                )}
              </div>
              <div className="profile-friends-grid">
                {friends.length === 0 && <div className="subtle">Chưa có bạn bè nào.</div>}
                {friends.slice(0, 6).map((f) => {
                  const isRequester = f.requesterId === targetId;
                  const fid = isRequester ? f.addresseeId : f.requesterId;
                  const fname = isRequester ? f.addresseeName : f.requesterName;
                  const favatar = isRequester ? f.addresseeAvatar : f.requesterAvatar;
                  return (
                    <Link key={f.id} to={`/users/${fid}`} className="profile-friend-tile" title={fname}>
                      <div className="profile-friend-avatar">
                        {favatar ? <img src={favatar} alt={fname} /> : fname.charAt(0).toUpperCase()}
                      </div>
                      <span className="profile-friend-name">{fname}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </aside>

      <section className="stack">
        <PostComposerBar
          user={currentUser}
          title="Bạn muốn chia sẻ điều gì?"
          subtitle="Thanh đăng bài nằm ngay phía trên để đăng nhanh mà không làm rối trang cá nhân."
          buttonLabel="Tạo bài viết"
          onOpen={() => setComposerOpen(true)}
        />

        <section className="feed">
          {feed.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              user={currentUser}
              expandedPost={expandedPosts[post.id] ?? false}
              expandedComments={expandedComments[post.id] ?? false}
              commentDraft={commentDrafts[post.id]}
              replyDrafts={replyDrafts}
              replyTarget={replyTarget}
              commentLikeState={commentLikeState}
              onToggleExpandedPost={(postId) => setExpandedPosts((current) => ({ ...current, [postId]: !current[postId] }))}
              onToggleExpandedComments={(postId) => setExpandedComments((current) => ({ ...current, [postId]: !current[postId] }))}
              onBeginEdit={() => beginEdit(post.id)}
              onRemove={removePost}
              onLikePost={likePost}
              onSubmitComment={submitComment}
              onSubmitReply={submitReply}
              onToggleCommentLike={toggleCommentLike}
              onSetCommentDraft={setCommentDrafts}
              onSetReplyDrafts={setReplyDrafts}
              onSetReplyTarget={setReplyTarget}
              onOpenViewer={setViewerImage}
              onPickCommentMedia={onPickCommentMedia}
              onPickReplyMedia={onPickReplyMedia}
              onUpdateComment={updateComment}
              onDeleteComment={deleteComment}
            />
          ))}
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="primary-button" type="button" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Đang tải...' : 'Tải thêm'}
              </button>
            </div>
          )}
          {!feedLoading && !feed.length && <div className="subtle">Chưa có bài viết nào.</div>}
        </section>
      </section>

      <aside className="sidebar">
        <section className="panel sticky">
          <span className="eyebrow">Xu hướng</span>
          <div className="trend-item">
            <div>
              <strong>#design</strong>
              <div className="subtle">Clean social UI</div>
            </div>
            <span className="subtle">12.4K</span>
          </div>
          <div className="trend-item">
            <div>
              <strong>#profile</strong>
              <div className="subtle">User settings</div>
            </div>
            <span className="subtle">8.1K</span>
          </div>
          <div className="trend-item">
            <div>
              <strong>#frontend</strong>
              <div className="subtle">React + TSX</div>
            </div>
            <span className="subtle">19.8K</span>
          </div>
        </section>

        <section className="panel">
          <span className="eyebrow">Bài viết nổi bật</span>
          <div className="stack">
            {feed.slice(0, 5).map((post) => (
              <div className="suggest-item" key={post.id}>
                <div>
                  <strong>{new Date(post.createdAt).toLocaleDateString()}</strong>
                  <div className="subtle">
                    {post.likeCount} likes · {post.commentCount} comments
                  </div>
                </div>
              </div>
            ))}
            {!feed.length && <div className="subtle">Chưa có bài viết nào.</div>}
          </div>
        </section>
      </aside>

      {viewerImage && (
        <div className="image-viewer" onClick={() => setViewerImage(null)} role="presentation">
          <img src={viewerImage} alt="viewer" />
        </div>
      )}

      {composerOpen && (
        <div className="modal-backdrop" role="presentation" onClick={() => !loading && resetComposer()}>
          <div className="post-modal" onClick={(e) => e.stopPropagation()}>
            <div className="side-row">
              <div>
                <span className="eyebrow">{editingData ? 'Chỉnh sửa bài viết' : 'Tạo bài viết'}</span>
                <h1 className="section-title">Bạn đang nghĩ gì?</h1>
              </div>
              <button className="ghost-button" type="button" onClick={() => resetComposer()}>
                Đóng
              </button>
            </div>

            <PostComposer
              key={editingData?.id || 'new'}
              user={currentUser}
              mode="regular"
              showVisibility={!editingData}
              editingData={editingData}
              onSuccess={() => handleComposerSuccess(editingData ? 'Đã cập nhật bài viết.' : 'Đã đăng bài viết.')}
              onClose={() => resetComposer()}
            />

            {message && <div className="form-success">{message}</div>}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfilePage;
