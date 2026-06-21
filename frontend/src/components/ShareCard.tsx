import { Link } from 'react-router-dom';
import { resolveMediaUrl } from '../lib/api';
import { confirmAction } from '../lib/feedback';
import PollCard from './PollCard';
import PostMediaSection from './PostMediaSection';
import type { Post, PostShare, User } from '../types';

type ShareCardProps = {
  share: PostShare;
  user: User;
  onDelete?: (shareId: number) => void;
};

const visibilityLabel = (visibility?: string) => {
  if (visibility === 'private') return 'Riêng tư';
  if (visibility === 'friends') return 'Bạn bè';
  return 'Công khai';
};

const Avatar = ({ name, url, small = false }: { name: string; url?: string | null; small?: boolean }) => (
  <div className={`author-avatar${small ? ' author-avatar-sm' : ''}`}>
    {url ? (
      <img src={resolveMediaUrl(url)} alt={name} />
    ) : (
      <span>{name.charAt(0).toUpperCase()}</span>
    )}
  </div>
);

export default function ShareCard({ share, user, onDelete }: ShareCardProps) {
  const canDelete = share.sharedByUserId === user.id && Boolean(onDelete);

  const handleDelete = async () => {
    if (!canDelete || !onDelete) return;

    const confirmed = await confirmAction('Bạn có chắc muốn xóa bài chia sẻ này?', {
      title: 'Xóa bài chia sẻ',
      confirmLabel: 'Xóa',
      danger: true,
    });
    if (confirmed) onDelete(share.id);
  };

  const originalPost = {
    id: share.originalPostId,
    title: share.originalPostTitle,
    content: share.originalPostContent,
    visibility: share.originalPostVisibility,
    authorId: share.originalAuthorId,
    authorName: share.originalAuthorName,
    authorAvatar: share.originalAuthorAvatar,
    createdAt: share.createdAt,
    updatedAt: share.createdAt,
    isPoll: true,
    pollEndDate: share.originalPostPollEndDate || undefined,
    pollAllowMultiple: share.originalPostPollAllowMultiple,
  } satisfies Post;

  return (
    <article className="post shared-post-card">
      <header className="post-head shared-post-head">
        <div className="post-author-row">
          <Avatar name={share.sharedByUserName} url={share.sharedByUserAvatar} />
          <div>
            <Link to={`/users/${share.sharedByUserId}`} className="post-name">
              {share.sharedByUserName}
            </Link>
            <div className="post-meta">
              {new Date(share.createdAt).toLocaleString()} · {visibilityLabel(share.shareVisibility)}
            </div>
          </div>
        </div>

        {canDelete && (
          <button className="shared-post-delete" type="button" onClick={handleDelete} aria-label="Xóa bài chia sẻ">
            Xóa
          </button>
        )}
      </header>

      {share.shareContent && <p className="post-body shared-post-caption">{share.shareContent}</p>}

      <section className="shared-original-card">
        {share.isOriginalPostAvailable ? (
          <>
            <Link className="shared-original-link" to={`/post/${share.originalPostId}`}>
              <div className="author-meta">
                <Avatar name={share.originalAuthorName} url={share.originalAuthorAvatar} small />
                <div>
                  <div className="post-name">{share.originalAuthorName}</div>
                  <div className="post-meta">{visibilityLabel(share.originalPostVisibility)}</div>
                </div>
              </div>

              {share.originalPostContent && <p className="post-body shared-original-content">{share.originalPostContent}</p>}
            </Link>

            {!!share.originalPostMedia?.length && <PostMediaSection media={share.originalPostMedia} />}

            {share.originalPostPoll && (
              <div className="shared-original-poll">
                <PollCard post={originalPost} userId={user.id} />
              </div>
            )}
          </>
        ) : (
          <div className="shared-original-unavailable">
            <strong>Bài viết gốc không còn khả dụng</strong>
            <p>Bài viết đã bị xóa, chuyển riêng tư hoặc bạn không có quyền xem.</p>
          </div>
        )}
      </section>
    </article>
  );
}
