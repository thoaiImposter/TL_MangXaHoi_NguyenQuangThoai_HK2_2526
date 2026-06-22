import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, resolveMediaUrl } from '../lib/api';
import { confirmAction } from '../lib/feedback';
import type { Friendship, User } from '../types';

type FriendsPageProps = {
  user: User;
};

function FriendsPage({ user }: FriendsPageProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'all' | 'requests'>('all');
  const [friends, setFriends] = useState<Friendship[]>([]);
  const [requests, setRequests] = useState<Friendship[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [fList, reqList] = await Promise.all([
        api.getFriends(user.id),
        api.getPendingFriendRequests(user.id),
      ]);
      setFriends(fList);
      setRequests(reqList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleUnfriend = async (friendshipId: number) => {
    if (!await confirmAction('Bạn có chắc muốn hủy kết bạn?', { title: 'Hủy kết bạn', confirmLabel: 'Hủy kết bạn', danger: true })) return;
    setError('');
    try {
      await api.unfriend(friendshipId, user.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không hủy kết bạn được');
    }
  };

  const handleAccept = async (friendshipId: number) => {
    setError('');
    try {
      await api.acceptFriendRequest(friendshipId, user.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không chấp nhận được');
    }
  };

  const handleReject = async (friendshipId: number) => {
    setError('');
    try {
      await api.rejectOrCancelFriendRequest(friendshipId, user.id);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không từ chối được');
    }
  };

  const getFriendUser = (f: Friendship) => {
    const isRequester = f.requesterId === user.id;
    return {
      friendshipId: f.id,
      id: isRequester ? f.addresseeId : f.requesterId,
      name: isRequester ? f.addresseeName : f.requesterName,
      avatar: isRequester ? f.addresseeAvatar : f.requesterAvatar,
    };
  };

  const filteredFriends = friends
    .map(getFriendUser)
    .filter((f) => f.name.toLowerCase().includes(search.trim().toLowerCase()));

  const renderAvatar = (avatar: string | null | undefined, name: string) => (
    avatar ? <img src={resolveMediaUrl(avatar)} alt={name} /> : name.charAt(0).toUpperCase()
  );

  return (
    <div className="friends-page">
      <div className="friends-header">
        <div>
          <span className="eyebrow">Kết nối</span>
          <h1 className="section-title">Bạn bè</h1>
          <p className="friends-subtitle">Quản lý danh sách bạn bè và các lời mời đang chờ phản hồi.</p>
        </div>
        <div className="friends-tabs" role="tablist" aria-label="Bộ lọc bạn bè">
          <button
            type="button"
            className={tab === 'all' ? 'friends-tab active' : 'friends-tab'}
            onClick={() => setTab('all')}
          >
            Tất cả bạn bè <span>{friends.length}</span>
          </button>
          <button
            type="button"
            className={tab === 'requests' ? 'friends-tab active' : 'friends-tab'}
            onClick={() => setTab('requests')}
          >
            Lời mời <span>{requests.length}</span>
          </button>
        </div>
      </div>

      <div className="friends-summary">
        <section className="friends-stat">
          <span>Bạn bè</span>
          <strong>{friends.length}</strong>
        </section>
        <section className="friends-stat">
          <span>Lời mời đang chờ</span>
          <strong>{requests.length}</strong>
        </section>
      </div>

      {error && <div className="form-error">{error}</div>}

      {tab === 'all' && (
        <section className="friends-panel">
          <div className="friends-panel-head">
            <div>
              <span className="eyebrow">Danh sách</span>
              <h2>Bạn bè của bạn</h2>
            </div>
            <div className="friends-search-wrap">
              <input
                className="friends-search"
                placeholder="Tìm bạn bè..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div className="friends-loading">Đang tải danh sách bạn bè...</div>
          ) : filteredFriends.length === 0 ? (
            <div className="friends-empty">
              <h3>{search ? 'Không tìm thấy bạn bè' : 'Chưa có bạn bè nào'}</h3>
              <p>{search ? 'Thử tìm bằng tên khác.' : 'Khi có bạn bè, danh sách sẽ hiển thị tại đây.'}</p>
            </div>
          ) : (
            <div className="friends-grid">
              {filteredFriends.map((f) => (
                <div className="friend-card" key={f.id}>
                  <Link to={`/users/${f.id}`} className="friend-card-info">
                    <div className="friend-card-avatar">{renderAvatar(f.avatar, f.name)}</div>
                    <div>
                      <div className="friend-card-name">{f.name}</div>
                      <span className="friend-card-meta">Bạn bè</span>
                    </div>
                  </Link>
                  <div className="friend-card-actions">
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => navigate(`/users/${f.id}`)}>
                      Xem hồ sơ
                    </button>
                    <button className="btn btn-danger btn-sm" type="button" onClick={() => handleUnfriend(f.friendshipId)}>
                      Hủy kết bạn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === 'requests' && (
        <section className="friends-panel">
          <div className="friends-panel-head">
            <div>
              <span className="eyebrow">Lời mời</span>
              <h2>Đang chờ phản hồi</h2>
            </div>
          </div>

          {loading ? (
            <div className="friends-loading">Đang tải lời mời kết bạn...</div>
          ) : requests.length === 0 ? (
            <div className="friends-empty">
              <h3>Không có lời mời kết bạn</h3>
              <p>Các lời mời mới sẽ xuất hiện ở khu vực này.</p>
            </div>
          ) : (
            <div className="friend-request-list">
              {requests.map((req) => (
                <div className="friend-request-card" key={req.id}>
                  <Link to={`/users/${req.requesterId}`} className="friend-card-info">
                    <div className="friend-card-avatar">{renderAvatar(req.requesterAvatar, req.requesterName)}</div>
                    <div>
                      <div className="friend-card-name">{req.requesterName}</div>
                      <span className="friend-card-meta">Muốn kết bạn với bạn</span>
                    </div>
                  </Link>
                  <div className="friend-card-actions">
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => handleAccept(req.id)}>
                      Chấp nhận
                    </button>
                    <button className="btn btn-secondary btn-sm" type="button" onClick={() => handleReject(req.id)}>
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default FriendsPage;
