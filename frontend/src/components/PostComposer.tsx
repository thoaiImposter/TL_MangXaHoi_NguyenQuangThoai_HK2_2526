import { useState } from 'react';
import { api } from '../lib/api';
import type { User, Group } from '../types';

export type PostComposerMode = 'regular' | 'group' | 'broadcast';

export type PostComposerMedia = { url: string; type: string; name?: string; size?: number };

export type PostComposerProps = {
  user: User;
  mode?: PostComposerMode;
  /** Called after successful post. Parent should refresh data. */
  onSuccess?: () => void;
  /** For group mode */
  groupId?: number;
  /** For broadcast mode: groups the user can broadcast to */
  broadcastGroups?: Group[];
  /** Placeholder text */
  placeholder?: string;
  /** Button label */
  submitLabel?: string;
  /** Editing existing post data */
  editingData?: { id: number; content: string; media: { mediaUrl: string }[]; visibility?: string } | null;
  /** Show visibility selector */
  showVisibility?: boolean;
  /** Compact mode (no modal wrapper, inline form) */
  compact?: boolean;
  /** External onClose for modal */
  onClose?: () => void;
};

const EMOJIS = [
  '😀','😂','🥰','😍','😘','😊','😉','🤔','😢','😭','😡','🥳','👍','👎','👏','🙏','❤️','💔','🔥','✨','🎉','😎','🤗','🤭','😴','😷','🤢','🤡','💩','👻','👽','🤖','🎃','🤝','👊','✌️','🤞','🤟','🤘','👌','🤌','🖐️','✋','👋','💪','🦾','🦵','🦶','👂','👃','🧠','🫀','🫁','🦷','👀','👁️','👅','👄','💋','🩸'
];

