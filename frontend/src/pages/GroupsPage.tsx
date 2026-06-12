import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import PostComposer from '../components/PostComposer';
import type { Group, UserRole } from '../types';

export default function GroupsPage() {
  const navigate = useNavigate();

  const getUser = () => {
    const stored = localStorage.getItem('social_user');
    return stored ? JSON.parse(stored) : null;
  };

  const user = getUser();
  const userId = user?.id || 0;
  const userRole: UserRole = user?.role || 'student';
  const isFacultyUnion = userRole === 'faculty_union';
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [groups, setGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    privacy: 'public' as 'public' | 'private',
    approvalRequired: false,
  });
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');

  useEffect(() => {
    if (activeTab === 'discover') {
      loadPublicGroups();
    } else {
      loadMyGroups();
    }
  }, [activeTab]);

  const loadPublicGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getPublicGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to load public groups:', error);
    }
    setLoading(false);
  };

  const loadMyGroups = async () => {
    setLoading(true);
    try {
      const data = await api.getMyGroups(userId);
      setGroups(data);
    } catch (error) {
      console.error('Failed to load my groups:', error);
    }
    setLoading(false);
  };

  const isMemberOfGroup = (groupId: number, myGroups: Group[]): boolean => {
    return myGroups.some(g => g.id === groupId);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPublicGroups();
      return;
    }
    setLoading(true);
    try {
      const data = await api.searchGroups(searchQuery);
      setGroups(data);
    } catch (error) {
      console.error('Failed to search groups:', error);
    }
    setLoading(false);
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId || userId <= 0) {
      alert('Vui lòng đăng nhập để tạo nhóm.');
      navigate('/login');
      return;
    }

    setCreating(true);
    try {
      // Step 1: Create the group (existing flow)
      const group = await api.createGroup(userId, newGroup);

      // Step 2: If Excel file was uploaded (Đoàn khoa), create a group post with the file
      if (excelFile && isFacultyUnion) {
        try {
          // Upload the Excel file to backend
          const uploadResult = await api.uploadFile(excelFile, 'file');
          // Create a group post with the uploaded Excel as attachment
          await api.createGroupPost(group.id, userId, {
            content: `📋 Danh sách sinh viên lớp ${group.name} - Xem file Excel đính kèm để biết chi tiết.`,
            media: [{
              url: uploadResult.mediaUrl,
              type: 'file',
              name: uploadResult.mediaName,
              size: uploadResult.mediaSize,
            }],
          });
        } catch (postError) {
          console.error('Failed to create Excel post:', postError);
          // Group was created successfully, post failure is non-critical
          alert('Nhóm đã tạo nhưng không thể đăng bài viết Excel. Vui lòng thử đăng lại sau.');
        }
      }

      setShowCreateModal(false);
      setNewGroup({ name: '', description: '', privacy: 'public', approvalRequired: false });
      setExcelFile(null);
      navigate(`/groups/${group.id}`);
    } catch (error: any) {
      console.error('Failed to create group:', error);
      const errorMessage = error?.message || 'Không thể tạo nhóm. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      const result = await api.joinGroup(groupId, userId);
      if ('message' in result) {
        alert(result.message);
      } else {
        alert('Đã tham gia nhóm thành công!');
        loadPublicGroups();
      }
    } catch (error) {
      console.error('Failed to join group:', error);
      alert('Không thể tham gia nhóm. Vui lòng thử lại.');
    }
  };

  return (
    <div className="groups-page page-content">
      <div className="groups-header">
        <h1 className="groups-title">👥 Nhóm</h1>
        <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
          + Tạo nhóm mới
        </button>
      </div>

      {/* Tabs */}
      <div className="groups-tabs">
        <button
          className={`group-tab ${activeTab === 'discover' ? 'active' : ''}`}
          onClick={() => setActiveTab('discover')}
        >
          Khám phá
        </button>
        <button
          className={`group-tab ${activeTab === 'my-groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-groups')}
        >
          Nhóm của tôi
        </button>
      </div>

      {/* Broadcast button - only for Đoàn khoa in "my groups" tab */}
      {activeTab === 'my-groups' && isFacultyUnion && (
        <button
          className="btn btn-primary"
          onClick={() => { setBroadcastSuccess(''); setShowBroadcastModal(true); }}
          style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', border: 'none' }}
        >
          📢 Gửi thông báo đến các nhóm
        </button>
      )}

      {/* Search */}
      {activeTab === 'discover' && (
        <div className="groups-search">
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>
            Tìm kiếm
          </button>
        </div>
      )}

      {/* Groups List */}
      {loading ? (
        <div className="card" style={{ padding: 'var(--spacing-2xl)', textAlign: 'center' }}>
          <span className="spinner" style={{ width: '32px', height: '32px', borderWidth: '3px' }}></span>
          <p className="text-muted mt-md">Đang tải...</p>
        </div>
      ) : groups.length === 0 ? (
        <div className="empty-state card">
          <div className="empty-state-icon">🔍</div>
          <h3 className="empty-state-title">
            {activeTab === 'discover' ? 'Không tìm thấy nhóm nào' : 'Bạn chưa tham gia nhóm nào'}
          </h3>
          <p className="empty-state-text">
            {activeTab === 'discover'
              ? 'Thử tìm kiếm với từ khóa khác hoặc tạo nhóm mới.'
              : 'Khám phá và tham gia các nhóm phù hợp với sở thích của bạn.'}
          </p>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div key={group.id} className="group-card">
              <div className="group-avatar">
                {group.avatar ? (
                  <img src={group.avatar} alt={group.name} />
                ) : (
                  '👥'
                )}
              </div>
              <div className="group-info">
                <div className="group-name">
                  {group.name}
                  {group.privacy === 'private' && (
                    <span className="group-privacy">🔒 Riêng tư</span>
                  )}
                </div>
                <p className="group-description">
                  {group.description || 'Không có mô tả'}
                </p>
                <p className="group-meta">
                  {group.memberCount} thành viên • Tạo bởi {group.creatorName}
                  {group.approvalRequired && ' • Cần phê duyệt'}
                </p>
              </div>
              <div className="group-actions">
                {activeTab === 'discover' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleJoinGroup(group.id)}
                  >
                    Tham gia
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  Xem
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Tạo nhóm mới</h2>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>

            <form className="modal-body" onSubmit={handleCreateGroup}>
              {/* Excel Import - only for Đoàn khoa */}
              {isFacultyUnion && (
                <div className="form-group" style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
                  border: '2px dashed var(--primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 'var(--spacing-md)',
                }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '20px' }}>📄</span>
                    <span>Import Excel danh sách sinh viên</span>
                  </label>
                  <p style={{ fontSize: '12px', color: 'var(--gray-500)', margin: '0 0 8px 0' }}>
                    File Excel sẽ được đính kèm vào bài viết đầu tiên của nhóm
                  </p>
                  {excelFile ? (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 12px',
                      background: 'white',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--gray-200)',
                    }}>
                      <span style={{ fontSize: '24px' }}>📊</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {excelFile.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--gray-500)' }}>
                          {(excelFile.size / 1024).toFixed(1)} KB
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExcelFile(null)}
                        style={{
                          background: 'none', border: 'none', color: 'var(--gray-400)',
                          cursor: 'pointer', fontSize: '18px', padding: '4px',
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px',
                      background: 'white',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--gray-200)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      color: 'var(--primary)',
                      fontWeight: '600',
                    }}>
                      <span>📁 Chọn file Excel (.xlsx, .xls)</span>
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.size > 10 * 1024 * 1024) {
                              alert('File Excel không được vượt quá 10MB');
                              return;
                            }
                            setExcelFile(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Tên nhóm *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập tên nhóm"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea
                  className="form-input form-textarea"
                  placeholder="Mô tả ngắn về nhóm của bạn"
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Chế độ riêng tư</label>
                <select
                  className="form-input"
                  value={newGroup.privacy}
                  onChange={(e) => setNewGroup({ ...newGroup, privacy: e.target.value as 'public' | 'private' })}
                >
                  <option value="public">🌍 Công khai - Ai cũng có thể xem và tham gia</option>
                  <option value="private">🔒 Riêng tư - Chỉ thành viên mới xem được</option>
                </select>
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newGroup.approvalRequired}
                    onChange={(e) => setNewGroup({ ...newGroup, approvalRequired: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--gray-700)' }}>Bật phê duyệt thành viên mới</span>
                </label>
              </div>
            </form>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)} disabled={creating}>
                Hủy
              </button>
              <button className="btn btn-primary" onClick={handleCreateGroup} disabled={creating}>
                {creating ? (
                  <>
                    <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                    Đang tạo...
                  </>
                ) : (
                  'Tạo nhóm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="modal-backdrop" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  📢 Gửi thông báo
                </p>
                <h2 className="modal-title">Đăng bài viết đến nhiều nhóm</h2>
              </div>
              <button className="modal-close" onClick={() => setShowBroadcastModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {broadcastSuccess && (
                <div className="alert alert-success" style={{ marginBottom: '12px' }}>{broadcastSuccess}</div>
              )}
              {groups.length === 0 ? (
                <p className="text-muted">Bạn chưa có nhóm nào để gửi thông báo.</p>
              ) : (
                <PostComposer
                  key="broadcast"
                  user={user}
                  mode="broadcast"
                  broadcastGroups={groups}
                  onSuccess={() => {
                    setBroadcastSuccess('Đã gửi thông báo đến các nhóm đã chọn thành công!');
                    setTimeout(() => setShowBroadcastModal(false), 2000);
                  }}
                  onClose={() => setShowBroadcastModal(false)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}