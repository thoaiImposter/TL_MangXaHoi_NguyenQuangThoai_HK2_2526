import { useRef, useState } from 'react';
import { api } from '../lib/api';
import type { GroupMember } from '../types';

const EMOJIS = ['😀', '😂', '🥰', '😍', '😊', '😉', '🤔', '😢', '😭', '😡', '🥳', '👍', '👏', '🙏', '❤️', '🔥', '✨', '🎉'];

interface ChatComposerProps {
  onSend: (content: string, mediaUrl: string | null, mentionedUserIds?: number[], isAllMentioned?: boolean) => Promise<void> | void;
  placeholder?: string;
  compact?: boolean;
  mentionMembers?: GroupMember[];
  currentUserId?: number;
}

type MentionOption = { id: number; name: string; avatar: string | null; role: string };

export default function ChatComposer({
  onSend,
  placeholder = 'Nhập tin nhắn...',
  compact = false,
  mentionMembers = [],
  currentUserId,
}: ChatComposerProps) {
  const [value, setValue] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachment, setAttachment] = useState<{ type: 'image' | 'video' | 'file'; data: string; name?: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [sending, setSending] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState<number | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [selectedMentions, setSelectedMentions] = useState<{ id: number; name: string }[]>([]);
  const [isAllMentioned, setIsAllMentioned] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  const mentionOptions: MentionOption[] = [
    { id: -1, name: 'Mọi người', avatar: null, role: 'all' },
    ...mentionMembers
      .filter((member) => member.status === 'active' && member.userId !== currentUserId)
      .map((member) => ({ id: member.userId, name: member.userName, avatar: member.userAvatar, role: member.role })),
  ].filter((member) => !mentionQuery || member.name.toLocaleLowerCase('vi').includes(mentionQuery.toLocaleLowerCase('vi')));

  const updateMentionQuery = (nextValue: string, caret: number) => {
    const match = nextValue.slice(0, caret).match(/(?:^|\s)@([^@\n]*)$/);
    if (!match) {
      setMentionQuery(null);
      setMentionStart(null);
      return;
    }
    setMentionQuery(match[1]);
    setMentionStart(caret - match[1].length - 1);
    setMentionIndex(0);
  };

  const selectMention = (option: MentionOption) => {
    if (mentionStart === null) return;
    const input = inputRef.current;
    const caret = input?.selectionStart ?? value.length;
    const label = option.id === -1 ? '@mọi người' : `@${option.name}`;
    setValue(`${value.slice(0, mentionStart)}${label} ${value.slice(caret)}`);
    if (option.id === -1) setIsAllMentioned(true);
    else setSelectedMentions((current) => current.some((item) => item.id === option.id) ? current : [...current, { id: option.id, name: option.name }]);
    setMentionQuery(null);
    setMentionStart(null);
    requestAnimationFrame(() => {
      input?.focus();
      const nextCaret = mentionStart + label.length + 1;
      input?.setSelectionRange(nextCaret, nextCaret);
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setUploadProgress(0);
    setUploading(true);
    try {
      const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'file';
      const result = await api.uploadFile(file, type, 'messages', setUploadProgress);
      setAttachment({ type, data: result.mediaUrl, name: result.mediaName || file.name });
    } catch {
      alert('Không thể tải tệp lên');
    } finally {
      setUploading(false);
    }
  };

  const handleSend = async () => {
    const content = value.trim();
    const mediaUrl = attachment?.data ?? null;
    if (!content && !mediaUrl) return;
    setSending(true);
    try {
      await onSend(content, mediaUrl, selectedMentions.map((mention) => mention.id), isAllMentioned);
      setValue('');
      setAttachment(null);
      setShowEmoji(false);
      setSelectedMentions([]);
      setIsAllMentioned(false);
      setMentionQuery(null);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (mentionQuery !== null && mentionOptions.length) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setMentionIndex((current) => event.key === 'ArrowDown' ? (current + 1) % mentionOptions.length : (current - 1 + mentionOptions.length) % mentionOptions.length);
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        selectMention(mentionOptions[mentionIndex]);
        return;
      }
      if (event.key === 'Escape') {
        setMentionQuery(null);
        setMentionStart(null);
        return;
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  const handleValueChange = (nextValue: string, caret: number) => {
    setValue(nextValue);
    updateMentionQuery(nextValue, caret);
  };

  const canSend = (value.trim() || attachment) && !uploading && !sending;
  const prefix = compact ? 'mini-chat' : 'chat';

  return (
    <div className={`${prefix}-composer-wrapper`}>
      {attachment && (
        <div className={`${prefix}-attachment-preview`}>
          {attachment.type === 'image' && <img src={attachment.data} alt="preview" />}
          {attachment.type === 'video' && <div className="attachment-video-preview">Video: {attachment.name || 'Video'}</div>}
          {attachment.type === 'file' && <div className="attachment-file-preview">Tệp: {attachment.name || 'Tệp đính kèm'}</div>}
          <button className="attachment-remove-btn" type="button" onClick={() => setAttachment(null)}>×</button>
        </div>
      )}

      {uploading && (
        <div className={`${prefix}-uploading-indicator`}>
          <span className="uploading-spinner" /> Đang tải lên... {uploadProgress}%
          <div className="upload-progress-track compact"><span style={{ width: `${uploadProgress}%` }} /></div>
        </div>
      )}

      {showEmoji && (
        <div className={`emoji-picker ${compact ? 'mini-picker' : ''}`}>
          {EMOJIS.map((emoji) => <button key={emoji} type="button" className="emoji-btn" onClick={() => setValue((current) => current + emoji)}>{emoji}</button>)}
        </div>
      )}

      {(selectedMentions.length > 0 || isAllMentioned) && (
        <div className="chat-mention-chips">
          {isAllMentioned && <button type="button" onClick={() => setIsAllMentioned(false)}>@mọi người <span>×</span></button>}
          {selectedMentions.map((mention) => (
            <button key={mention.id} type="button" onClick={() => setSelectedMentions((current) => current.filter((item) => item.id !== mention.id))}>
              @{mention.name} <span>×</span>
            </button>
          ))}
        </div>
      )}

      <div className={`${prefix}-composer`}>
        {mentionQuery !== null && mentionMembers.length > 0 && (
          <div className="chat-mention-menu" role="listbox">
            <div className="chat-mention-menu-title">Tag thành viên</div>
            {mentionOptions.length ? mentionOptions.slice(0, 8).map((option, index) => (
              <button key={option.id} type="button" className={index === mentionIndex ? 'active' : ''} onMouseDown={(event) => event.preventDefault()} onClick={() => selectMention(option)}>
                <span className="chat-mention-avatar">{option.avatar ? <img src={option.avatar} alt="" /> : option.id === -1 ? '@' : option.name.charAt(0).toUpperCase()}</span>
                <span>
                  <strong>{option.name}</strong>
                  <small>{option.role === 'all' ? 'Thông báo cho tất cả thành viên' : option.role === 'gold_key' ? 'Chủ nhóm' : option.role === 'silver_key' ? 'Quản trị viên' : 'Thành viên'}</small>
                </span>
              </button>
            )) : <div className="chat-mention-empty">Không tìm thấy thành viên</div>}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.txt" hidden onChange={handleFileSelect} />
        <button className={`${prefix}-tool-btn`} type="button" onClick={() => fileRef.current?.click()} title="Gửi ảnh, video hoặc tệp">+</button>
        <button className={`${prefix}-tool-btn`} type="button" onClick={() => setShowEmoji((current) => !current)} title="Emoji">☺</button>
        {compact ? (
          <input ref={inputRef as React.RefObject<HTMLInputElement>} className={`${prefix}-input`} placeholder={placeholder} value={value} onChange={(event) => handleValueChange(event.target.value, event.target.selectionStart ?? event.target.value.length)} onKeyDown={handleKeyDown} disabled={sending} />
        ) : (
          <textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} className={`${prefix}-input`} placeholder={placeholder} value={value} onChange={(event) => handleValueChange(event.target.value, event.target.selectionStart)} onKeyDown={handleKeyDown} rows={1} disabled={sending} />
        )}
        <button className={`${prefix}-send-btn`} type="button" onClick={handleSend} disabled={!canSend} aria-label="Gửi tin nhắn">➤</button>
      </div>
    </div>
  );
}
