import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { User, BlockedUser } from '../types';

type PrivacyPageProps = {
  user: User;
  onUpdateUser: (user: User) => void;
};

function PrivacyPage({ user, onUpdateUser }: PrivacyPageProps) {
  const navigate = useNavigate();
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [protection, setProtection] = useState(Boolean(user.accountProtection));
  const [pwdForm, setPwdForm] = useState({ old: '', new: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadBlocked, setLoadBlocked] = useState(false);

  useEffect(() => {
    setProtection(Boolean(user.accountProtection));
  }, [user.accountProtection]);

  useEffect(() => {
    loadList();
  }, [user.id]);

  const loadList = async () => {
    setLoadBlocked(true);
    try {
      const data = await api.getBlockedList(user.id);
      setBlocked(data);
    } catch {
      // ignore
    } finally {
      setLoadBlocked(false);
    }
  };

  const toggleProtection = async () => {
    try {
      const updated = await api.toggleProtection(user.id);
      onUpdateUser(updated);
      setMsg(updated.accountProtection ? 'Bảo vệ tài khoản đã bật.' : 'Bảo vệ tài khoản đã tắt.');
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi');
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (pwdForm.new !== pwdForm.confirm) {
      setErr('Mật khẩu xác nhận không khớp.');
      return;
    }
    setLoading(true);
    try {
      await api.changePassword(user.id, { oldPassword: pwdForm.old, newPassword: pwdForm.new });
      setMsg('Đổi mật khẩu thành công.');
      setPwdForm({ old: '', new: '', confirm: '' });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Đổi mật khẩu thất bại.');
    } finally {
      setLoading(false);
    }
  };

  const unblock = async (blockedId: number) => {
    try {
      await api.unblockUser(user.id, blockedId);
      await loadList();
      setMsg('Đã gỡ chặn.');
      setErr('');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Lỗi gỡ chặn.');
    }
  };

  const initials = (name: string) => (name?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <div className="profile-shell">
      <aside className="stack">
        <section className="profile-hero">
          <div className="hero-row">
            <div className="avatar-preview">
              {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : initials(user.fullName)}
            </div>
            <div className="mini-badges">
              <span className="badge">User ID #{user.id}</span>
              <span className="badge">Riêng tư</span>
            </div>
          </div>
          <div>
            <span className="eyebrow">Tài khoản</span>
            <h1>{user.fullName}</h1>
            <p className="subtle">{user.email}</p>
          </div>
          <p className="lead">Quản lý riêng tư, danh sách chặn và bảo mật tài khoản.</p>
        </section>
      </aside>

      <section className="panel stack">
        <div className="profile-head">
          <div>
            <span className="eyebrow">Bảo mật</span>
            <h1>Riêng tư & Bảo vệ</h1>
          </div>
        </div>

        {msg && <div className="form-success">{msg}</div>}
        {err && <div className="form-error">{err}</div>}

        <div className="privacy-section">
          <h3>Bảo vệ tài khoản</h3>
          <p className="subtle">
            Khi bật, bài viết của bạn sẽ ẩn khỏi ngườI lạ và chỉ bạn bè mới có thể nhắn tin.
          </p>
          <div className="toolbar" style={{ marginTop: 8 }}>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={protection}
                onChange={toggleProtection}
              />
              <span className="toggle-slider" />
              <span className="toggle-label">{protection ? 'Đang bật' : 'Đang tắt'}</span>
            </label>
          </div>
        </div>

        <div className="privacy-section">
          <h3>Danh sách chặn</h3>
          {loadBlocked ? (
            <div className="subtle">Đang tải...</div>
          ) : blocked.length === 0 ? (
            <div className="subtle">Bạn chưa chặn ai.</div>
          ) : (
            <div className="blocked-list">
              {blocked.map((b) => (
                <div key={b.id} className="blocked-row">
                  <div className="blocked-avatar">
                    {b.avatar ? <img src={b.avatar} alt={b.fullName} /> : initials(b.fullName)}
                  </div>
                  <div className="blocked-info">
                    <strong>{b.fullName}</strong>
                    <span className="subtle">ID #{b.id}</span>
                  </div>
                  <button className="danger-button" type="button" onClick={() => unblock(b.id)}>
                    Gỡ chặn
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="privacy-section">
          <h3>Đổi mật khẩu</h3>
          <form className="profile-form" onSubmit={submitPassword}>
            <div className="summary-grid">
              <div className="summary-card">
                <strong>Mật khẩu cũ</strong>
                <input
                  type="password"
                  value={pwdForm.old}
                  onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })}
                  required
                />
              </div>
              <div className="summary-card">
                <strong>Mật khẩu mới</strong>
                <input
                  type="password"
                  value={pwdForm.new}
                  onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })}
                  required
                />
              </div>
              <div className="summary-card">
                <strong>Xác nhận mới</strong>
                <input
                  type="password"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="toolbar" style={{ marginTop: 12 }}>
              <button className="primary-button" type="submit" disabled={loading}>
                {loading ? 'Đang lưu...' : 'Đổi mật khẩu'}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}

export default PrivacyPage;
