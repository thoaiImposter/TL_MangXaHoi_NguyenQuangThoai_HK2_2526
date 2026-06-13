import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PostComposerBar from '../components/PostComposerBar';
import PostComposerModal from '../components/PostComposerModal';
import PostCard from '../components/PostCard';
import ShareCard from '../components/ShareCard';
import PollCreator from '../components/PollCreator';
import { api } from '../lib/api';
import { uploadFileUrl } from '../lib/upload';
import type { Friendship, PostFeedItem, PostShare, User } from '../types';

type HomePageProps = {
  user: User;
};

type Draft = { content: string; media: string[] };

function HomePage({ user }: HomePageProps) {
  const [feed, setFeed] = useState<PostFeedItem[]>([]);
  const [shares, setShares] = useState<PostShare[]>([]);
  const [commentDrafts, setCommentDrafts] = useState<Record<number, Draft>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<number, Draft>>({});
  const [replyTarget, setReplyTarget] = useState<Record<number, number | null>>({});
  const [expandedPosts, setExpandedPosts] = useState<Record<number, boolean>>({});
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingData, setEditingData] = useState<{ id: number; content: string; media: { mediaUrl: string }[]; visibility?: string } | null>(null);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [commentLikeState, setCommentLikeState] = useState<Record<number, { likeCount: number; likedByMe: boolean }>>({});
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([]);
  const [feedPage, setFeedPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const visibleFeed = useMemo(() => feed.filter((post) => post.authorId !== user.id), [feed, user.id]);
  const timeline = useMemo(() => [
    ...visibleFeed.map((post) => ({ kind: 'post' as const, createdAt: post.createdAt, post })),
    ...shares.filter((share) => share.sharedByUserId !== user.id).map((share) => ({ kind: 'share' as const, createdAt: share.createdAt, share })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [visibleFeed, shares, user.id]);
  const myPosts = useMemo(() => feed.filter((post) => post.authorId === user.id), [feed, user.id]);

  const fileToBase64 = (file: File) => uploadFileUrl(file, 'comments');

  const loadFeed = async (page = 0, append = false) => {
    if (page === 0) setLoading(true);
    else setLoadingMore(true);
    try {
      const [data, shareData, pending] = await Promise.all([
        api.getFeed(user.id, page, 10),
        api.getSharesForFeed(user.id, page, 10),
        api.getPendingFriendRequests(user.id),
      ]);
      setFeed((current) => (append ? [...current, ...data] : data));
      setShares((current) => (append ? [...current, ...shareData] : shareData));
      setPendingRequests(pending);
      if (data.length < 10 && shareData.length < 10) setHasMore(false);
      else setHasMore(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được bảng tin');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadFeed(0, false).catch((err) => setError(err instanceof Error ? err.message : 'Không tải được bảng tin'));
  }, [user.id]);

  const loadMore = () => {
    if (!hasMore || loadingMore) return;
    const next = feedPage + 1;
    setFeedPage(next);
    loadFeed(next, true);
  };

  const handleCreatePoll = async (pollData: { title: string; content: string; options: string[]; endDate?: string; allowMultiple: boolean }) => {
    setLoading(true);
    try {
      await api.createPoll(user.id, pollData);
      setShowPollCreator(false);
      setNotice('Đã tạo bình chọn thành công!');
      setFeedPage(0);
      await loadFeed(0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tạo được bình chọn');
    } finally {
      setLoading(false);
    }
  };

  const resetComposer = () => {
    setComposerOpen(false);
    setEditingData(null);
  };

  const handleComposerSuccess = async (msg?: string) => {
    if (msg) setNotice(msg);
    resetComposer();
    setFeedPage(0);
    await loadFeed(0, false);
  };

  const beginEdit = (post: PostFeedItem) => {
    setEditingData({
      id: post.id,
      content: post.content,
      media: post.media.map((item) => ({ mediaUrl: item.mediaUrl })),
      visibility: post.visibility,
    });
    setComposerOpen(true);
  };

  const removePost = async (postId: number) => {
    setLoading(true);
    setError('');
    try {
      await api.deletePost(postId, user.id);
      setFeedPage(0);
      await loadFeed(0, false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xoá được bài viết');
    } finally {
      setLoading(false);
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
    try {
      await api.addComment(postId, user.id, { content, media: draft.media });
      setCommentDrafts((current) => ({ ...current, [postId]: { content: '', media: [] } }));
      await loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không bình luận được');
    }
  };

  const submitReply = async (postId: number, commentId: number) => {
    const draft = replyDrafts[commentId];
    const content = draft?.content.trim() ?? '';
    if (!content && !draft?.media.length) return;
    try {
      await api.replyComment(postId, commentId, user.id, { content, media: draft.media });
      setReplyDrafts((current) => ({ ...current, [commentId]: { content: '', media: [] } }));
      setReplyTarget((current) => ({ ...current, [postId]: null }));
      await loadFeed();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không trả lời được bình luận');
    }
  };

  const toggleCommentLike = async (commentId: number) => {
    try {
      const result = await api.toggleCommentLike(commentId, user.id);
      setCommentLikeState((current) => ({
        ...current,
        [commentId]: { likeCount: result.likeCount, likedByMe: result.likedByMe },
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thích được bình luận');
    }
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

  return (
    <div className="shell-grid">
      <aside className="sidebar-left">
        <section className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <div className="flex items-center gap-md mb-lg">
            <div className="post-avatar" style={{ width: '56px', height: '56px' }}>
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName} />
              ) : (
                <div className="post-avatar-placeholder">{user.fullName.charAt(0).toUpperCase()}</div>
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gray-900)' }}>{user.fullName}</h2>
              <p className="text-muted text-sm">{user.email}</p>
            </div>
          </div>
          <Link to="/profile" className="btn btn-secondary" style={{ width: '100%' }}>
            Xem trang cá nhân
          </Link>
          <div className="flex gap-sm mt-lg" style={{ flexWrap: 'wrap' }}>
            <span className="chip">
              <span style={{ color: '#22c55e' }}>●</span> Online
            </span>
            <span className="chip">User #{user.id}</span>
          </div>
        </section>

        <section className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: 'var(--spacing-md)', color: 'var(--gray-900)' }}>
            Lời mời kết bạn
          </h3>
          {pendingRequests.length === 0 ? (
            <p className="text-muted text-sm">Không có lời mời nào.</p>
          ) : (
            <div className="flex flex-col gap-md">
              {pendingRequests.map((req) => (
                <div key={req.id} className="flex items-center gap-md">
                  <div className="post-avatar">
                    {req.requesterAvatar ? (
                      <img src={req.requesterAvatar} alt={req.requesterName} />
                    ) : (
                      <div className="post-avatar-placeholder">{req.requesterName.charAt(0).toUpperCase()}</div>
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Link to={`/users/${req.requesterId}`} style={{ fontWeight: '600', color: 'var(--gray-900)', textDecoration: 'none' }}>
                      {req.requesterName}
                    </Link>
                  </div>
                  <div className="flex gap-sm">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => api.acceptFriendRequest(req.id, user.id).then(() => loadFeed()).catch((err) => setError(err instanceof Error ? err.message : 'Lỗi'))}
                    >
                      Chấp nhận
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => api.rejectOrCancelFriendRequest(req.id, user.id).then(() => loadFeed()).catch((err) => setError(err instanceof Error ? err.message : 'Lỗi'))}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>

      <section className="main-content">
        <div style={{ marginBottom: '16px' }}>
          <PostComposerBar
            user={user}
            title="Bạn đang nghĩ gì?"
            subtitle="Chia sẻ suy nghĩ của bạn với mọi người"
            buttonLabel="Tạo bài viết"
            onOpen={() => setComposerOpen(true)}
          />
        </div>

        <section className="feed">
          {timeline.map((entry) => entry.kind === 'share' ? (
            <ShareCard key={`share-${entry.share.id}`} share={entry.share} user={user} />
          ) : (
            <PostCard
              key={`post-${entry.post.id}`}
              post={entry.post}
              user={user}
              expandedPost={expandedPosts[entry.post.id] ?? false}
              expandedComments={expandedComments[entry.post.id] ?? false}
              commentDraft={commentDrafts[entry.post.id]}
              replyDrafts={replyDrafts}
              replyTarget={replyTarget}
              commentLikeState={commentLikeState}
              onToggleExpandedPost={(postId) => setExpandedPosts((current) => ({ ...current, [postId]: !current[postId] }))}
              onToggleExpandedComments={(postId) => setExpandedComments((current) => ({ ...current, [postId]: !current[postId] }))}
              onBeginEdit={beginEdit}
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
          {hasMore && timeline.length > 0 && (
            <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)' }}>
              <button className="btn btn-secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                    Đang tải...
                  </>
                ) : (
                  'Tải thêm bài viết'
                )}
              </button>
            </div>
          )}
          {timeline.length === 0 && !loading && (
            <div className="empty-state card">
              <div className="empty-state-icon">📭</div>
              <h3 className="empty-state-title">Chưa có bài viết nào</h3>
              <p className="empty-state-text">Hãy là người đầu tiên chia sẻ điều gì đó!</p>
            </div>
          )}
        </section>
      </section>

      <aside className="sidebar-right">
        <section className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: 'var(--spacing-md)', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Xu hướng
          </h3>
          <div className="flex flex-col gap-md">
            <div className="flex justify-between items-center">
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-900)' }}>#design</p>
                <p className="text-muted text-sm">Clean social UI</p>
              </div>
              <span className="text-muted text-sm">12.4K</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-900)' }}>#profile</p>
                <p className="text-muted text-sm">User settings</p>
              </div>
              <span className="text-muted text-sm">8.1K</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p style={{ fontWeight: '600', color: 'var(--gray-900)' }}>#frontend</p>
                <p className="text-muted text-sm">React + TSX</p>
              </div>
              <span className="text-muted text-sm">19.8K</span>
            </div>
          </div>
        </section>

        <section className="card" style={{ padding: 'var(--spacing-lg)' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: 'var(--spacing-md)', color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Bài viết của bạn
          </h3>
          {myPosts.length === 0 ? (
            <p className="text-muted text-sm">Chưa có bài nào.</p>
          ) : (
            <div className="flex flex-col gap-md">
              {myPosts.slice(0, 5).map((post) => (
                <div key={post.id} className="flex justify-between items-center">
                  <div>
                    <p style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{new Date(post.createdAt).toLocaleDateString()}</p>
                    <p className="text-muted text-sm">
                      {post.likeCount} thích · {post.commentCount} bình luận
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </aside>

      {viewerImage && (
        <div className="modal-backdrop" onClick={() => setViewerImage(null)}>
          <img src={viewerImage} alt="viewer" style={{ maxWidth: 'min(1000px, 96vw)', maxHeight: '90vh', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-2xl)' }} />
        </div>
      )}

      {composerOpen && (
        <PostComposerModal
          user={user}
          editingData={editingData}
          showVisibility={!editingData}
          successMessage={notice}
          errorMessage={error}
          closeDisabled={loading}
          onClose={resetComposer}
          onSuccess={() => handleComposerSuccess(editingData ? 'Đã cập nhật bài viết.' : 'Đã đăng bài viết.')}
        />
      )}

      {showPollCreator && (
        <div className="modal-backdrop" onClick={() => setShowPollCreator(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <PollCreator
              onSubmit={handleCreatePoll}
              onCancel={() => setShowPollCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