export default function PostComposer({
  user,
  mode = 'regular',
  onSuccess,
  groupId,
  broadcastGroups,
  placeholder = 'Bạn đang nghĩ gì?',
  submitLabel,
  editingData,
  showVisibility = false,
  compact = false,
}: PostComposerProps) {
  const [content, setContent] = useState(editingData?.content || '');
  const [media, setMedia] = useState<(File | string)[]>(
    editingData?.media.map(m => m.mediaUrl) || []
  );
  const [visibility, setVisibility] = useState(editingData?.visibility || 'public');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [mediaInputKey, setMediaInputKey] = useState(0);

  // Broadcast state
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  const initial = (user.fullName?.trim()?.charAt(0) || 'U').toUpperCase();

  const pickFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const picked = Array.from(files).slice(0, 10);
    setMedia(current => [...current, ...picked].slice(0, 10));
  };

  const uploadMedia = async (items: (File | string)[]): Promise<PostComposerMedia[]> => {
    const uploaded: PostComposerMedia[] = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const updateProgress = (fileProgress: number) =>
        setUploadProgress(Math.round(((index + fileProgress / 100) / items.length) * 100));
      if (item instanceof File) {
        let type: 'image' | 'video' | 'file' = 'file';
        if (item.type.startsWith('image/')) type = 'image';
        else if (item.type.startsWith('video/')) type = 'video';
        const result = await api.uploadFile(item, type, 'posts', updateProgress);
        uploaded.push({ url: result.mediaUrl, type: result.mediaType, name: result.mediaName, size: result.mediaSize });
      } else if (typeof item === 'string') {
        if (item.startsWith('data:')) {
          const resp = await fetch(item);
          const blob = await resp.blob();
          const ext = blob.type.split('/')[1] || 'bin';
          const file = new File([blob], `media.${ext}`, { type: blob.type });
          let type: 'image' | 'video' | 'file' = 'file';
          if (blob.type.startsWith('image/')) type = 'image';
          else if (blob.type.startsWith('video/')) type = 'video';
          const result = await api.uploadFile(file, type, 'posts', updateProgress);
          uploaded.push({ url: result.mediaUrl, type: result.mediaType, name: result.mediaName, size: result.mediaSize });
        } else {
          const ext = item.split('.').pop()?.toLowerCase() || '';
          const videoExts = ['mp4','webm','ogv','avi','mov','wmv','flv','mkv','3gp'];
          const imageExts = ['jpg','jpeg','png','gif','webp','bmp','svg','ico','tiff'];
          let type: 'image' | 'video' | 'file' = 'file';
          if (videoExts.includes(ext)) type = 'video';
          else if (imageExts.includes(ext)) type = 'image';
          uploaded.push({ url: item, type });
          updateProgress(100);
        }
      }
    }
    return uploaded;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && media.length === 0) return;

    if (mode === 'broadcast' && selectedGroupIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 nhóm để gửi thông báo.');
      return;
    }

    setLoading(true);
    setUploadProgress(0);
    setError('');
    try {
      const uploadedMedia = await uploadMedia(media);

      if (editingData) {
        // Update existing post
        await api.updatePost(editingData.id, user.id, { content, media: uploadedMedia, visibility });
      } else if (mode === 'group' && groupId) {
        // Create group post
        await api.createGroupPost(groupId, user.id, { content, media: uploadedMedia });
      } else if (mode === 'broadcast') {
        // Create post in each selected group
        for (const gid of selectedGroupIds) {
          await api.createGroupPost(gid, user.id, { content, media: uploadedMedia });
        }
      } else {
        // Regular post
        await api.createPost(user.id, { content, media: uploadedMedia, visibility });
      }

      // Reset
      setContent('');
      setMedia([]);
      setEmojiOpen(false);
      setSelectedGroupIds([]);
      setMediaInputKey(k => k + 1);
      setUploadProgress(0);
      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || 'Không đăng được bài viết');
    } finally {
      setLoading(false);
    }
  };

  const getMediaPreview = (item: File | string) => {
    const isFile = item instanceof File;
    const previewUrl = isFile ? URL.createObjectURL(item) : item;
    const isVideo = isFile
      ? item.type.startsWith('video/')
      : (item.startsWith('data:video/') || /\.(mp4|webm|ogv|avi|mov|wmv|flv|mkv|3gp)$/i.test(item));
    const isImage = isFile
      ? item.type.startsWith('image/')
      : (item.startsWith('data:image/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg|ico|tiff)$/i.test(item));
    const fileName = isFile ? item.name : '';

    return { previewUrl, isVideo, isImage, fileName };
  };

  const toggleGroupSelection = (gid: number) => {
    setSelectedGroupIds(current =>
      current.includes(gid) ? current.filter(id => id !== gid) : [...current, gid]
    );
  };

  const defaultLabel = editingData ? 'Cập nhật' : mode === 'broadcast' ? 'Gửi thông báo' : 'Đăng';

  const formContent = (
    <>
      {/* Visibility selector */}
      {showVisibility && !editingData && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
          {(['private', 'friends', 'public'] as const).map(v => (
            <button
              key={v}
              type="button"
              className={`chip ${visibility === v ? 'active' : ''}`}
              onClick={() => setVisibility(v)}
            >
              {v === 'private' ? '🔒 Riêng tư' : v === 'friends' ? '👥 Bạn bè' : '🌍 Công khai'}
            </button>
          ))}
        </div>
      )}

      {/* Textarea */}
      <textarea
        className="form-input form-textarea"
        placeholder={placeholder}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        style={{ fontSize: '16px', minHeight: '150px' }}
      />

      {/* Media preview */}
      {media.length > 0 && (
        <div className={`media-grid media-count-${Math.min(media.length, 4)}`} style={{ marginTop: '12px' }}>
          {media.slice(0, 4).map((item, index) => {
            const { previewUrl, isVideo, isImage, fileName } = getMediaPreview(item);
            return (
              <div className="media-tile draft-media" key={index} style={{ position: 'relative' }}>
                {isVideo ? (
                  <video src={previewUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : isImage ? (
                  <img src={previewUrl} alt={`draft-${index + 1}`} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'var(--gray-100)', flexDirection: 'column', gap: '8px'
                  }}>
                    <span style={{ fontSize: '32px' }}>📄</span>
                    <span style={{ fontSize: '12px', color: 'var(--gray-600)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '90%' }}>{fileName || 'File'}</span>
                  </div>
                )}
                <button
                  className="remove-media"
                  type="button"
                  onClick={() => setMedia(current => current.filter((_, i) => i !== index))}
                  style={{
                    position: 'absolute', top: '8px', right: '8px', width: '28px', height: '28px',
                    borderRadius: '50%', background: 'rgba(0,0,0,0.7)', color: 'white', border: 'none',
                    cursor: 'pointer', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}
                >
                  ×
                </button>
                {index === 3 && media.length > 4 && (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
                    background: 'rgba(0,0,0,0.5)', color: 'white', fontSize: '32px', fontWeight: '700'
                  }}>
                    +{media.length - 4}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Broadcast group selector */}
      {mode === 'broadcast' && broadcastGroups && broadcastGroups.length > 0 && (
        <div style={{ marginTop: '12px', padding: '12px', background: 'var(--gray-50)', borderRadius: '8px' }}>
          <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>
            📢 Chọn nhóm để gửi thông báo ({selectedGroupIds.length}/{broadcastGroups.length}):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={selectedGroupIds.length === broadcastGroups.length && broadcastGroups.length > 0}
                onChange={(e) => setSelectedGroupIds(e.target.checked ? broadcastGroups.map(g => g.id) : [])}
              />
              <strong>Chọn tất cả</strong>
            </label>
            {broadcastGroups.map(group => (
              <label key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                <input
                  type="checkbox"
                  checked={selectedGroupIds.includes(group.id)}
                  onChange={() => toggleGroupSelection(group.id)}
                />
                {group.name}
                <span style={{ color: 'var(--gray-500)', fontSize: '12px' }}>({group.memberCount} TV)</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions bar */}
      {loading && media.some(item => item instanceof File || item.startsWith('data:')) && (
        <div className="upload-progress-card" aria-live="polite">
          <div className="upload-progress-meta">
            <span>Đang tải tệp trực tiếp lên cloud</span>
            <strong>{uploadProgress}%</strong>
          </div>
          <div className="upload-progress-track">
            <span style={{ width: `${uploadProgress}%` }} />
          </div>
        </div>
      )}

      <div className="flex gap-sm" style={{ marginTop: '12px' }}>
        <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }}>
          <input
            key={mediaInputKey}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z"
            multiple
            onChange={(e) => { pickFiles(e.target.files); e.currentTarget.value = ''; }}
            style={{ display: 'none' }}
          />
          📎 Đính kèm
        </label>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEmojiOpen(v => !v)}>
          😊 Emoji
        </button>
        <button className="btn btn-primary btn-sm" type="submit" disabled={loading} style={{ marginLeft: 'auto' }}>
          {loading ? 'Đang đăng...' : submitLabel || defaultLabel}
        </button>
      </div>

      {/* Emoji picker */}
      {emojiOpen && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '4px',
          marginTop: '12px', padding: '12px', background: 'var(--gray-50)',
          borderRadius: 'var(--radius-lg)', maxHeight: '200px', overflowY: 'auto'
        }}>
          {EMOJIS.map(em => (
            <button
              key={em}
              type="button"
              onClick={() => setContent(v => v + em)}
              style={{
                padding: '8px', border: 'none', background: 'var(--white)',
                borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '20px',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {em}
            </button>
          ))}
        </div>
      )}

      {error && <div className="alert alert-error" style={{ marginTop: '8px' }}>{error}</div>}
    </>
  );

  if (compact) {
    return <form onSubmit={handleSubmit}>{formContent}</form>;
  }

  // Full modal mode
  return (
    <form className="profile-form" onSubmit={handleSubmit}>
      <div className="composer-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div className="post-avatar" style={{ width: '48px', height: '48px', flexShrink: 0 }}>
          {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : <div className="post-avatar-placeholder">{initial}</div>}
        </div>
        <div>
          <div style={{ fontWeight: '600' }}>{user.fullName}</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
            {mode === 'group' ? 'Đăng trong nhóm' : mode === 'broadcast' ? '📢 Gửi thông báo đến nhiều nhóm' : visibility === 'private' ? '🔒 Riêng tư' : visibility === 'friends' ? '👥 Bạn bè' : '🌍 Công khai'}
          </div>
        </div>
      </div>
      {formContent}
    </form>
  );
}
