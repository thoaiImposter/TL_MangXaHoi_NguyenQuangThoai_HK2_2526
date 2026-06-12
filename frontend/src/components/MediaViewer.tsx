import { useState } from 'react';
import type { PostMedia } from '../types';
import { resolveMediaUrl } from '../lib/api';

interface MediaViewerProps {
  media: PostMedia[];
  onClose?: () => void;
}

export default function MediaViewer({ media, onClose }: MediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!media || media.length === 0) return null;

  const currentMedia = media[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const renderMedia = (item: PostMedia) => {
    switch (item.mediaType) {
      case 'video':
        return (
          <video
            src={resolveMediaUrl(item.mediaUrl)}
            controls
            autoPlay
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              borderRadius: '8px',
            }}
          />
        );

      case 'image':
        return (
          <img
            src={resolveMediaUrl(item.mediaUrl)}
            alt={item.mediaName || 'Image'}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        );

      case 'file':
        return (
          <div
            style={{
              padding: '40px',
              background: '#f0f2f5',
              borderRadius: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📄</div>
            <div style={{ fontWeight: '600', marginBottom: '8px' }}>
              {item.mediaName || 'File'}
            </div>
            {item.mediaSize && (
              <div style={{ fontSize: '14px', color: '#65676b', marginBottom: '16px' }}>
                {formatFileSize(item.mediaSize)}
              </div>
            )}
            <a
              href={resolveMediaUrl(item.mediaUrl) + '/download'}
              download={item.mediaName}
              style={{
                display: 'inline-block',
                padding: '10px 20px',
                background: '#1876f2',
                color: '#fff',
                textDecoration: 'none',
                borderRadius: '6px',
              }}
            >
              📥 Tải xuống
            </a>
          </div>
        );

      default:
        return (
          <img
            src={resolveMediaUrl(item.mediaUrl)}
            alt={item.mediaName || 'Media'}
            style={{
              maxWidth: '100%',
              maxHeight: '80vh',
              objectFit: 'contain',
              borderRadius: '8px',
            }}
          />
        );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // If only one media, show inline
  if (media.length === 1) {
    return <div>{renderMedia(currentMedia)}</div>;
  }

  // Multiple media - show with navigation
  return (
    <div style={{ position: 'relative' }}>
      {/* Main media */}
      <div style={{ textAlign: 'center' }}>
        {renderMedia(currentMedia)}
      </div>

      {/* Navigation arrows */}
      {media.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ‹
          </button>
          <button
            onClick={handleNext}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ›
          </button>
        </>
      )}

      {/* Thumbnails */}
      {media.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '8px',
            marginTop: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {media.map((item, index) => (
            <div
              key={item.id}
              onClick={() => setCurrentIndex(index)}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '6px',
                overflow: 'hidden',
                cursor: 'pointer',
                border: index === currentIndex ? '3px solid #1876f2' : '2px solid #ddd',
                background: '#f0f2f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {item.mediaType === 'image' ? (
                <img
                  src={resolveMediaUrl(item.mediaUrl)}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : item.mediaType === 'video' ? (
                <div style={{ fontSize: '24px' }}>🎬</div>
              ) : (
                <div style={{ fontSize: '24px' }}>📄</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Counter */}
      {media.length > 1 && (
        <div
          style={{
            textAlign: 'center',
            marginTop: '8px',
            fontSize: '12px',
            color: '#65676b',
          }}
        >
          {currentIndex + 1} / {media.length}
        </div>
      )}
    </div>
  );
}