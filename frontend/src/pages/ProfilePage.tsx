import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PostCard from '../components/PostCard';
import PostComposerBar from '../components/PostComposerBar';
import PostComposerModal from '../components/PostComposerModal';
import PollCreator, { type PollDraft } from '../components/PollCreator';
import ProfileHeader from '../components/ProfileHeader';
import ShareCard from '../components/ShareCard';
import { api } from '../lib/api';
import { uploadFileUrl } from '../lib/upload';
import { getRoleProfileDetails } from '../lib/userRole';
import type { Friendship, PostFeedItem, PostShare, User } from '../types';

type ProfilePageProps = {
  user: User;
  onUpdateUser: (user: User) => void;
};

type Draft = { content: string; media: string[] };

function ProfilePage({ user, onUpdateUser }: ProfilePageProps) {
  const navigate = useNavigate();
  const [personalPosts, setPersonalPosts] = useState<PostFeedItem[]>([]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [editingData, setEditingData] = useState<{ id: number; content: string; media: { mediaUrl: string }[]; visibility?: string } | null>(null);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, Draft>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, Draft>>({});
  const [replyTarget, setReplyTarget] = useState<Record<number, number | null>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [commentLikeState, setCommentLikeState] = useState<Record<number, { likeCount: number; likedByMe: boolean }>>({});
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [profileTab, setProfileTab] = useState<'intro' | 'info' | 'friends'>('intro');
  const [contentTab, setContentTab] = useState<'posts' | 'shares'>('posts');
  const [feedPage, setFeedPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [userShares, setUserShares] = useState<PostShare[]>([]);
  const [sharesPage, setSharesPage] = useState(0);
  const [hasMoreShares, setHasMoreShares] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const loadFeed = async (page = 0, append = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const [data, fList] = await Promise.all([api.getUserPosts(user.id, user.id, page, 10, true), api.getFriends(user.id)]);
      setPersonalPosts((current) => (append ? [...current, ...data] : data));
      setFriends(fList);
      if (data.length < 10) setHasMore(false);
      else setHasMore(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được bài viết');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(0, false).catch((err) => setError(err instanceof Error ? err.message : 'Không tải được bài viết'));
  }, [user.id]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = feedPage + 1;
    setFeedPage(next);
    loadFeed(next, true);
  };

  const loadUserShares = async (page = 0, append = false) => {
    try {
      const shares = await api.getUserShares(user.id, user.id, page, 10);
      setUserShares((current) => (append ? [...current, ...shares] : shares));
      if (shares.length < 10) setHasMoreShares(false);
      else setHasMoreShares(true);
    } catch (err) {
      console.error('Failed to load shares:', err);
    }
  };

  useEffect(() => {
    loadUserShares(0, false);
  }, [user.id]);

  const loadMoreShares = () => {
    if (!hasMoreShares) return;
    const next = sharesPage + 1;
    setSharesPage(next);
    loadUserShares(next, true);
  };

  const deleteShare = async (shareId: number) => {
    try {
      await api.deleteShare(shareId, user.id);
      setUserShares((current) => current.filter((s) => s.id !== shareId));
      setMessage('Đã xóa chia sẻ.');
      await loadFeed(0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được chia sẻ');
    }
  };

  const fileToBase64 = (file: File) => uploadFileUrl(file, 'comments');

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

  const handleCreatePoll = async (pollData: PollDraft) => {
    setLoading(true);
    try {
      await api.createPoll(user.id, pollData);
      setShowPollCreator(false);
      setMessage('Đã đăng cuộc bình chọn.');
      setFeedPage(0);
      await loadFeed(0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được cuộc bình chọn');
    } finally {
      setLoading(false);
    }
  };

  const beginEdit = (postId: number) => {
    const post = personalPosts.find((item) => item.id === postId);
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
      await api.deletePost(postId, user.id);
      setFeedPage(0);
      await loadFeed(0, false);
      setMessage('Đã xoá bài viết.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xoá được bài viết');
    }
  };

  const likePost = async (postId: number) => {
    try {
      await api.toggleLike(postId, user.id);
      await loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thích được bài viết');
    }
  };

  const submitComment = async (postId: number) => {
    const draft = commentDrafts[postId];
    const content = draft?.content.trim() ?? '';
    if (!content && !draft?.media.length) return;
    await api.addComment(postId, user.id, { content, media: draft.media });
    setCommentDrafts((current) => ({ ...current, [postId]: { content: '', media: [] } }));
    await loadFeed();
  };

  const submitReply = async (postId: number, commentId: number) => {
    const draft = replyDrafts[commentId];
    const content = draft?.content.trim() ?? '';
    if (!content && !draft?.media.length) return;
    await api.replyComment(postId, commentId, user.id, { content, media: draft.media });
    setReplyDrafts((current) => ({ ...current, [commentId]: { content: '', media: [] } }));
    setReplyTarget((current) => ({ ...current, [postId]: null }));
    await loadFeed();
  };

  const toggleCommentLike = async (commentId: number) => {
    const result = await api.toggleCommentLike(commentId, user.id);
    setCommentLikeState((current) => ({
      ...current,
      [commentId]: { likeCount: result.likeCount, likedByMe: result.likedByMe },
    }));
  };

  const updateComment = async (commentId: number, content: string) => {
    try {
      await api.updateComment(commentId, user.id, content);
      setFeedPage(0);
      await loadFeed(0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được bình luận');
    }
  };

  const deleteComment = async (commentId: number) => {
    try {
      await api.deleteComment(commentId, user.id);
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

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    setUploadingCover(true);
    try {
      const coverUrl = await uploadFileUrl(file, 'covers');
      const updated = await api.updateProfile(user.id, { cover: coverUrl });
      onUpdateUser(updated);
      setMessage('Đã cập nhật ảnh bìa.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được ảnh bìa');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadFileUrl(file, 'avatars');
      const updated = await api.updateProfile(user.id, { avatar: avatarUrl });
      onUpdateUser(updated);
      setMessage('Đã cập nhật ảnh đại diện.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  return (
    <div className="profile-shell">
      <ProfileHeader
        profile={user}
        stats={[
          { label: 'Bài viết', value: personalPosts.length },
          { label: 'Chia sẻ', value: userShares.length },
          { label: 'Bạn bè', value: friends.length },
        ]}
        coverAction={(
          <label className={`btn btn-secondary shared-profile-cover-button ${uploadingCover ? 'disabled' : ''}`}>
            {uploadingCover ? 'Đang tải...' : 'Đổi ảnh bìa'}
            <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
          </label>
        )}
        avatarAction={(
          <label className={`shared-profile-avatar-button ${uploadingAvatar ? 'disabled' : ''}`} title="Đổi ảnh đại diện">
            <span aria-hidden="true">📷</span>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
          </label>
        )}
        actions={(
          <>
          <Link to="/settings" className="btn btn-secondary">
            Chỉnh sửa thông tin
          </Link>
          <button className="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            Chia sẻ
          </button>
          </>
        )}
      />

      {/* Profile Tabs - Row 1: Giới thiệu, Thông tin, Bạn bè */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${profileTab === 'intro' ? 'active' : ''}`}
          onClick={() => setProfileTab('intro')}
        >
          Giới thiệu
        </button>
        <button
          className={`profile-tab ${profileTab === 'info' ? 'active' : ''}`}
          onClick={() => setProfileTab('info')}
        >
          Thông tin
        </button>
        <button
          className={`profile-tab ${profileTab === 'friends' ? 'active' : ''}`}
          onClick={() => setProfileTab('friends')}
        >
          Bạn bè
        </button>
      </div>

      {/* Profile Tab Content */}
      <div style={{ marginTop: 'var(--spacing-lg)' }}>
        {profileTab === 'intro' && (
          <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: 'var(--spacing-lg)', color: 'var(--gray-900)' }}>
              Giới thiệu
            </h3>
            <div className="flex gap-lg items-center mb-lg">
              <div className="post-avatar" style={{ width: '80px', height: '80px' }}>
                {user.avatar ? (
                  <img src={user.avatar} alt={user.fullName} />
                ) : (
                  <div className="post-avatar-placeholder" style={{ fontSize: '28px' }}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)' }}>{user.fullName}</h2>
                <p className="text-muted">{user.email}</p>
              </div>
            </div>
            <div className="flex flex-col gap-md" style={{ maxWidth: '500px' }}>
              {getRoleProfileDetails(user).map(([label, value]) => (
                <div className="flex items-center gap-md" key={label}>
                  <div>
                    <p className="text-muted text-sm">{label}</p>
                    <p style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === 'info' && (
          <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: 'var(--spacing-lg)', color: 'var(--gray-900)' }}>
              Thông tin chi tiết
            </h3>
            <div className="flex flex-col gap-md" style={{ maxWidth: '600px' }}>
              <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span className="text-muted">User ID</span>
                <strong style={{ color: 'var(--gray-900)' }}>#{user.id}</strong>
              </div>
              <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span className="text-muted">Email</span>
                <strong style={{ color: 'var(--gray-900)' }}>{user.email}</strong>
              </div>
              <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span className="text-muted">Họ và tên</span>
                <strong style={{ color: 'var(--gray-900)' }}>{user.fullName}</strong>
              </div>
              <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span className="text-muted">Bio</span>
                <strong style={{ color: 'var(--gray-900)' }}>{user.bio || 'Chưa có'}</strong>
              </div>
              {getRoleProfileDetails(user).map(([label, value]) => (
                <div className="flex justify-between items-center" style={{ padding: 'var(--spacing-md) 0', borderBottom: '1px solid var(--gray-100)' }} key={label}>
                  <span className="text-muted">{label}</span>
                  <strong style={{ color: 'var(--gray-900)' }}>{value}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {profileTab === 'friends' && (
          <div className="card" style={{ padding: 'var(--spacing-xl)' }}>
            <div className="flex justify-between items-center mb-lg">
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)' }}>
                Bạn bè ({friends.length})
              </h3>
              {friends.length > 0 && (
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/friends')}>
                  Xem tất cả →
                </button>
              )}
            </div>
            {friends.length === 0 ? (
              <div className="empty-state" style={{ padding: 'var(--spacing-xl)' }}>
                <div className="empty-state-icon">👥</div>
                <h3 className="empty-state-title">Chưa có bạn bè</h3>
                <p className="empty-state-text">Kết nối với bạn bè để xem bài viết của họ</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 'var(--spacing-md)' }}>
                {friends.slice(0, 12).map((f) => {
                  const isRequester = f.requesterId === user.id;
                  const fid = isRequester ? f.addresseeId : f.requesterId;
                  const fname = isRequester ? f.addresseeName : f.requesterName;
                  const favatar = isRequester ? f.addresseeAvatar : f.requesterAvatar;
                  return (
                    <Link
                      key={f.id}
                      to={`/users/${fid}`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 'var(--spacing-sm)',
                        padding: 'var(--spacing-md)',
                        borderRadius: 'var(--radius-lg)',
                        background: 'var(--gray-50)',
                        textDecoration: 'none',
                        transition: 'all var(--transition-base)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--primary-lighter)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--gray-50)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <div className="post-avatar" style={{ width: '64px', height: '64px' }}>
                        {favatar ? (
                          <img src={favatar} alt={fname} />
                        ) : (
                          <div className="post-avatar-placeholder" style={{ fontSize: '24px' }}>
                            {fname.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span style={{ fontWeight: '600', color: 'var(--gray-900)', fontSize: '14px', textAlign: 'center' }}>
                        {fname}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content Section - Row 2: Bài viết | Chia sẻ */}
      <section style={{ marginTop: 'var(--spacing-xl)' }}>
        <div className="profile-tabs">
          <button
            className={`profile-tab ${contentTab === 'posts' ? 'active' : ''}`}
            onClick={() => setContentTab('posts')}
          >
            Bài viết
          </button>
          <button
            className={`profile-tab ${contentTab === 'shares' ? 'active' : ''}`}
            onClick={() => setContentTab('shares')}
          >
            Chia sẻ
          </button>
        </div>

        {contentTab === 'posts' && (
          <>
            <PostComposerBar
              user={user}
              title="Bạn muốn chia sẻ điều gì?"
              subtitle="Viết bài viết mới lên trang cá nhân"
              buttonLabel="Tạo bài viết"
              onOpen={() => setComposerOpen(true)}
            />
            <section className="feed">
              {personalPosts.length > 0 ? (
                <>
                  {personalPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      user={user}
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
                    <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                      <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                        {loadingMore ? (
                          <>
                            <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                            Đang tải...
                          </>
                        ) : (
                          'Tải thêm'
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : !loading ? (
                <div className="empty-state card">
                  <div className="empty-state-icon">📝</div>
                  <h3 className="empty-state-title">Chưa có bài viết nào</h3>
                  <p className="empty-state-text">Hãy viết bài viết đầu tiên của bạn!</p>
                </div>
              ) : null}
            </section>
          </>
        )}

        {contentTab === 'shares' && (
          <section className="feed">
            {userShares.length > 0 ? (
              <>
                {userShares.map((share) => (
                  <ShareCard key={share.id} share={share} user={user} onDelete={deleteShare} />
                ))}
                {hasMoreShares && (
                  <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
                    <button className="btn btn-secondary" onClick={loadMoreShares}>
                      Tải thêm chia sẻ
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state card">
                <div className="empty-state-icon">🔗</div>
                <h3 className="empty-state-title">Chưa có chia sẻ nào</h3>
                <p className="empty-state-text">Chia sẻ bài viết từ người khác để xuất hiện ở đây</p>
              </div>
            )}
          </section>
        )}
      </section>

      {/* Viewer Modal */}
      {viewerImage && (
        <div className="modal-backdrop" onClick={() => setViewerImage(null)}>
          <img src={viewerImage} alt="viewer" style={{ maxWidth: 'min(1000px, 96vw)', maxHeight: '90vh', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2xl)' }} />
        </div>
      )}

      {/* Composer Modal */}
      {composerOpen && (
        <PostComposerModal
          user={user}
          editingData={editingData}
          showVisibility={!editingData}
          successMessage={message}
          errorMessage={error}
          closeDisabled={loading}
          onClose={resetComposer}
          onCreatePoll={() => { setComposerOpen(false); setShowPollCreator(true); }}
          onSuccess={() => handleComposerSuccess(editingData ? 'Đã cập nhật bài viết.' : 'Đã đăng bài viết.')}
        />
      )}
      {showPollCreator && (
        <div className="modal-backdrop" onClick={() => setShowPollCreator(false)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <PollCreator onSubmit={handleCreatePoll} onCancel={() => setShowPollCreator(false)} showVisibility submitting={loading} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;
