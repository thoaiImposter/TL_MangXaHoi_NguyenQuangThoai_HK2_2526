import { useEffect, useState } from 'react';

type UploadState = {
  fileName: string;
  percent: number;
};

export default function GlobalUploadProgress() {
  const [upload, setUpload] = useState<UploadState | null>(null);

  useEffect(() => {
    let hideTimer: number | undefined;
    const handleProgress = (event: Event) => {
      const detail = (event as CustomEvent<UploadState>).detail;
      window.clearTimeout(hideTimer);
      if (detail.percent < 0) {
        setUpload(null);
        return;
      }
      setUpload(detail);
      if (detail.percent >= 100) {
        hideTimer = window.setTimeout(() => setUpload(null), 900);
      }
    };
    window.addEventListener('nlu-upload-progress', handleProgress);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener('nlu-upload-progress', handleProgress);
    };
  }, []);

  if (!upload) return null;

  return (
    <div className="global-upload-progress" aria-live="polite">
      <div className="upload-progress-meta">
        <span title={upload.fileName}>{upload.percent >= 100 ? 'Đã tải xong' : 'Đang tải lên'}: {upload.fileName}</span>
        <strong>{upload.percent}%</strong>
      </div>
      <div className="upload-progress-track">
        <span style={{ width: `${upload.percent}%` }} />
      </div>
    </div>
  );
}
