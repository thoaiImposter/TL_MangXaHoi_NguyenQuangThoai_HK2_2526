import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { uploadFileUrl } from '../lib/upload';
import { hasAcademicTitle, hasFaculty, hasStudentDetails, ROLE_LABELS } from '../lib/userRole';
import { ACADEMIC_TITLE_OPTIONS, ACADEMIC_YEAR_OPTIONS, campusLabel } from '../lib/academicCatalog';
import SearchableSelect from '../components/SearchableSelect';
import ProfileImagePicker from '../components/ProfileImagePicker';
import type { Faculty, Major, User } from '../types';

type SettingsPageProps = {
  user: User;
  onUpdateUser: (user: User) => void;
};

function SettingsPage({ user, onUpdateUser }: SettingsPageProps) {
  const navigate = useNavigate();
  const [avatarPreview, setAvatarPreview] = useState(user.avatar ?? '');
  const [coverPreview, setCoverPreview] = useState(user.cover ?? '');
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [form, setForm] = useState({
    fullName: user.fullName,
    avatar: user.avatar ?? '',
    cover: user.cover ?? '',
    bio: user.bio ?? '',
    facultyId: '',
    faculty: user.faculty ?? '',
    className: user.className ?? '',
    academicYear: user.academicYear ?? '',
    academicTitle: user.academicTitle ?? '',
    majorId: user.majorId ? String(user.majorId) : '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  useEffect(() => {
    api.getFaculties().then(setFaculties).catch(() => setError('Không tải được danh sách khoa'));
    api.getMajors().then(setMajors).catch(() => setError('Không tải được danh sách ngành đào tạo'));
  }, []);

  useEffect(() => {
    const faculty = faculties.find((item) => item.name === user.faculty);
    if (faculty) setForm((current) => ({ ...current, facultyId: String(faculty.id), faculty: faculty.name }));
  }, [faculties, user.faculty]);

  const filteredMajors = majors.filter((major) => major.facultyId === Number(form.facultyId));

  useEffect(() => {
    setAvatarPreview(user.avatar ?? '');
    setCoverPreview(user.cover ?? '');
    setForm({
      fullName: user.fullName,
      avatar: user.avatar ?? '',
      cover: user.cover ?? '',
      bio: user.bio ?? '',
      facultyId: '',
      faculty: user.faculty ?? '',
      className: user.className ?? '',
      academicYear: user.academicYear ?? '',
      academicTitle: user.academicTitle ?? '',
      majorId: user.majorId ? String(user.majorId) : '',
    });
  }, [user]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const updated = await api.updateProfile(user.id, {
        fullName: form.fullName,
        avatar: form.avatar,
        cover: form.cover,
        bio: form.bio,
        faculty: hasFaculty(user.role) ? form.faculty : '',
        facultyId: hasFaculty(user.role) && form.facultyId ? Number(form.facultyId) : null,
        className: hasStudentDetails(user.role) ? form.className : '',
        academicYear: hasStudentDetails(user.role) ? form.academicYear : '',
        academicTitle: hasAcademicTitle(user.role) ? form.academicTitle : '',
        majorId: hasStudentDetails(user.role) && form.majorId ? Number(form.majorId) : null,
      });
      onUpdateUser(updated);
      setAvatarPreview(updated.avatar ?? '');
      setMessage('Đã lưu thông tin cá nhân.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không lưu được hồ sơ');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingAvatar(true);
    setError('');
    setMessage('');
    try {
      const avatarUrl = await uploadFileUrl(file, 'avatars');
      const updated = await api.updateProfile(user.id, { avatar: avatarUrl });
      onUpdateUser(updated);
      setAvatarPreview(updated.avatar ?? '');
      setForm((current) => ({ ...current, avatar: updated.avatar ?? '' }));
      setMessage('Đã cập nhật ảnh đại diện.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được ảnh đại diện');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCoverUpload = async (file: File | null) => {
    if (!file) return;
    setUploadingCover(true);
    setError('');
    setMessage('');
    try {
      const coverUrl = await uploadFileUrl(file, 'covers');
      const updated = await api.updateProfile(user.id, { cover: coverUrl });
      onUpdateUser(updated);
      setCoverPreview(updated.cover ?? '');
      setForm((current) => ({ ...current, cover: updated.cover ?? '' }));
      setMessage('Đã cập nhật ảnh bìa.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không cập nhật được ảnh bìa');
    } finally {
      setUploadingCover(false);
    }
  };

  const removeProfileImage = async (type: 'avatar' | 'cover') => {
    setError('');
    setMessage('');
    try {
      const updated = await api.updateProfile(user.id, { [type]: '' });
      onUpdateUser(updated);
      if (type === 'avatar') {
        setAvatarPreview('');
        setForm((current) => ({ ...current, avatar: '' }));
      } else {
        setCoverPreview('');
        setForm((current) => ({ ...current, cover: '' }));
      }
      setMessage(type === 'avatar' ? 'Đã xóa ảnh đại diện.' : 'Đã xóa ảnh bìa.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không xóa được ảnh');
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
          <span className="chip">{ROLE_LABELS[user.role]}</span>
        </div>

        <form onSubmit={submit}>
          <ProfileImagePicker
            avatarUrl={avatarPreview}
            coverUrl={coverPreview}
            name={form.fullName}
            uploadingAvatar={uploadingAvatar}
            uploadingCover={uploadingCover}
            disabled={loading}
            onAvatarSelect={async (file) => handleAvatarUpload(file)}
            onCoverSelect={async (file) => handleCoverUpload(file)}
            onAvatarRemove={() => void removeProfileImage('avatar')}
            onCoverRemove={() => void removeProfileImage('cover')}
          />

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

          {user.role !== 'school_union' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
              {hasFaculty(user.role) && (
                <div className="form-group">
                  <label className="form-label">{user.role === 'faculty_union' ? 'Khoa quản lý' : 'Khoa'}</label>
                  <SearchableSelect
                    value={form.facultyId}
                    options={faculties.map((faculty) => ({ value: String(faculty.id), label: faculty.name, keywords: faculty.code }))}
                    onChange={(facultyId) => {
                      const faculty = faculties.find((item) => String(item.id) === facultyId);
                      setForm({ ...form, facultyId, faculty: faculty?.name ?? '', majorId: '' });
                    }}
                    placeholder="Chọn khoa"
                    disabled={loading}
                    required
                  />
                </div>
              )}

                {hasStudentDetails(user.role) && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Ngành đào tạo</label>
                      <SearchableSelect
                        value={form.majorId}
                        options={filteredMajors.map((major) => ({
                          value: String(major.id),
                          label: `${major.name} (${major.code}) - ${campusLabel(major.campus)}`,
                          keywords: `${major.code} ${major.name}`,
                        }))}
                        onChange={(majorId) => setForm({ ...form, majorId })}
                        placeholder={form.facultyId ? 'Chọn ngành đào tạo' : 'Chọn khoa trước'}
                        disabled={loading || !form.facultyId}
                        required
                      />
                    </div>
                  <div className="form-group">
                    <label className="form-label">Lớp</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="CNTT01"
                      value={form.className}
                      onChange={(e) => setForm({ ...form, className: e.target.value })}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Niên khóa</label>
                    <SearchableSelect
                      value={form.academicYear}
                      options={ACADEMIC_YEAR_OPTIONS.map((year) => ({ value: year, label: year }))}
                      onChange={(academicYear) => setForm({ ...form, academicYear })}
                      placeholder="Chọn niên khóa"
                      disabled={loading}
                      required
                    />
                  </div>
                </>
              )}

              {hasAcademicTitle(user.role) && (
                <div className="form-group">
                  <label className="form-label">Học vị</label>
                  <SearchableSelect
                    value={form.academicTitle}
                    options={ACADEMIC_TITLE_OPTIONS.map((title) => ({ value: title, label: title }))}
                    onChange={(academicTitle) => setForm({ ...form, academicTitle })}
                    placeholder="Chọn học vị"
                    disabled={loading}
                    required
                  />
                </div>
              )}
            </div>
          )}

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
