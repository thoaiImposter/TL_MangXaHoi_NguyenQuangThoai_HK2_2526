import { resolveMediaUrl } from '../lib/api';
import type { Message } from '../types';

interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  showAvatar?: boolean;
  showSenderName?: boolean;
  onImageClick?: (url: string) => void;
  onContextMenu?: (e: React.MouseEvent, messageId: number) => void;
  onRecall?: (messageId: number) => void;
  /** compact mode for mini chat */
  compact?: boolean;
  mentionedNames?: string[];
}

function getMediaType(url: string): 'image' | 'video' | 'file' {
  const lower = url.toLowerCase();
  if (lower.match(/\.(mp4|webm|ogg|mov|avi)$/)) return 'video';
  if (lower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return 'image';
  // If it has a data URL prefix for image
  if (lower.startsWith('data:image')) return 'image';
  if (lower.startsWith('data:video')) return 'video';
  return 'file';
}

export default function ChatMessage({
  message,
  isOwn,
  showAvatar = true,
  showSenderName = false,
  onImageClick,
  onContextMenu,
  onRecall,
  compact = false,
  mentionedNames = [],
}: ChatMessageProps) {
  const { id, senderName, senderAvatar, content, mediaUrl, isRecalled, createdAt, isAllMentioned } = message;

  const formatTime = (s: string) => {
    const d = new Date(s);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const initials = (name: string) => (name?.trim()?.charAt(0) || 'U').toUpperCase();

  const handleContextMenu = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      onContextMenu(e, id);
    }
  };

  const mediaType = mediaUrl ? getMediaType(mediaUrl) : null;
  const renderContent = () => {
    if (!content) return null;
    const labels = [...mentionedNames.map((name) => `@${name}`), ...(isAllMentioned ? ['@mọi người'] : [])]
      .sort((a, b) => b.length - a.length);
    if (!labels.length) return content;
    const escaped = labels.map((label) => label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    return content.split(new RegExp(`(${escaped})`, 'gi')).map((part, index) =>
      labels.some((label) => label.toLocaleLowerCase('vi') === part.toLocaleLowerCase('vi'))
        ? <mark className="chat-inline-mention" key={`${part}-${index}`}>{part}</mark>
        : part
    );
  };

  if (compact) {
    // Mini chat compact mode
    return (
      <div
        className={`mini-chat-bubble-row ${isOwn ? 'me' : 'them'}`}
        onContextMenu={handleContextMenu}
      >
        {isRecalled ? (
          <div className="mini-chat-bubble mini-chat-bubble-recalled">
            <div className="mini-chat-bubble-text">
              {isOwn ? 'Bạn đã thu hồi một tin nhắn' : 'Một tin nhắn đã được thu hồi'}
            </div>
          </div>
        ) : (
          <div className="mini-chat-bubble">
            {mediaUrl && mediaType === 'image' && (
              <img
                src={resolveMediaUrl(mediaUrl)}
                alt="media"
                className="mini-chat-bubble-image"
                onClick={() => onImageClick?.(mediaUrl!)}
              />
            )}
            {mediaUrl && mediaType === 'video' && (
              <video
                src={resolveMediaUrl(mediaUrl)}
                controls
                className="chat-bubble-video"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {mediaUrl && mediaType === 'file' && (
              <a
                href={resolveMediaUrl(mediaUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="chat-bubble-file"
                onClick={(e) => e.stopPropagation()}
              >
                📎 Tệp đính kèm
              </a>
            )}
            {content && <div className="mini-chat-bubble-text">{renderContent()}</div>}
            <div className="mini-chat-bubble-time">{formatTime(createdAt)}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`chat-bubble-row ${isOwn ? 'me' : 'them'}`}
      onContextMenu={handleContextMenu}
    >
      {!isOwn && showAvatar && (
        <div className="chat-bubble-avatar">
          {senderAvatar ? <img src={senderAvatar} alt={senderName} /> : initials(senderName)}
        </div>
      )}
      <div className="chat-bubble-content">
        {showSenderName && !isOwn && (
          <div className="chat-bubble-sender">
            {senderName}
            {isAllMentioned && <span className="chat-mention-tag">(@all)</span>}
          </div>
        )}
        <div className={`chat-bubble ${isRecalled ? 'chat-bubble-recalled' : ''}`}>
          {isRecalled ? (
            <div className="chat-bubble-text">
              {isOwn ? 'Bạn đã thu hồi một tin nhắn' : 'Một tin nhắn đã được thu hồi'}
            </div>
          ) : (
            <>
              {mediaUrl && mediaType === 'image' && (
                <img
                  src={resolveMediaUrl(mediaUrl)}
                  alt="media"
                  className="chat-bubble-image"
                  onClick={() => onImageClick?.(mediaUrl!)}
                />
              )}
              {mediaUrl && mediaType === 'video' && (
                <video
                  src={resolveMediaUrl(mediaUrl)}
                  controls
                  className="chat-bubble-video"
                />
              )}
              {mediaUrl && mediaType === 'file' && (
                <a
                  href={resolveMediaUrl(mediaUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="chat-bubble-file"
                >
                  📎 Tệp đính kèm
                </a>
              )}
              {content && <div className="chat-bubble-text">{renderContent()}</div>}
            </>
          )}
        </div>
        <div className="chat-bubble-meta">
          <span className="chat-bubble-time">{formatTime(createdAt)}</span>
          {!isRecalled && isOwn && onRecall && (
            <button className="chat-bubble-recall-btn" onClick={() => onRecall(id)}>
              Thu hồi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
