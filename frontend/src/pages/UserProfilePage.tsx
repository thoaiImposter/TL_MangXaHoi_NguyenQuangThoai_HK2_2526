import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PostCard from '../components/PostCard';
import ProfileHeader from '../components/ProfileHeader';
import ReportButton from '../components/ReportButton';
import ShareCard from '../components/ShareCard';
import ProfilePage from './ProfilePage';
import { api } from '../lib/api';
import { uploadFileUrl } from '../lib/upload';
import { getRoleProfileDetails } from '../lib/userRole';
import type { Friendship, PostFeedItem, PostShare, User } from '../types';

type UserProfilePageProps = {
  currentUser: User;
  onUpdateUser: (user: User) => void;
  onOpenMiniChat?: (userId: number) => void;
};

type Draft = { content: string; media: string[] };

function UserProfilePage({ currentUser, onUpdateUser, onOpenMiniChat }: UserProfilePageProps) {
  const navigate = useNavigate();
  const { userId } = useParams();
  const targetId = Number(userId);
  const isMyProfile = targetId === currentUser.id;
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [friendStatus, setFriendStatus] = useState<string>('none');
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [feed, setFeed] = useState<PostFeedItem[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [error, setError] = useState('');

  const [commentDrafts, setCommentDrafts] = useState<Record<number, Draft>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, Draft>>({});
  const [replyTarget, setReplyTarget] = useState<Record<number, number | null>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [commentLikeState, setCommentLikeState] = useState<Record<number, { likeCount: number; likedByMe: boolean }>>({});
  const [profileTab, setProfileTab] = useState<'intro' | 'info' | 'friends'>('intro');
  const [contentTab, setContentTab] = useState<'posts' | 'shares'>('posts');
  const [feedPage, setFeedPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userShares, setUserShares] = useState<PostShare[]>([]);
  const [sharesPage, setSharesPage] = useState(0);
  const [hasMoreShares, setHasMoreShares] = useState(true);

  const loadProfile = async (page = 0, append = false) => {
    if (isMyProfile || !Number.isFinite(targetId)) return;
    if (page === 0) {
      setLoading(true);
      setFeedLoading(true);
      if (!append) {
        setFeed([]);
        setUserShares([]);
        setError('');
      }
    }
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
      setFriendshipId(status.friendshipId);
      setFriends(fList);
      setFeed((current) => (append ? [...current, ...posts] : posts));
      if (posts.length < 10) setHasMore(false);
      else setHasMore(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được hồ sơ');
    } finally {
      setLoading(false);
      setFeedLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadProfile(0, false);
  }, [targetId, isMyProfile, currentUser.id]);

  const loadUserShares = async (page = 0, append = false) => {
    if (isMyProfile || !Number.isFinite(targetId)) return;
    try {
      const shares = await api.getUserShares(targetId, currentUser.id, page, 10);
      setUserShares((current) => (append ? [...current, ...shares] : shares));
      setHasMoreShares(shares.length === 10);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được bài chia sẻ');
    }
  };

  useEffect(() => {
    setContentTab('posts');
    setProfileTab('intro');
    setSharesPage(0);
    loadUserShares(0, false);
  }, [targetId, isMyProfile, currentUser.id]);

  const refreshStatus = async () => {
    try {
      const status = await api.getFriendshipStatus(currentUser.id, targetId);
      setFriendStatus(status.status);
      setFriendshipId(status.friendshipId);
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
    setFriendActionLoading(true);
    try {
      const friendship = await api.sendFriendRequest(currentUser.id, targetId);
      setFriendStatus(friendship.status === 'accepted' ? 'accepted' : 'pending');
      setFriendshipId(friendship.id);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không gửi được lời mời');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const loadMoreShares = () => {
    if (!hasMoreShares) return;
    const next = sharesPage + 1;
    setSharesPage(next);
    loadUserShares(next, true);
  };

  const cancelRequest = async () => {
    setError('');
    if (!friendshipId) return;
    setFriendActionLoading(true);
    try {
      await api.rejectOrCancelFriendRequest(friendshipId, currentUser.id);
      setFriendStatus('none');
      setFriendshipId(null);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy được lời mời');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const acceptRequest = async () => {
    setError('');
    if (!friendshipId) return;
    setFriendActionLoading(true);
    try {
      await api.acceptFriendRequest(friendshipId, currentUser.id);
      setFriendStatus('accepted');
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không chấp nhận được lời mời');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const rejectRequest = async () => {
    setError('');
    if (!friendshipId) return;
    setFriendActionLoading(true);
    try {
      await api.rejectOrCancelFriendRequest(friendshipId, currentUser.id);
      setFriendStatus('none');
      setFriendshipId(null);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không từ chối được lời mời');
    } finally {
      setFriendActionLoading(false);
    }
  };

  const unfriend = async () => {
    setError('');
    if (!friendshipId) return;
    setFriendActionLoading(true);
    try {
      await api.unfriend(friendshipId, currentUser.id);
      setFriendStatus('none');
      setFriendshipId(null);
      await refreshStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy kết bạn được');
    } finally {
      setFriendActionLoading(false);
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
            <button className="primary-button" type="button" onClick={sendRequest} disabled={friendActionLoading}>
              {friendActionLoading ? 'Đang gửi...' : 'Kết bạn'}
            </button>
            {showProtection ? protectedNotice : msgButton}
          </div>
        );
      case 'pending':
        return (
          <div className="feed-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="chip" type="button" onClick={cancelRequest} disabled={friendActionLoading}>
              {friendActionLoading ? 'Đang xử lý...' : 'Hủy lời mời'}
            </button>
            {showProtection ? protectedNotice : msgButton}
          </div>
        );
      case 'pending_incoming':
        return (
          <div className="feed-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="primary-button" type="button" onClick={acceptRequest} disabled={friendActionLoading}>Chấp nhận</button>
            <button className="chip" type="button" onClick={rejectRequest} disabled={friendActionLoading}>Từ chối</button>
            {showProtection ? protectedNotice : msgButton}
          </div>
        );
      case 'accepted':
        return (
          <div className="feed-actions" style={{ flexWrap: 'wrap', gap: 8 }}>
            <button className="chip" type="button" onClick={unfriend} disabled={friendActionLoading}>
              {friendActionLoading ? 'Đang xử lý...' : 'Hủy kết bạn'}
            </button>
            {msgButton}
          </div>
        );
      default:
        return showProtection ? protectedNotice : msgButton;
    }
  };

  const fileToBase64 = (file: File) => uploadFileUrl(file, 'comments');

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
    const content = draft?.content.trim() ?? '';
    if (!content && !draft?.media.length) return;
    await api.addComment(postId, currentUser.id, { content, media: draft.media });
    setCommentDrafts((current) => ({ ...current, [postId]: { content: '', media: [] } }));
    await loadFeed();
  };

  const submitReply = async (postId: number, commentId: number) => {
    const draft = replyDrafts[commentId];
    const content = draft?.content.trim() ?? '';
    if (!content && !draft?.media.length) return;
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
    const picked = await fileToBase64(files[0]);
    setCommentDrafts((current) => ({
      ...current,
      [postId]: { content: current[postId]?.content ?? '', media: [picked] },
    }));
  };

  const onPickReplyMedia = async (commentId: number, files: FileList | null) => {
    if (!files?.length) return;
    const picked = await fileToBase64(files[0]);
    setReplyDrafts((current) => ({
      ...current,
      [commentId]: { content: current[commentId]?.content ?? '', media: [picked] },
    }));
  };

  if (isMyProfile) {
    return <ProfilePage user={currentUser} onUpdateUser={onUpdateUser} />;
  }

  const acceptedFriends = friends.filter((friend) => friend.status === 'accepted');

  if (loading && !profile) {
    return <main className="profile-shell"><div className="empty-state card">Đang tải hồ sơ...</div></main>;
  }

  if (!profile) {
    return (
      <main className="profile-shell">
        <div className="empty-state card">
          <h3 className="empty-state-title">Không tìm thấy hồ sơ</h3>
          <p className="empty-state-text">{error || 'Người dùng không tồn tại hoặc không thể truy cập.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-shell">
      <ProfileHeader
        profile={profile}
        stats={[
          { label: 'Bài viết', value: feed.length },
          { label: 'Chia sẻ', value: userShares.length },
          { label: 'Bạn bè', value: acceptedFriends.length },
        ]}
        actions={<>{renderFriendAction()}<ReportButton reporterId={currentUser.id} targetType="user" targetId={targetId} className="btn btn-secondary" /></>}
      />

      {error && <div className="form-error">{error}</div>}

      <div className="profile-tabs">
        <button className={`profile-tab ${profileTab === 'intro' ? 'active' : ''}`} type="button" onClick={() => setProfileTab('intro')}>Giới thiệu</button>
        <button className={`profile-tab ${profileTab === 'info' ? 'active' : ''}`} type="button" onClick={() => setProfileTab('info')}>Thông tin</button>
        <button className={`profile-tab ${profileTab === 'friends' ? 'active' : ''}`} type="button" onClick={() => setProfileTab('friends')}>Bạn bè</button>
      </div>

      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        {profileTab === 'intro' && (
          <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>Giới thiệu</h3>
            <div className="flex gap-lg items-center mb-lg">
              <div className="post-avatar" style={{ width: 80, height: 80 }}>
                {profile.avatar ? <img src={profile.avatar} alt={profile.fullName} /> : <div className="post-avatar-placeholder">{profile.fullName.charAt(0).toUpperCase()}</div>}
              </div>
              <div><h2>{profile.fullName}</h2><p className="text-muted">{profile.email}</p></div>
            </div>
            <p className="lead">{profile.bio || 'Chưa có giới thiệu.'}</p>
            <div className="flex flex-col gap-md" style={{ maxWidth: 500 }}>
              {getRoleProfileDetails(profile).map(([label, value]) => (
                <div key={label}><span className="text-muted">{label}: </span><strong>{value}</strong></div>
              ))}
            </div>
          </div>
        )}

        {profileTab === 'info' && (
          <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>Thông tin chi tiết</h3>
            <div className="flex flex-col gap-md" style={{ maxWidth: 600 }}>
              {[
                ['User ID', `#${profile.id}`],
                ['Email', profile.email],
                ['Họ và tên', profile.fullName],
                ['Bio', profile.bio || 'Chưa có'],
                ...getRoleProfileDetails(profile),
              ].map(([label, value]) => (
                <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--gray-100)' }} key={label}>
                  <span className="text-muted">{label}</span><strong>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === 'friends' && (
          <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 'var(--spacing-lg)' }}>Bạn bè ({acceptedFriends.length})</h3>
            {acceptedFriends.length === 0 ? (
              <div className="empty-state"><h3 className="empty-state-title">Chưa có bạn bè</h3></div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                {acceptedFriends.slice(0, 12).map((friend) => {
                  const isRequester = friend.requesterId === targetId;
                  const id = isRequester ? friend.addresseeId : friend.requesterId;
                  const name = isRequester ? friend.addresseeName : friend.requesterName;
                  const avatar = isRequester ? friend.addresseeAvatar : friend.requesterAvatar;
                  return (
                    <Link className="profile-friend-tile" to={`/users/${id}`} key={friend.id}>
                      <div className="post-avatar" style={{ width: 64, height: 64 }}>
                        {avatar ? <img src={avatar} alt={name} /> : <div className="post-avatar-placeholder">{name.charAt(0).toUpperCase()}</div>}
                      </div>
                      <strong>{name}</strong>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      <section style={{ marginTop: 'var(--spacing-xl)' }}>
        <div className="profile-tabs">
          <button className={`profile-tab ${contentTab === 'posts' ? 'active' : ''}`} type="button" onClick={() => setContentTab('posts')}>Bài đăng</button>
          <button className={`profile-tab ${contentTab === 'shares' ? 'active' : ''}`} type="button" onClick={() => setContentTab('shares')}>Chia sẻ</button>
        </div>

        {contentTab === 'posts' && (
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
                onBeginEdit={() => undefined}
                onRemove={() => undefined}
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
                onSharePost={() => loadFeed(0, false)}
              />
            ))}
            {!feedLoading && feed.length === 0 && <div className="empty-state card"><h3 className="empty-state-title">Chưa có bài đăng nào</h3></div>}
            {hasMore && <div style={{ textAlign: 'center', marginTop: 16 }}><button className="btn btn-secondary" type="button" onClick={loadMore} disabled={loadingMore}>{loadingMore ? 'Đang tải...' : 'Tải thêm'}</button></div>}
          </section>
        )}

        {contentTab === 'shares' && (
          <section className="feed">
            {userShares.map((share) => <ShareCard key={share.id} share={share} user={currentUser} />)}
            {!userShares.length && <div className="empty-state card"><h3 className="empty-state-title">Chưa có bài chia sẻ nào</h3></div>}
            {hasMoreShares && <div style={{ textAlign: 'center', marginTop: 16 }}><button className="btn btn-secondary" type="button" onClick={loadMoreShares}>Tải thêm chia sẻ</button></div>}
          </section>
        )}
      </section>

      {viewerImage && (
        <div className="image-viewer" onClick={() => setViewerImage(null)} role="presentation">
          <img src={viewerImage} alt="viewer" />
        </div>
      )}
    </main>
  );
}

export default UserProfilePage;
