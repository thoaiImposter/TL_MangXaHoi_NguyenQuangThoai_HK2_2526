import { useRef, useState } from 'react';
import { api } from '../lib/api';

const EMOJIS = [
  '😀','😂','🥰','😍','😘','😊','😉','🤔','😢','😭','😡','🥳','👍','👎','👏','🙏',
  '❤️','💔','🔥','✨','🎉','😎','🤗','🤭','😴','😷','🤢','🤡','💩','👻',
];

interface ChatComposerProps {
  /** Called when user sends. Return the media URL (base64 or server URL) or null for text-only. */
  onSend: (content: string, mediaUrl: string | null) => Promise<void> | void;
  placeholder?: string;
  compact?: boolean;
}

/** Resize image to max 800px and return base64 data URL */
function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 800;
      let { width, height } = img;
      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Không đọc được ảnh')); };
    img.src = url;
  });
}

export default function ChatComposer({ onSend, placeholder = 'Nhập tin nhắn...', compact = false }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState<{ type: 'image' | 'video' | 'file'; data: string; name?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (isImage) {
      if (file.size > 2 * 1024 * 1024) {
        setUploading(true);
        try {
          const result = await api.uploadFile(file, 'image');
          setAttachment({ type: 'image', data: result.mediaUrl, name: result.mediaName });
        } catch { alert('Không thể upload ảnh'); }
        setUploading(false);
      } else {
        try {
          const dataUrl = await resizeImage(file);
          setAttachment({ type: 'image', data: dataUrl });
        } catch { alert('Không đọc được ảnh'); }
      }
    } else if (isVideo) {
      setUploading(true);
      try {
        const result = await api.uploadFile(file, 'video');
        setAttachment({ type: 'video', data: result.mediaUrl, name: result.mediaName });
      } catch { alert('Không thể upload video'); }
      setUploading(false);
    } else {
      setUploading(true);
      try {
        const result = await api.uploadFile(file);
        setAttachment({ type: 'file', data: result.mediaUrl, name: result.mediaName || file.name });
      } catch { alert('Không thể upload tệp'); }
      setUploading(false);
    }
  };

  const handleSend = async () => {
    const content = value.trim();
    const mediaUrl = attachment ? attachment.data : null;
    if (!content && !mediaUrl) return;

    setSending(true);
    try {
      await onSend(content, mediaUrl);
      setValue('');
      setAttachment(null);
      setShowEmoji(false);
    } catch {
      // parent handles errors
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = (value.trim() || attachment) && !uploading && !sending;
  const prefix = compact ? 'mini-chat' : 'chat';

  return (
    <div className={`${prefix}-composer-wrapper`}>
      {attachment && (
        <div className={`${prefix}-attachment-preview`}>
          {attachment.type === 'image' && (
            <img src={attachment.data} alt="preview" />
          )}
          {attachment.type === 'video' && (
            <div className="attachment-video-preview">🎬 {attachment.name || 'Video'}</div>
          )}
          {attachment.type === 'file' && (
            <div className="attachment-file-preview">📎 {attachment.name || 'Tệp đính kèm'}</div>
          )}
          <button className="attachment-remove-btn" type="button" onClick={() => setAttachment(null)}>✕</button>
        </div>
      )}

      {uploading && (
        <div className={`${prefix}-uploading-indicator`}>
          <span className="uploading-spinner" /> Đang tải lên...
        </div>
      )}

      {showEmoji && (
        <div className={`emoji-picker ${compact ? 'mini-picker' : ''}`}>
          {EMOJIS.map((em) => (
            <button key={em} type="button" className="emoji-btn" onClick={() => setValue((v) => v + em)}>
              {em}
            </button>
          ))}
        </div>
      )}

      <div className={`${prefix}-composer`}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
        <button className={`${prefix}-tool-btn`} type="button" onClick={() => fileRef.current?.click()} title="Gửi ảnh/video/tệp">
          <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <button className={`${prefix}-tool-btn`} type="button" onClick={() => setShowEmoji((v) => !v)} title="Emoji">
          <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
        {compact ? (
          <input
            className={`${prefix}-input`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
          />
        ) : (
          <textarea
            className={`${prefix}-input`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={sending}
          />
        )}
        <button
          className={`${prefix}-send-btn`}
          type="button"
          onClick={handleSend}
          disabled={!canSend}
        >
          <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export { resizeImage };
