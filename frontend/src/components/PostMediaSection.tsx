import { useState } from 'react';
import { resolveMediaUrl } from '../lib/api';
import type { PostMedia } from '../types';

type PostMediaSectionProps = {
  media: PostMedia[];
};

const formatBytes = (value?: number) => {
  if (!value) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
};

const fileNameFromUrl = (url: string) => {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || 'Tệp đính kèm');
  } catch {
    return 'Tệp đính kèm';
  }
};

export default function PostMediaSection({ media }: PostMediaSectionProps) {
  const visualMedia = media.filter((item) => item.mediaType !== 'file');
  const files = media.filter((item) => item.mediaType === 'file');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const visibleMedia = visualMedia.slice(0, 4);
  const count = visualMedia.length;
  const layoutCount = Math.min(count, 4);
  const viewerItem = viewerIndex === null ? null : visualMedia[viewerIndex];

  return (
    <div className="post-media-section" onClick={(event) => event.stopPropagation()}>
      {!!visualMedia.length && (
        <div className={`post-media-layout post-media-${layoutCount}`}>
          {visibleMedia.map((item, index) => (
            <button
              className={`post-media-tile post-media-pos-${index + 1}`}
              type="button"
              key={item.id}
              onClick={() => setViewerIndex(index)}
              aria-label={`Mở nội dung đa phương tiện ${index + 1}`}
            >
              {item.mediaType === 'video' ? (
                <>
                  <video src={resolveMediaUrl(item.mediaUrl)} muted preload="metadata" className="post-media-preview" />
                  <span className="post-video-play">▶</span>
                </>
              ) : (
                <img loading="lazy" src={resolveMediaUrl(item.mediaUrl)} alt="" className="post-media-preview" />
              )}
              {index === 3 && count > 4 && <span className="media-more">+{count - 4}</span>}
            </button>
          ))}
        </div>
      )}

      {!!files.length && (
        <div className="post-file-list" aria-label="Danh sách tệp đính kèm">
          {files.map((file) => (
            <a
              className="post-file-row"
              href={resolveMediaUrl(file.mediaUrl)}
              target="_blank"
              rel="noreferrer"
              download
              key={file.id}
            >
              <span className="post-file-icon" aria-hidden="true">FILE</span>
              <span className="post-file-info">
                <strong>{file.mediaName || fileNameFromUrl(file.mediaUrl)}</strong>
                <small>{formatBytes(file.mediaSize) || 'Tệp đính kèm'}</small>
              </span>
              <span className="post-file-open">Mở</span>
            </a>
          ))}
        </div>
      )}

      {viewerItem && viewerIndex !== null && (
        <div className="image-viewer" role="presentation" onClick={() => setViewerIndex(null)}>
          <div className="post-viewer" onClick={(event) => event.stopPropagation()}>
            {count > 1 && (
              <button
                className="viewer-arrow viewer-prev"
                type="button"
                onClick={() => setViewerIndex((viewerIndex - 1 + count) % count)}
                aria-label="Nội dung trước"
              >
                ‹
              </button>
            )}
            {viewerItem.mediaType === 'video' ? (
              <video src={resolveMediaUrl(viewerItem.mediaUrl)} controls autoPlay className="viewer-media" />
            ) : (
              <img src={resolveMediaUrl(viewerItem.mediaUrl)} alt="" className="viewer-media" />
            )}
            {count > 1 && (
              <button
                className="viewer-arrow viewer-next"
                type="button"
                onClick={() => setViewerIndex((viewerIndex + 1) % count)}
                aria-label="Nội dung tiếp theo"
              >
                ›
              </button>
            )}
            <button className="viewer-close" type="button" onClick={() => setViewerIndex(null)} aria-label="Đóng">
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
