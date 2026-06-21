import { useRef, useState } from 'react';
import { resolveMediaUrl } from '../lib/api';

type ProfileImagePickerProps = {
  avatarUrl: string;
  coverUrl: string;
  name: string;
  onAvatarSelect: (file: File) => Promise<void>;
  onCoverSelect: (file: File) => Promise<void>;
  onAvatarRemove: () => void;
  onCoverRemove: () => void;
  uploadingAvatar?: boolean;
  uploadingCover?: boolean;
  disabled?: boolean;
};

export default function ProfileImagePicker({
  avatarUrl,
  coverUrl,
  name,
  onAvatarSelect,
  onCoverSelect,
  onAvatarRemove,
  onCoverRemove,
  uploadingAvatar = false,
  uploadingCover = false,
  disabled = false,
}: ProfileImagePickerProps) {
  const avatarInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const [localAvatarPreview, setLocalAvatarPreview] = useState('');
  const [localCoverPreview, setLocalCoverPreview] = useState('');
  const initials = name.trim().charAt(0).toUpperCase() || 'U';
  const displayedAvatar = localAvatarPreview || avatarUrl;
  const displayedCover = localCoverPreview || coverUrl;

  const selectFile = async (
    file: File | undefined,
    handler: (file: File) => Promise<void>,
    setPreview: (url: string) => void,
  ) => {
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    try {
      await handler(file);
    } finally {
      setPreview('');
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <section className="profile-image-picker">
      <div className="profile-image-cover">
        {displayedCover ? <img src={resolveMediaUrl(displayedCover)} alt="Xem trước ảnh bìa" /> : <div className="profile-image-cover-empty">Ảnh bìa của bạn</div>}
        <div className="profile-image-cover-actions">
          <button type="button" className="profile-image-action" onClick={() => coverInput.current?.click()} disabled={disabled || uploadingCover}>
            {uploadingCover ? 'Đang tải...' : displayedCover ? 'Đổi ảnh bìa' : 'Thêm ảnh bìa'}
          </button>
          {displayedCover && !uploadingCover && <button type="button" className="profile-image-action danger" onClick={onCoverRemove} disabled={disabled}>Xóa</button>}
        </div>
      </div>

      <div className="profile-image-avatar-row">
        <div className="profile-image-avatar">
          {displayedAvatar ? <img src={resolveMediaUrl(displayedAvatar)} alt="Xem trước ảnh đại diện" /> : <span>{initials}</span>}
          <button type="button" className="profile-image-camera" title="Chọn ảnh đại diện" onClick={() => avatarInput.current?.click()} disabled={disabled || uploadingAvatar}>
            {uploadingAvatar ? '…' : '📷'}
          </button>
        </div>
        <div className="profile-image-copy">
          <strong>{name.trim() || 'Ảnh hồ sơ của bạn'}</strong>
          <span>Ảnh đại diện nên là ảnh vuông. Ảnh bìa nên có tỷ lệ ngang.</span>
          <div className="profile-image-inline-actions">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => avatarInput.current?.click()} disabled={disabled || uploadingAvatar}>
              {uploadingAvatar ? 'Đang tải...' : displayedAvatar ? 'Đổi ảnh đại diện' : 'Thêm ảnh đại diện'}
            </button>
            {displayedAvatar && !uploadingAvatar && <button type="button" className="btn btn-ghost btn-sm" onClick={onAvatarRemove} disabled={disabled}>Xóa</button>}
          </div>
        </div>
      </div>

      <input ref={avatarInput} type="file" accept="image/*" hidden onChange={async (event) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        await selectFile(file, onAvatarSelect, setLocalAvatarPreview);
        input.value = '';
      }} />
      <input ref={coverInput} type="file" accept="image/*" hidden onChange={async (event) => {
        const input = event.currentTarget;
        const file = input.files?.[0];
        await selectFile(file, onCoverSelect, setLocalCoverPreview);
        input.value = '';
      }} />
    </section>
  );
}
