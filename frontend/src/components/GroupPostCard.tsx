import { useState, type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CommentMedia, PostComment, PostMedia, User, GroupPost } from '../types';
import { resolveMediaUrl } from '../lib/api';
import PollCard from './PollCard';
import PostMediaSection from './PostMediaSection';
import CommentMediaSection from './CommentMediaSection';
import CommentDraftMedia from './CommentDraftMedia';
import LinkifiedText from './LinkifiedText';

type Draft = { content: string; media: string[] };
type CommentLikeState = Record<number, { likeCount: number; likedByMe: boolean }>;

type GroupPostCardProps = {
  post: GroupPost;
  user: User;
  groupId: number;
  expandedPost: boolean;
  expandedComments: boolean;
  commentDraft: Draft | undefined;
  replyDrafts: Record<number, Draft>;
  replyTarget: Record<number, number | null>;
  commentLikeState: CommentLikeState;
  onToggleExpandedPost: (postId: number) => void;
  onToggleExpandedComments: (postId: number) => void;
  onRemove: (postId: number) => void;
  onLikePost: (postId: number) => void;
  onSubmitComment: (postId: number) => void;
  onSubmitReply: (postId: number, commentId: number) => void;
  onToggleCommentLike: (commentId: number) => void;
  onSetCommentDraft: React.Dispatch<React.SetStateAction<Record<number, Draft>>>;
  onSetReplyDrafts: React.Dispatch<React.SetStateAction<Record<number, Draft>>>;
  onSetReplyTarget: React.Dispatch<React.SetStateAction<Record<number, number | null>>>;
  onOpenViewer: (src: string) => void;
  onPickCommentMedia: (postId: number, files: FileList | null) => void;
  onPickReplyMedia: (commentId: number, files: FileList | null) => void;
  onUpdateComment?: (commentId: number, content: string) => void;
  onDeleteComment?: (commentId: number) => void;
  onApprovePost?: (postId: number) => void;
  onRejectPost?: (postId: number) => void;
  isAdmin?: boolean;
};

