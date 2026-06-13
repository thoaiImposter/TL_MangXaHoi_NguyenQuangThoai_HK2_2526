import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
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
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="friends-page">
      <div className="friends-header">
        <div>
          <span className="eyebrow">Quản lý</span>
          <h1 className="section-title">Bạn bè</h1>
        </div>
        <div className="friends-tabs">
          <button
            type="button"
            className={tab === 'all' ? 'chip chip-solid' : 'chip'}
            onClick={() => setTab('all')}
          >
            Tất cả bạn bè {friends.length > 0 && `(${friends.length})`}
          </button>
          <button
            type="button"
            className={tab === 'requests' ? 'chip chip-solid' : 'chip'}
            onClick={() => setTab('requests')}
          >
            Lời mời {requests.length > 0 && `(${requests.length})`}
          </button>
        </div>
      </div>

      {error && <div className="form-error">{error}</div>}

      {tab === 'all' && (
        <>
          <div className="friends-search-wrap">
            <input
              className="friends-search"
              placeholder="Tìm bạn bè..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div className="subtle">Đang tải...</div>
          ) : filteredFriends.length === 0 ? (
            <div className="subtle">{search ? 'Không tìm thấy bạn bè.' : 'Chưa có bạn bè nào.'}</div>
          ) : (
            <div className="friends-grid">
              {filteredFriends.map((f) => (
                <div className="friend-card" key={f.id}>
                  <Link to={`/users/${f.id}`} className="friend-card-info">
                    <div className="friend-card-avatar">
                      {f.avatar ? <img src={f.avatar} alt={f.name} /> : f.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="friend-card-name">{f.name}</div>
                  </Link>
                  <div className="friend-card-actions">
                    <button
                      className="chip"
                      type="button"
                      onClick={() => navigate(`/users/${f.id}`)}
                    >
                      Xem hồ sơ
                    </button>
                    <button
                      className="chip danger-chip"
                      type="button"
                      onClick={() => handleUnfriend(f.friendshipId)}
                    >
                      Hủy kết bạn
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'requests' && (
        <>
          {loading ? (
            <div className="subtle">Đang tải...</div>
          ) : requests.length === 0 ? (
            <div className="subtle">Không có lời mời kết bạn nào.</div>
          ) : (
            <div className="friends-grid">
              {requests.map((req) => (
                <div className="friend-card" key={req.id}>
                  <Link to={`/users/${req.requesterId}`} className="friend-card-info">
                    <div className="friend-card-avatar">
                      {req.requesterAvatar ? (
                        <img src={req.requesterAvatar} alt={req.requesterName} />
                      ) : (
                        req.requesterName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="friend-card-name">{req.requesterName}</div>
                  </Link>
                  <div className="friend-card-actions">
                    <button
                      className="chip chip-solid"
                      type="button"
                      onClick={() => handleAccept(req.id)}
                    >
                      Chấp nhận
                    </button>
                    <button
                      className="chip"
                      type="button"
                      onClick={() => handleReject(req.id)}
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default FriendsPage;
