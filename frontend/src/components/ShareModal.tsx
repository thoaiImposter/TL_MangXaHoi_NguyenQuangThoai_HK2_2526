import { useState } from 'react';
import { api } from '../lib/api';
import { useModalScrollLock } from '../hooks/useModalScrollLock';
import type { PostFeedItem, User } from '../types';

type ShareModalProps = {
  post: PostFeedItem;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onShared: () => void;
};

type ShareVisibility = 'public' | 'friends' | 'private';

export default function ShareModal({ post, user, isOpen, onClose, onShared }: ShareModalProps) {
  useModalScrollLock(isOpen);
  const [shareVisibility, setShareVisibility] = useState<ShareVisibility>('public');
  const [shareContent, setShareContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setShareVisibility('public');
    setShareContent('');
    setError('');
    onClose();
  };

  const handleShare = async () => {
    setLoading(true);
    setError('');
    try {
      await api.sharePost(post.id, user.id, {
        shareContent: shareContent.trim() || undefined,
        shareVisibility,
      });
      handleClose();
      onShared();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể chia sẻ bài viết');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={(event) => { event.stopPropagation(); handleClose(); }}>
      <div className="share-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div><p className="eyebrow">Trang cá nhân</p><h2 className="modal-title">Chia sẻ bài viết</h2></div>
          <button className="modal-close" type="button" onClick={handleClose} aria-label="Đóng">×</button>
        </div>

        <div className="share-modal-scroll">
          <div className="share-preview">
            <div className="author-meta">
              <div className="author-avatar author-avatar-sm">
                {post.authorAvatar ? <img src={post.authorAvatar} alt={post.authorName} /> : <span>{post.authorName.charAt(0).toUpperCase()}</span>}
              </div>
              <div><div className="post-name">{post.authorName}</div><div className="post-meta">{new Date(post.createdAt).toLocaleDateString('vi-VN')}</div></div>
            </div>
            {post.isPoll && <strong className="share-poll-title">{post.title}</strong>}
            {post.content && <p className="post-body">{post.content.length > 180 ? `${post.content.substring(0, 180)}...` : post.content}</p>}
          </div>

          <label className="form-group">
            <span className="form-label">Bạn muốn nói gì?</span>
            <textarea className="form-textarea" placeholder="Viết gì đó về bài viết này..." rows={3} value={shareContent} onChange={(event) => setShareContent(event.target.value)} />
          </label>

          <div className="form-group">
            <span className="form-label">Ai có thể xem bài chia sẻ?</span>
            <div className="share-visibility-buttons">
              {([
                ['public', 'Công khai'],
                ['friends', 'Bạn bè'],
                ['private', 'Riêng tư'],
              ] as const).map(([value, label]) => (
                <button className={`chip ${shareVisibility === value ? 'chip-solid' : ''}`} key={value} type="button" onClick={() => setShareVisibility(value)}>{label}</button>
              ))}
            </div>
          </div>
          {error && <div className="form-error">{error}</div>}
        </div>

        <div className="modal-actions">
          <button className="chip" type="button" onClick={handleClose}>Hủy</button>
          <button className="primary-button" type="button" onClick={handleShare} disabled={loading}>{loading ? 'Đang chia sẻ...' : 'Chia sẻ về trang cá nhân'}</button>
        </div>
      </div>
    </div>
  );
}
