import { resolveMediaUrl } from '../lib/api';
import type { CommentMedia } from '../types';

type CommentMediaSectionProps = {
  media: CommentMedia[];
  onOpenImage?: (src: string) => void;
};

const fileNameFromUrl = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'Tệp đính kèm');
  } catch {
    return 'Tệp đính kèm';
  }
};

const inferType = (item: CommentMedia) => {
  if (item.mediaType) return item.mediaType;
  const value = item.mediaUrl.toLowerCase();
  if (/\.(mp4|webm|ogg|mov|mkv)(\?|$)/.test(value)) return 'video';
  if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/.test(value)) return 'image';
  return 'file';
};

export default function CommentMediaSection({ media, onOpenImage }: CommentMediaSectionProps) {
  if (!media.length) return null;

  return (
    <div className="comment-media-list">
      {media.map((item) => {
        const type = inferType(item);
        const src = resolveMediaUrl(item.mediaUrl);
        if (type === 'video') {
          return <video key={item.id} className="comment-media-video" src={src} controls preload="metadata" />;
        }
        if (type === 'file') {
          return (
            <a className="comment-file-row" href={src} target="_blank" rel="noreferrer" download key={item.id}>
              <span className="comment-file-icon">FILE</span>
              <span>{item.mediaName || fileNameFromUrl(item.mediaUrl)}</span>
            </a>
          );
        }
        return (
          <a
            className="comment-media-image"
            href={src}
            target="_blank"
            rel="noreferrer"
            key={item.id}
            onClick={(event) => {
              if (!onOpenImage) return;
              event.preventDefault();
              onOpenImage(src);
            }}
          >
            <img loading="lazy" src={src} alt="" />
          </a>
        );
      })}
    </div>
  );
}
