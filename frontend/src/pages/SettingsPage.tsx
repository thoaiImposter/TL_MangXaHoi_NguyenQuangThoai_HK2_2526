import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User } from '../types';

type SettingsPageProps = {
  user: User;
  onUpdateUser: (user: User) => void;
};

function SettingsPage({ user, onUpdateUser }: SettingsPageProps) {
  const navigate = useNavigate();
  const [avatarPreview, setAvatarPreview] = useState(user.avatar ?? '');
  const [coverPreview, setCoverPreview] = useState(user.cover ?? '');
  const [form, setForm] = useState({
    fullName: user.fullName,
    avatar: user.avatar ?? '',
    cover: user.cover ?? '',
    bio: user.bio ?? '',
    faculty: user.faculty ?? '',
    className: user.className ?? '',
    academicYear: user.academicYear ?? '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAvatarPreview(user.avatar ?? '');
    setCoverPreview(user.cover ?? '');
    setForm({
      fullName: user.fullName,
      avatar: user.avatar ?? '',
      cover: user.cover ?? '',
      bio: user.bio ?? '',
      faculty: user.faculty ?? '',
      className: user.className ?? '',
      academicYear: user.academicYear ?? '',
    });
  }, [user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const updated = await api.updateProfile(user.id, form);
      onUpdateUser(updated);
      setAvatarPreview(updated.avatar ?? '');
      setMessage('Đã lưu thông tin cá nhân.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-shell">
      <div className="card" style={{ padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
        <div className="flex gap-lg items-center mb-lg">
          <div className="post-avatar" style={{ width: '100px', height: '100px' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt={user.fullName} />
            ) : (
              <div className="post-avatar-placeholder" style={{ fontSize: '36px' }}>
                {user.fullName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--gray-900)', marginBottom: '4px' }}>
              Cài đặt tài khoản
            </h1>
            <p className="text-muted">Quản lý thông tin cá nhân và cài đặt tài khoản</p>
          </div>
        </div>

        <div className="flex gap-sm mb-lg" style={{ flexWrap: 'wrap' }}>
          <span className="chip">
            <span style={{ color: '#22c55e' }}>●</span> Active
          </span>
          <span className="chip">User #{user.id}</span>
          <span className="chip">{user.email}</span>
        </div>

        <form onSubmit={submit}>
          {/* Avatar and Cover Upload */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Ảnh đại diện</label>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar preview" style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', color: 'var(--gray-500)' }}>
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const value = String(reader.result ?? '');
                    setAvatarPreview(value);
                    setForm((current) => ({ ...current, avatar: value }));
                  };
                  reader.readAsDataURL(file);
                }}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ảnh bìa</label>
              <div style={{ marginBottom: 'var(--spacing-sm)' }}>
                {coverPreview ? (
                  <img src={coverPreview} alt="Cover preview" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: 'var(--radius-md)' }} />
                ) : (
                  <div style={{ width: '100%', height: '100px', background: 'var(--gray-200)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
                    Chưa có ảnh bìa
                  </div>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="form-input"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = () => {
                    const value = String(reader.result ?? '');
                    setCoverPreview(value);
                    setForm((current) => ({ ...current, cover: value }));
                  };
                  reader.readAsDataURL(file);
                }}
                disabled={loading}
              />
            </div>
          </div>

          {/* Full Name */}
          <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
            <label className="form-label">Họ và tên</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                👤
              </span>
              <input
                type="text"
                className="form-input"
                placeholder="Nguyễn Văn A"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                required
                style={{ paddingLeft: '48px' }}
                disabled={loading}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
            <div className="form-group">
              <label className="form-label">Khoa</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                  🎓
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Công nghệ Thông tin"
                  value={form.faculty}
                  onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                  disabled={loading}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Lớp</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                  📚
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="CNTT01"
                  value={form.className}
                  onChange={(e) => setForm({ ...form, className: e.target.value })}
                  disabled={loading}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Niên khóa</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '18px' }}>
                  📅
                </span>
                <input
                  type="text"
                  className="form-input"
                  placeholder="2021-2025"
                  value={form.academicYear}
                  onChange={(e) => setForm({ ...form, academicYear: e.target.value })}
                  disabled={loading}
                  style={{ paddingLeft: '48px' }}
                />
              </div>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label className="form-label">Bio (Giới thiệu)</label>
            <textarea
              className="form-input form-textarea"
              rows={4}
              placeholder="Viết vài dòng về bản thân bạn..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              disabled={loading}
            />
            {form.bio && (
              <span className="text-muted text-sm">
                {form.bio.length}/500 ký tự
              </span>
            )}
          </div>

          {message && (
            <div className="alert alert-success mb-lg">
              <span>✅</span>
              {message}
            </div>
          )}

          {error && (
            <div className="alert alert-error mb-lg">
              <span>⚠️</span>
              {error}
            </div>
          )}

          <div className="flex justify-between items-center">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(-1)}
              disabled={loading}
            >
              ← Quay lại
            </button>
            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></span>
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;