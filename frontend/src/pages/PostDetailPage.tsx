import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, resolveMediaUrl } from '../lib/api';
import type { PostFeedItem, PostComment, PostMedia } from '../types';
import ShareModal from '../components/ShareModal';
import PollCard from '../components/PollCard';

type Draft = { content: string; media: string[] };
type CommentLikeState = Record<number, { likeCount: number; likedByMe: boolean }>;

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  
  const getUser = () => {
    const stored = localStorage.getItem('social_user');
    return stored ? JSON.parse(stored) : null;
  };
  
  const user = getUser();
  const userId = user?.id || 0;

  const EMOJIS = useMemo(() => [
    '😀','😂','🥰','😍','😘','😊','😉','🤔','😢','😭','😡','🥳','👍','👎','👏','🙏','❤️','💔','🔥','✨','🎉','😎','🤗','🤭','😴','😷','🤢','🤡','💩','👻','👽','🤖','🎃','🤝','👊','✌️','🤞','🤟','🤘','👌','🤌','🖐️','✋','👋','💪','🦾','🦵','🦶','👂','👃','🧠','🫀','🫁','🦷','👀','👁️','👅','👄','💋','🩸'
  ], []);

  const [post, setPost] = useState<PostFeedItem | null>(null);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentDraft, setCommentDraft] = useState<Draft>({ content: '', media: [] });
  const [replyDrafts, setReplyDrafts] = useState<Record<number, Draft>>({});
  const [replyTarget, setReplyTarget] = useState<Record<number, number | null>>({});
  const [commentLikeState, setCommentLikeState] = useState<CommentLikeState>({});
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [expandedPost, setExpandedPost] = useState(false);
  const [expandedComments, setExpandedComments] = useState(true);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const pickMedia = async (files: FileList | null, setter: (value: string[]) => void) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 10);
    const encoded = await Promise.all(picked.map((file) => fileToBase64(file)));
    setter(encoded);
  };

  useEffect(() => {
    loadPostData();
  }, [postId]);

  const loadPostData = async () => {
    if (!postId) return;
    setLoading(true);
    try {
      // Load post detail
      const feed = await api.getFeed(userId, 0, 100);
      const foundPost = feed.find(p => p.id === parseInt(postId!));
      if (foundPost) {
        setPost(foundPost);
        setComments(foundPost.comments);
      }
    } catch (error) {
      console.error('Failed to load post:', error);
    }
    setLoading(false);
  };

  const handleLikePost = async () => {
    if (!postId) return;
    try {
      await api.toggleLike(parseInt(postId), userId);
      loadPostData();
    } catch (error) {
      console.error('Failed to like post:', error);
    }
  };

  const handleComment = async () => {
    if (!postId || !commentDraft.content.trim()) return;
    try {
      await api.addComment(parseInt(postId), userId, { content: commentDraft.content, media: commentDraft.media });
      setCommentDraft({ content: '', media: [] });
      loadPostData();
    } catch (error) {
      console.error('Failed to comment:', error);
    }
  };

  const handleReply = async (commentId: number) => {
    if (!postId) return;
    const draft = replyDrafts[commentId];
    if (!draft?.content.trim()) return;
    try {
      await api.replyComment(parseInt(postId), commentId, userId, { content: draft.content, media: draft.media });
      setReplyDrafts(current => ({ ...current, [commentId]: { content: '', media: [] } }));
      setReplyTarget(current => ({ ...current, [commentId]: null }));
      loadPostData();
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

  const handlePickCommentMedia = async (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 10);
    const encoded = await Promise.all(picked.map((file) => fileToBase64(file)));
    setCommentDraft(current => ({
      ...current,
      media: [...current.media, ...encoded].slice(0, 10),
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

  const handleShareClick = () => {
    setShareModalOpen(true);
  };

  const handleShareSuccess = () => {
    loadPostData();
  };

  const AvatarView = ({ src, name, size }: { src?: string | null; name: string; size: 'sm' | 'md' }) => {
    const [failed, setFailed] = useState(false);
    const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase();
    const cls = size === 'sm' ? 'author-avatar author-avatar-sm' : 'author-avatar';
    return <div className={cls}>{!failed && src ? <img src={src} alt={name} onError={() => setFailed(true)} /> : <span>{initial}</span>}</div>;
  };

  const getFileDownloadUrl = (mediaUrl: string) => {
    const url = resolveMediaUrl(mediaUrl);
    if (url.startsWith('data:')) return url;
    if (url.includes('/download')) return url;
    return url + '/download';
  };

  const renderMediaThumbnail = (item: PostMedia) => {
    if (item.mediaType === 'video') {
      return (
        <>
          <video src={resolveMediaUrl(item.mediaUrl)} className="post-media-preview" />
          <div className="media-type-badge">▶ Video</div>
        </>
      );
    }
    if (item.mediaType === 'file') {
      return (
        <div className="file-preview">
          <div className="file-icon">📄</div>
          <div className="file-name">{item.mediaName || 'File'}</div>
        </div>
      );
    }
    return <img src={resolveMediaUrl(item.mediaUrl)} alt="post-media" className="post-media-preview" />;
  };

  const renderViewerContent = (media: PostMedia[]) => {
    const item = media[viewerIndex];
    if (!item) return null;
    if (item.mediaType === 'video') {
      return <video src={resolveMediaUrl(item.mediaUrl)} controls autoPlay className="viewer-media" />;
    }
    if (item.mediaType === 'file') {
      return (
        <div className="file-viewer">
          <div className="file-icon-large">📄</div>
          <div className="file-name-large">{item.mediaName || 'File'}</div>
          <a href={getFileDownloadUrl(item.mediaUrl)} download className="primary-button" style={{ marginTop: '16px' }}>
            Tải file xuống
          </a>
        </div>
      );
    }
    return <img src={resolveMediaUrl(item.mediaUrl)} alt="post-viewer" className="viewer-media" />;
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const renderPostMedia = (media: PostMedia[]) => {
    if (!media.length) return null;
    const count = media.length;
    const visible = media.slice(0, 5);
    const layoutClass =
      count === 1 ? 'post-media-layout post-media-1' :
      count === 2 ? 'post-media-layout post-media-2' :
      count === 3 ? 'post-media-layout post-media-3' :
      count === 4 ? 'post-media-layout post-media-4' :
      'post-media-layout post-media-5';
    const hasNonImage = media.some(m => m.mediaType !== 'image');

    return (
      <>
        <div className={layoutClass} style={{ marginTop: '16px' }}>
          {visible.map((item, index) => (
            <button
              className={`post-media-tile post-media-pos-${index + 1}`}
              type="button"
              key={item.id}
              onClick={() => !hasNonImage && openViewer(index)}
              style={{ cursor: hasNonImage ? 'default' : 'pointer' }}
            >
              {renderMediaThumbnail(item)}
              {index === 4 && count > 5 && <div className="media-more">+{count - 5}</div>}
            </button>
          ))}
        </div>

        {viewerOpen && (
          <div className="image-viewer" role="presentation" onClick={() => setViewerOpen(false)}>
            <div className="post-viewer" onClick={(e) => e.stopPropagation()}>
              <button
                className="viewer-arrow viewer-prev"
                type="button"
                onClick={() => setViewerIndex((current) => (current - 1 + count) % count)}
              >
                ‹
              </button>
              {renderViewerContent(media)}
              <button
                className="viewer-arrow viewer-next"
                type="button"
                onClick={() => setViewerIndex((current) => (current + 1) % count)}
              >
                ›
              </button>
              <button className="viewer-close" type="button" onClick={() => setViewerOpen(false)}>
                ×
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCommentMedia = (media: { id: number; mediaUrl: string; mediaOrder: number }[]) => {
    if (!media.length) return null;
    return (
      <div className="comment-media-grid comment-media-count-1" style={{ marginTop: '8px' }}>
        {media.slice(0, 4).map((item) => (
          <img key={item.id} src={resolveMediaUrl(item.mediaUrl)} alt="comment-media" style={{ maxWidth: '200px', borderRadius: '8px' }} />
        ))}
      </div>
    );
  };

  const renderCommentTree = (commentList: PostComment[], parentId: number | null = null, depth = 0) =>
    commentList
      .filter((comment) => comment.parentCommentId === parentId)
      .map((comment) => {
        const likeInfo = commentLikeState[comment.id];
        const likeCount = likeInfo?.likeCount ?? comment.likeCount ?? 0;
        const likedByMe = likeInfo?.likedByMe ?? comment.likedByMe ?? false;
        const hasChildren = commentList.some((item) => item.parentCommentId === comment.id);
        
        return (
          <div key={comment.id} style={{ marginLeft: depth * 24, marginBottom: '16px' }}>
            <div className="comment-card">
              <div className="author-meta comment-author">
                <AvatarView src={comment.authorAvatar} name={comment.authorName} size="sm" />
                <div>
                  <div className="post-name">{comment.authorName}</div>
                  <div className="post-meta">{new Date(comment.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="comment-text" style={{ marginTop: '8px' }}>{comment.content}</div>
              {renderCommentMedia(comment.media)}
              <div className="feed-actions comment-actions" style={{ marginTop: '8px' }}>
                <button className={`chip ${likedByMe ? 'chip-solid' : ''}`} type="button" onClick={() => handleToggleCommentLike(comment.id)}>
                  Thích <span>{likeCount}</span>
                </button>
                <button
                  className="chip"
                  type="button"
                  onClick={() =>
                    setReplyTarget(current => ({
                      ...current,
                      [comment.id]: current[comment.id] === comment.id ? null : comment.id,
                    }))
                  }
                >
                  Trả lời
                </button>
              </div>
            </div>

            {replyTarget[comment.id] === comment.id && (
              <div className="comment-reply-box" style={{ marginTop: '12px', marginLeft: '48px' }}>
                <textarea
                  placeholder="Trả lời bình luận..."
                  rows={2}
                  value={replyDrafts[comment.id]?.content ?? ''}
                  onChange={(e) =>
                    setReplyDrafts(current => ({
                      ...current,
                      [comment.id]: { content: e.target.value, media: current[comment.id]?.media ?? [] },
                    }))
                  }
                />
                <div className="feed-actions" style={{ marginTop: '8px' }}>
                  <label className="icon-upload">
                    <input type="file" accept="image/*" multiple onChange={(e) => handlePickReplyMedia(comment.id, e.target.files)} />
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M4 7a3 3 0 013-3h6.5c.8 0 1.5.3 2.1.9l3.5 3.5c.6.6.9 1.3.9 2.1V17a3 3 0 01-3 3H7a3 3 0 01-3-3V7zm8 0v3h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </label>
                  <button className="primary-button" type="button" onClick={() => handleReply(comment.id)}>
                    Gửi
                  </button>
                </div>
              </div>
            )}

            {hasChildren && renderCommentTree(commentList, comment.id, depth + 1)}
          </div>
        );
      });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        Đang tải...
      </div>
    );
  }

  if (!post) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Không tìm thấy bài viết</h2>
        <button className="btn btn-primary" onClick={() => navigate('/home')} style={{ marginTop: '16px' }}>
          Về trang chủ
        </button>
      </div>
    );
  }

  const visibilityLabel = (v?: string) => {
    if (v === 'private') return 'Riêng tư';
    if (v === 'friends') return 'Bạn bè';
    return 'Công khai';
  };

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto', padding: '20px' }}>
      {/* Back button */}
      <button 
        className="chip" 
        onClick={() => navigate(-1)} 
        style={{ marginBottom: '16px' }}
      >
        ← Quay lại
      </button>

      {/* Post Content */}
      <article className="post" style={{ padding: '20px' }}>
        <div className="post-head">
          <div className="post-author-row">
            <AvatarView src={post.authorAvatar} name={post.authorName} size="md" />
            <div>
              <Link to={`/users/${post.authorId}`} className="post-name" style={{ textDecoration: 'none', color: 'inherit' }}>
                {post.authorName}
              </Link>
              <div className="post-meta">
                {new Date(post.createdAt).toLocaleString()} · {visibilityLabel(post.visibility)}
              </div>
            </div>
          </div>
        </div>

        <p className="post-body" style={{ marginTop: '12px', fontSize: '16px', lineHeight: '1.6' }}>
          {post.content}
        </p>

        {post.isPoll && <PollCard post={post} userId={userId} />}

        {renderPostMedia(post.media)}

        <div className="feed-actions post-actions" style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
          <button className={`chip ${post.likedByMe ? 'chip-solid' : ''}`} type="button" onClick={handleLikePost}>
            Thích <span>{post.likeCount}</span>
          </button>
          <button className="chip" type="button" onClick={() => setExpandedComments(!expandedComments)}>
            {expandedComments ? 'Thu gọn' : `Bình luận (${post.commentCount})`}
          </button>
          <button className="chip" type="button" onClick={handleShareClick}>
            Chia sẻ <span>{post.shareCount}</span>
          </button>
        </div>
      </article>

      {/* Comments Section */}
      {expandedComments && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>Bình luận ({comments.length})</h3>
          
          {/* Comment list */}
          <div style={{ marginBottom: '24px' }}>
            {renderCommentTree(comments)}
            {comments.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#65676b' }}>
                Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
              </div>
            )}
          </div>

          {/* Comment form */}
          <div className="comment-composer" style={{ padding: '16px', background: '#f0f2f5', borderRadius: '12px' }}>
            <textarea
              placeholder="Viết bình luận..."
              rows={3}
              value={commentDraft.content}
              onChange={(e) => setCommentDraft(current => ({ ...current, content: e.target.value }))}
            />
            <div className="feed-actions" style={{ marginTop: '12px' }}>
              <label className="icon-upload">
                <input type="file" accept="image/*" multiple onChange={(e) => handlePickCommentMedia(e.target.files)} />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 7a3 3 0 013-3h6.5c.8 0 1.5.3 2.1.9l3.5 3.5c.6.6.9 1.3.9 2.1V17a3 3 0 01-3 3H7a3 3 0 01-3-3V7zm8 0v3h3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>
              <button className="primary-button" type="button" onClick={handleComment}>
                Gửi bình luận
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer */}

      {/* Share Modal */}
      {user && post && (
        <ShareModal
          post={post}
          user={user}
          isOpen={shareModalOpen}
          onClose={() => setShareModalOpen(false)}
          onShared={handleShareSuccess}
        />
      )}
    </div>
  );
}
