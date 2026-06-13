import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { PostFeedItem, User, Group } from '../types';

type ShareModalProps = {
  post: PostFeedItem;
  user: User;
  isOpen: boolean;
  onClose: () => void;
  onShared: () => void;
};

type ShareTarget = 'timeline' | 'group';
type ShareVisibility = 'public' | 'friends' | 'private';

export default function ShareModal({ post, user, isOpen, onClose, onShared }: ShareModalProps) {
  const [shareTarget, setShareTarget] = useState<ShareTarget>('timeline');
  const [shareVisibility, setShareVisibility] = useState<ShareVisibility>('public');
  const [shareContent, setShareContent] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<number | ''>('');
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && shareTarget === 'group') {
      loadMyGroups();
      setShareVisibility('public');
    }
  }, [isOpen, shareTarget]);

  const loadMyGroups = async () => {
    try {
      const groups = await api.getMyGroups(user.id, 0, 50);
      const activeGroups = groups.filter(g => g.privacy === 'public' || g.privacy === 'private');
      setMyGroups(activeGroups);
    } catch (err) {
      console.error('Failed to load groups:', err);
    }
  };

  const resetForm = () => {
    setShareTarget('timeline');
    setShareVisibility('public');
    setShareContent('');
    setSelectedGroup('');
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleShare = async () => {
    if (shareTarget === 'group' && !selectedGroup) {
      setError('Vui lòng chọn nhóm để chia sẻ');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        shareContent: shareContent.trim() || undefined,
        shareVisibility: shareVisibility,
        targetGroupId: shareTarget === 'group' ? Number(selectedGroup) : undefined,
      };

      await api.sharePost(post.id, user.id, payload);
      setSuccess(shareTarget === 'group' ? 'Đã chia sẻ vào nhóm!' : 'Đã chia sẻ bài viết!');
      
      setTimeout(() => {
        handleClose();
        onShared();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể chia sẻ bài viết');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleClose}>
      <div className="share-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="eyebrow">Chia sẻ bài viết</span>
            <h2 className="section-title">Chia sẻ bài viết này</h2>
          </div>
          <button className="ghost-button" type="button" onClick={handleClose}>
            Đóng
          </button>
        </div>

        <div className="share-preview">
          <div className="share-preview-card">
            <div className="author-meta">
              <div className="author-avatar author-avatar-sm">
                {post.authorAvatar ? (
                  <img src={post.authorAvatar} alt={post.authorName} />
                ) : (
                  <span>{post.authorName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="post-name">{post.authorName}</div>
                <div className="post-meta">{new Date(post.createdAt).toLocaleDateString()}</div>
              </div>
            </div>
            <p className="post-body" style={{ marginTop: '8px', fontSize: '14px' }}>
              {post.content.length > 150 ? post.content.substring(0, 150) + '...' : post.content}
            </p>
          </div>
        </div>

        <div className="share-options">
          <div className="form-group">
            <label className="form-label">Chia sẻ đến</label>
            <div className="share-target-buttons">
              <button
                type="button"
                className={`chip ${shareTarget === 'timeline' ? 'chip-solid' : ''}`}
                onClick={() => setShareTarget('timeline')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Dòng thời gian
              </button>
              <button
                type="button"
                className={`chip ${shareTarget === 'group' ? 'chip-solid' : ''}`}
                onClick={() => setShareTarget('group')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
                Nhóm
              </button>
            </div>
          </div>

          {shareTarget === 'group' && (
            <div className="form-group">
              <label className="form-label">Chọn nhóm</label>
              <select
                className="form-select"
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : '')}
              >
                <option value="">-- Chọn nhóm --</option>
                {myGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name} ({group.memberCount} thành viên)
                  </option>
                ))}
              </select>
              {myGroups.length === 0 && (
                <p className="subtle" style={{ marginTop: '4px', fontSize: '12px' }}>
                  Bạn chưa tham gia nhóm nào
                </p>
              )}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Nội dung chia sẻ (tùy chọn)</label>
            <textarea
              className="form-textarea"
              placeholder="Viết gì đó về bài viết này..."
              rows={3}
              value={shareContent}
              onChange={(e) => setShareContent(e.target.value)}
            />
          </div>

          {shareTarget === 'timeline' ? <div className="form-group">
            <label className="form-label">Quyền riêng tư</label>
            <div className="share-visibility-buttons">
              <button
                type="button"
                className={`chip ${shareVisibility === 'public' ? 'chip-solid' : ''}`}
                onClick={() => setShareVisibility('public')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                Công khai
              </button>
              <button
                type="button"
                className={`chip ${shareVisibility === 'friends' ? 'chip-solid' : ''}`}
                onClick={() => setShareVisibility('friends')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                Bạn bè
              </button>
              <button
                type="button"
                className={`chip ${shareVisibility === 'private' ? 'chip-solid' : ''}`}
                onClick={() => setShareVisibility('private')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                Riêng tư
              </button>
            </div>
          </div> : (
            <div className="form-group">
              <label className="form-label">Quyền riêng tư</label>
              <p className="subtle">Bài chia sẻ tự động áp dụng quyền riêng tư của nhóm đã chọn.</p>
            </div>
          )}
        </div>

        {error && <div className="form-error">{error}</div>}
        {success && <div className="form-success">{success}</div>}

        <div className="modal-actions">
          <button className="chip" type="button" onClick={handleClose}>
            Hủy
          </button>
          <button 
            className="primary-button" 
            type="button" 
            onClick={handleShare}
            disabled={loading}
          >
            {loading ? 'Đang chia sẻ...' : 'Chia sẻ'}
          </button>
        </div>
      </div>
    </div>
  );
}
