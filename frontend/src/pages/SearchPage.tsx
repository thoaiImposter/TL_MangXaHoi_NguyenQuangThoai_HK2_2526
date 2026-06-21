import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, resolveMediaUrl } from '../lib/api';
import type { PostFeedItem, User } from '../types';

type SearchPageProps = {
  user: User;
};

type SearchTab = 'all' | 'users' | 'posts';

const roleLabel: Record<User['role'], string> = {
  student: 'Sinh viên',
  advisor: 'Giảng viên',
  faculty_union: 'Đoàn khoa',
  school_union: 'Đoàn trường',
  admin: 'Quản trị viên',
};

export default function SearchPage({ user }: SearchPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const keyword = searchParams.get('q')?.trim() ?? '';
  const requestedTab = searchParams.get('type');
  const activeTab: SearchTab = requestedTab === 'users' || requestedTab === 'posts' ? requestedTab : 'all';
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<PostFeedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!keyword) {
      setUsers([]);
      setPosts([]);
      return;
    }

    let active = true;
    setLoading(true);
    setError('');
    Promise.all([api.searchUsers(keyword), api.searchPosts(keyword, user.id)])
      .then(([userResults, postResults]) => {
        if (!active) return;
        setUsers(userResults);
        setPosts(postResults);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tìm kiếm lúc này.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [keyword, user.id]);

  const visibleUsers = activeTab === 'posts' ? [] : users;
  const visiblePosts = activeTab === 'users' ? [] : posts;
  const total = users.length + posts.length;
  const tabs = useMemo(() => [
    { id: 'all' as const, label: 'Tất cả', count: total },
    { id: 'users' as const, label: 'Người dùng', count: users.length },
    { id: 'posts' as const, label: 'Bài viết', count: posts.length },
  ], [posts.length, total, users.length]);

  const changeTab = (tab: SearchTab) => {
    const next = new URLSearchParams(searchParams);
    if (tab === 'all') next.delete('type');
    else next.set('type', tab);
    setSearchParams(next);
  };

  return (
    <div className="search-page">
      <header className="search-page-header">
        <span className="eyebrow">Tìm kiếm</span>
        <h1>{keyword ? `Kết quả cho “${keyword}”` : 'Bạn muốn tìm gì?'}</h1>
        <p>{keyword ? `${total} kết quả phù hợp được tìm thấy.` : 'Nhập từ khóa vào thanh tìm kiếm phía trên rồi nhấn Enter.'}</p>
      </header>

      {keyword && (
        <nav className="search-tabs" aria-label="Loại kết quả">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => changeTab(tab.id)}>
              <span>{tab.label}</span>
              <strong>{tab.count}</strong>
            </button>
          ))}
        </nav>
      )}

      {loading && <div className="search-state">Đang tìm kết quả phù hợp...</div>}
      {error && <div className="search-state search-state-error">{error}</div>}

      {!loading && !error && keyword && total === 0 && (
        <div className="search-state">
          <strong>Không tìm thấy kết quả</strong>
          <span>Thử từ khóa ngắn hơn hoặc kiểm tra lại chính tả.</span>
        </div>
      )}

      {!loading && !error && visibleUsers.length > 0 && (
        <section className="search-section">
          <div className="search-section-heading">
            <div><span className="eyebrow">Con người</span><h2>Người dùng</h2></div>
            {activeTab === 'all' && users.length > 4 && <button type="button" onClick={() => changeTab('users')}>Xem tất cả</button>}
          </div>
          <div className="search-user-grid">
            {(activeTab === 'all' ? visibleUsers.slice(0, 4) : visibleUsers).map((result) => (
              <Link className="search-user-card" to={`/users/${result.id}`} key={result.id}>
                <span className="search-user-avatar">
                  {result.avatar ? <img src={resolveMediaUrl(result.avatar)} alt={result.fullName} /> : result.fullName.charAt(0).toUpperCase()}
                </span>
                <span className="search-user-info">
                  <strong>{result.fullName}</strong>
                  <small>{roleLabel[result.role]}{result.faculty ? ` · ${result.faculty}` : ''}</small>
                  <span>{result.bio || 'Xem trang cá nhân'}</span>
                </span>
                <span className="search-result-arrow">›</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && visiblePosts.length > 0 && (
        <section className="search-section">
          <div className="search-section-heading">
            <div><span className="eyebrow">Nội dung</span><h2>Bài viết</h2></div>
            {activeTab === 'all' && posts.length > 5 && <button type="button" onClick={() => changeTab('posts')}>Xem tất cả</button>}
          </div>
          <div className="search-post-list">
            {(activeTab === 'all' ? visiblePosts.slice(0, 5) : visiblePosts).map((post) => {
              const preview = post.media?.find((item) => item.mediaType !== 'file');
              return (
                <Link className={`search-post-card${preview ? '' : ' no-media'}`} to={`/post/${post.id}`} key={post.id}>
                  <div className="search-post-main">
                    <div className="search-post-author">
                      <span className="search-post-avatar">
                        {post.authorAvatar ? <img src={resolveMediaUrl(post.authorAvatar)} alt={post.authorName} /> : post.authorName.charAt(0).toUpperCase()}
                      </span>
                      <span><strong>{post.authorName}</strong><small>{new Date(post.createdAt).toLocaleString('vi-VN')}</small></span>
                    </div>
                    <p>{post.content || 'Bài viết đa phương tiện'}</p>
                    <div className="search-post-stats">
                      <span>{post.likeCount} lượt thích</span><span>{post.commentCount} bình luận</span><span>{post.shareCount} lượt chia sẻ</span>
                    </div>
                  </div>
                  {preview && (
                    <div className="search-post-media">
                      {preview.mediaType === 'video'
                        ? <video src={resolveMediaUrl(preview.mediaUrl)} muted preload="metadata" />
                        : <img src={resolveMediaUrl(preview.mediaUrl)} alt="" loading="lazy" />}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
