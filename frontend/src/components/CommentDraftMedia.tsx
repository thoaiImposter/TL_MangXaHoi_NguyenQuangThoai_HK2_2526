import { resolveMediaUrl } from '../lib/api';

type CommentDraftMediaProps = {
  media?: string[];
  onRemove: () => void;
};

const inferType = (url: string) => {
  const value = url.toLowerCase();
  if (/\.(mp4|webm|ogg|mov|mkv)(\?|$)/.test(value)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/.test(value)) return 'image';
  return 'file';
};

const fileName = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'Tệp đính kèm');
  } catch {
    return 'Tệp đính kèm';
  }
};

export default function CommentDraftMedia({ media, onRemove }: CommentDraftMediaProps) {
  const item = media?.[0];
  if (!item) return null;

  const src = resolveMediaUrl(item);
  const type = inferType(item);

  return (
    <div className="comment-draft-media">
      {type === 'image' && <img src={src} alt="Tệp đính kèm bình luận" />}
      {type === 'video' && <video src={src} muted preload="metadata" />}
      {type === 'file' && (
        <div className="comment-draft-file">
          <span className="comment-file-icon">FILE</span>
          <span>{fileName(item)}</span>
        </div>
      )}
      <button type="button" onClick={onRemove} aria-label="Bỏ tệp đính kèm">×</button>
    </div>
  );
}