function GroupPostCard({
  post,
  user,
  expandedPost,
  expandedComments,
  commentDraft,
  replyDrafts,
  replyTarget,
  commentLikeState,
  onToggleExpandedPost,
  onToggleExpandedComments,
  onRemove,
  onLikePost,
  onSubmitComment,
  onSubmitReply,
  onToggleCommentLike,
  onSetCommentDraft,
  onSetReplyDrafts,
  onSetReplyTarget,
  onOpenViewer,
  onPickCommentMedia,
  onPickReplyMedia,
  onUpdateComment,
  onDeleteComment,
  onApprovePost,
  onRejectPost,
  isAdmin = false,
}: GroupPostCardProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const AvatarView = ({ src, name, size }: { src?: string | null; name: string; size: 'sm' | 'md' }) => {
    const [failed, setFailed] = useState(false);
    const initial = (name?.trim()?.charAt(0) || 'U').toUpperCase();
    const cls = size === 'sm' ? 'author-avatar author-avatar-sm' : 'author-avatar';
    return <div className={cls}>{!failed && src ? <img src={src} alt={name} onError={() => setFailed(true)} /> : <span>{initial}</span>}</div>;
  };

  const openViewer = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
  };

  const renderMediaThumbnail = (item: PostMedia) => {
    if (item.mediaType === 'video') {
      return (
        <>
          <video src={resolveMediaUrl(item.mediaUrl)} className="post-media-preview" muted preload="metadata" />
          <div className="media-type-badge" style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(0,0,0,0.6)',
            color: 'white',
            borderRadius: '50%',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}>▶</div>
        </>
      );
    }
    if (item.mediaType === 'file') {
      return (
        <div className="file-preview" style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--gray-100, #f0f2f5)',
          gap: '8px',
        }}>
          <div className="file-icon" style={{ fontSize: '32px' }}>📄</div>
          <div className="file-name" style={{ fontSize: '12px', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{item.mediaName || 'File'}</div>
        </div>
      );
    }
    return <img src={resolveMediaUrl(item.mediaUrl)} alt={`post-media`} className="post-media-preview" />;
  };

  const getFileDownloadUrl = (mediaUrl: string) => {
    return resolveMediaUrl(mediaUrl);
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

    return (
      <>
        <div className={layoutClass}>
          {visible.map((item, index) => (
            <button
              className={`post-media-tile post-media-pos-${index + 1}`}
              type="button"
              key={item.id}
              onClick={(e) => { e.stopPropagation(); openViewer(index); }}
              style={{ cursor: 'pointer' }}
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

  const renderCommentMedia = (media: CommentMedia[]) => {
    if (!media.length) return null;
    const visible = media.slice(0, 4);
    return (
      <div className={`comment-media-grid comment-media-count-${Math.min(media.length, 4)}`}>
        {visible.map((item, index) => (
          <button className="comment-media-tile" type="button" key={item.id} onClick={() => onOpenViewer(resolveMediaUrl(item.mediaUrl))}>
            <img src={resolveMediaUrl(item.mediaUrl)} alt={`comment-media-${index + 1}`} />
            {index === 3 && media.length > 4 && <div className="media-more">+{media.length - 4}</div>}
          </button>
        ))}
      </div>
    );
  };

  void renderPostMedia;
  void renderCommentMedia;

  const renderCommentTree = (comments: PostComment[], parentId: number | null = null, depth = 0): ReactElement[] =>
    comments
      .filter((comment) => comment.parentCommentId === parentId)
      .map((comment) => {
        const likeInfo = commentLikeState[comment.id];
        const likeCount = likeInfo?.likeCount ?? comment.likeCount ?? 0;
        const likedByMe = likeInfo?.likedByMe ?? comment.likedByMe ?? false;
        const hasChildren = comments.some((item) => item.parentCommentId === comment.id);
        return (
          <div className="comment-thread" key={comment.id} style={{ marginLeft: depth * 18 }}>
            <div className="comment-card">
              <div className="author-meta comment-author">
                <AvatarView src={comment.authorAvatar} name={comment.authorName} size="sm" />
                <div>
                  <div className="post-name">{comment.authorName}</div>
                  <div className="post-meta">{new Date(comment.createdAt).toLocaleString()}</div>
                </div>
              </div>
              {editingCommentId === comment.id ? (
                <div className="comment-edit-box">
                  <textarea
                    rows={3}
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                  />
                  <div className="feed-actions">
                    <button className="primary-button" type="button" onClick={() => { onUpdateComment?.(comment.id, editDraft); setEditingCommentId(null); }}>
                      Lưu
                    </button>
                    <button className="chip" type="button" onClick={() => setEditingCommentId(null)}>
                      Hủy
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <LinkifiedText className="comment-text" text={comment.content} />
                  <CommentMediaSection media={comment.media} onOpenImage={onOpenViewer} />
                </>
              )}
              <div className="feed-actions comment-actions">
                <button className={`chip ${likedByMe ? 'chip-solid' : ''}`} type="button" onClick={() => onToggleCommentLike(comment.id)}>
                  Thích <span>{likeCount}</span>
                </button>
                <button
                  className="chip"
                  type="button"
                  onClick={() =>
                    onSetReplyTarget((current) => ({
                      ...current,
                      [post.postId]: current[post.postId] === comment.id ? null : comment.id,
                    }))
                  }
                >
                  Trả lờI
                </button>
                {comment.authorId === user.id && (
                  <>
                    <button className="chip" type="button" onClick={() => { setEditingCommentId(comment.id); setEditDraft(comment.content); }}>
                      Sửa
                    </button>
                    <button className="chip" type="button" onClick={() => onDeleteComment?.(comment.id)}>
                      Xóa
                    </button>
                  </>
                )}
              </div>
            </div>

            {replyTarget[post.postId] === comment.id && (
              <div className="comment-reply-box">
                <textarea
                  placeholder="Trả lời bình luận..."
                  rows={3}
                  value={replyDrafts[comment.id]?.content ?? ''}
                  onChange={(e) =>
                    onSetReplyDrafts((current) => ({
                      ...current,
                      [comment.id]: { content: e.target.value, media: current[comment.id]?.media ?? [] },
                    }))
                  }
                />
                <CommentDraftMedia
                  media={replyDrafts[comment.id]?.media}
                  onRemove={() => onSetReplyDrafts(current => ({
                    ...current,
                    [comment.id]: { content: current[comment.id]?.content ?? '', media: [] },
                  }))}
                />
                <div className="feed-actions">
                  <label className="icon-upload">
                    <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv" onChange={(e) => onPickReplyMedia(comment.id, e.target.files)} />
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        d="M4 7a3 3 0 013-3h6.5c.8 0 1.5.3 2.1.9l3.5 3.5c.6.6.9 1.3.9 2.1V17a3 3 0 01-3 3H7a3 3 0 01-3-3V7zm8 0v3h3"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </label>
                  <button className="primary-button" type="button" onClick={() => onSubmitReply(post.postId, comment.id)}>
                    Gửi
                  </button>
                </div>
              </div>
            )}

            {hasChildren && renderCommentTree(comments, comment.id, depth + 1)}
          </div>
        );
      });

  const navigate = useNavigate();

  const handlePostClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on buttons or links
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('input') || target.closest('[data-poll-card]')) {
      return;
    }
    navigate(`/group/${post.groupId}/post/${post.postId}`);
  };

  return (
    <article className={`post ${expandedPost ? 'post-expanded' : ''}`} style={{ cursor: 'pointer' }} onClick={handlePostClick}>
      {!post.isApproved && (
        <div style={{ background: '#fff3cd', padding: '8px', borderRadius: '4px', marginBottom: '8px', fontSize: '12px', color: '#856404' }}>
          ⏳ Bài viết đang chờ phê duyệt
        </div>
      )}

      <div className="post-head">
        <div className="post-author-row">
          <AvatarView src={post.authorAvatar} name={post.authorName} size="md" />
          <div>
            <div className="post-name">{post.authorName}</div>
            <div className="post-meta">
              {new Date(post.createdAt).toLocaleString()} · Công khai
            </div>
          </div>
        </div>
        <div className="feed-actions post-card-tools">
          {isAdmin && !post.isApproved && (
            <>
              <button className="chip chip-solid" type="button" onClick={() => onApprovePost?.(post.postId)}>
                Duyệt
              </button>
              <button className="chip" type="button" onClick={() => onRejectPost?.(post.postId)}>
                Từ chối
              </button>
            </>
          )}
          {(post.authorId === user.id) && (
            <>
              <button className="chip" type="button" onClick={() => onRemove(post.postId)}>
                Xóa
              </button>
            </>
          )}
        </div>
      </div>

      <p className={`post-body ${expandedPost ? 'post-body-open' : ''}`}>{post.content}</p>
      {post.content.length > 180 && (
        <button className="chip" type="button" onClick={() => onToggleExpandedPost(post.postId)}>
          {expandedPost ? 'Thu gọn' : 'Xem thêm'}
        </button>
      )}

      {post.isPoll && <PollCard post={post} userId={user.id} />}

      <PostMediaSection media={post.media} />

      <div className="feed-actions post-actions">
        <button className={`chip ${post.likedByMe ? 'chip-solid' : ''}`} type="button" onClick={() => onLikePost(post.postId)}>
          Thích <span>{post.likeCount}</span>
        </button>
        <button className="chip" type="button" onClick={() => onToggleExpandedComments(post.postId)}>
          {expandedComments ? 'Thu gọn bình luận' : `Mở bình luận (${post.commentCount})`}
        </button>
      </div>

      {expandedComments && (
        <div className="stack" style={{ marginTop: 16 }}>
          <div className="summary-card comment-panel">
            <div className="side-row">
              <strong>Bình luận</strong>
              <span className="subtle">{post.commentCount}</span>
            </div>
            <div className="stack comment-scroll" style={{ marginTop: 12 }}>
              {renderCommentTree(post.comments)}
              {!post.comments.length && <div className="subtle">Chưa có bình luận nào.</div>}
            </div>
          </div>

          <div className="comment-composer">
            <textarea
              placeholder="Viết bình luận công khai..."
              rows={3}
              value={commentDraft?.content ?? ''}
              onChange={(e) =>
                onSetCommentDraft((current) => ({
                  ...current,
                  [post.postId]: { content: e.target.value, media: current[post.postId]?.media ?? [] },
                }))
              }
            />
            <CommentDraftMedia
              media={commentDraft?.media}
              onRemove={() => onSetCommentDraft(current => ({
                ...current,
                [post.postId]: { content: current[post.postId]?.content ?? '', media: [] },
              }))}
            />
            <div className="feed-actions">
              <label className="icon-upload">
                <input type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z,.txt,.csv" onChange={(e) => onPickCommentMedia(post.postId, e.target.files)} />
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M4 7a3 3 0 013-3h6.5c.8 0 1.5.3 2.1.9l3.5 3.5c.6.6.9 1.3.9 2.1V17a3 3 0 01-3 3H7a3 3 0 01-3-3V7zm8 0v3h3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </label>
              <button className="primary-button" type="button" onClick={() => onSubmitComment(post.postId)}>
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

export default GroupPostCard;
