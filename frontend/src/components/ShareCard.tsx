import { Link } from 'react-router-dom';
import type { PostShare, User } from '../types';

type ShareCardProps = {
  share: PostShare;
  user: User;
  onDelete?: (shareId: number) => void;
};

export default function ShareCard({ share, user, onDelete }: ShareCardProps) {
  const canDelete = share.sharedByUserId === user.id;

  const handleDelete = () => {
    if (canDelete && onDelete) {
      if (confirm('Bạn có chắc muốn xóa bài chia sẻ này?')) {
        onDelete(share.id);
      }
    }
  };

  const visibilityLabel = (v?: string) => {
    if (v === 'private') return 'Riêng tư';
    if (v === 'friends') return 'Bạn bè';
    return 'Công khai';
  };

  return (
    <div className="post" style={{ padding: '20px', marginBottom: '16px' }}>
      {/* Share header - thông tin người chia sẻ */}
      <div className="post-head" style={{ marginBottom: '12px' }}>
        <div className="post-author-row">
          <div className="author-avatar">
            {share.sharedByUserAvatar ? (
              <img src={share.sharedByUserAvatar} alt={share.sharedByUserName} />
            ) : (
              <span>{share.sharedByUserName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div>
            <Link to={`/users/${share.sharedByUserId}`} className="post-name" style={{ textDecoration: 'none', color: 'inherit' }}>
              {share.sharedByUserName}
            </Link>
            <div className="post-meta">
              {new Date(share.createdAt).toLocaleString()} · {visibilityLabel(share.shareVisibility)}
              {share.sharedToGroupName && ` · ${share.sharedToGroupName}`}
            </div>
          </div>
        </div>
      </div>

      {/* Nội dung chia sẻ (nếu có) */}
      {share.shareContent && (
        <p className="post-body" style={{ marginTop: '12px', fontSize: '16px', lineHeight: '1.6' }}>
          {share.shareContent}
        </p>
      )}

      {/* Preview bài viết gốc */}
      <div className="share-preview-card" style={{ 
        marginTop: '16px', 
        padding: '16px', 
        background: '#f0f2f5', 
        borderRadius: '12px',
        border: '1px solid #ddd'
      }}>
        <div style={{ fontSize: '14px', color: '#65676b', marginBottom: '8px' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '4px' }}>
            <path d="M4 7a3 3 0 013-3h6.5c.8 0 1.5.3 2.1.9l3.5 3.5c.6.6.9 1.3.9 2.1V17a3 3 0 01-3 3H7a3 3 0 01-3-3V7zm8 0v3h3"/>
          </svg>
          Bài viết gốc
        </div>
        
        <Link to={`/post/${share.originalPostId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
          <div className="author-meta">
            <div className="author-avatar author-avatar-sm">
              {share.originalAuthorAvatar ? (
                <img src={share.originalAuthorAvatar} alt={share.originalAuthorName} />
              ) : (
                <span>{share.originalAuthorName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div>
              <div className="post-name">{share.originalAuthorName}</div>
              <div className="post-meta">{visibilityLabel(share.originalPostVisibility)}</div>
            </div>
          </div>
          <p className="post-body" style={{ marginTop: '8px', fontSize: '14px', color: '#333' }}>
            {share.originalPostContent.length > 200 
              ? share.originalPostContent.substring(0, 200) + '...' 
              : share.originalPostContent}
          </p>
        </Link>
      </div>

      {/* Action buttons */}
      <div className="feed-actions post-actions" style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #eee' }}>
        {share.sharedPostId && (
          <Link to={`/post/${share.sharedPostId}`} className="chip" style={{ textDecoration: 'none', color: 'inherit' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
            Bình luận
          </Link>
        )}
        <Link to={`/post/${share.originalPostId}`} className="chip" style={{ textDecoration: 'none', color: 'inherit' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
          Xem bài gốc
        </Link>
        {canDelete && (
          <button 
            className="chip" 
            type="button" 
            onClick={handleDelete}
            style={{ color: '#dc3545' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            Xóa chia sẻ
          </button>
        )}
      </div>
    </div>
  );
}