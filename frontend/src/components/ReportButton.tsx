import { useState } from 'react';
import { api } from '../lib/api';
import { notify } from '../lib/feedback';
import type { ReportTargetType } from '../types';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

type ReportButtonProps = {
  reporterId: number;
  targetType: ReportTargetType;
  targetId: number;
  label?: string;
  className?: string;
};

const reasons = [
  ['spam', 'Spam hoặc quảng cáo'],
  ['harassment', 'Quấy rối hoặc bắt nạt'],
  ['hate', 'Ngôn từ thù ghét'],
  ['violence', 'Bạo lực hoặc nguy hiểm'],
  ['nudity', 'Nội dung nhạy cảm'],
  ['misinformation', 'Thông tin sai lệch'],
  ['other', 'Lý do khác'],
] as const;

export default function ReportButton({ reporterId, targetType, targetId, label = 'Báo cáo', className = 'chip' }: ReportButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('spam');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  useModalScrollLock(open);

  const submit = async () => {
    setLoading(true);
    try {
      await api.createReport(reporterId, { targetType, targetId, reason, details });
      notify('Đã gửi báo cáo. Quản trị viên sẽ xem xét sớm.', 'success');
      setOpen(false);
      setDetails('');
    } catch (error) {
      notify(error instanceof Error ? error.message : 'Không thể gửi báo cáo', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button className={className} type="button" onClick={(event) => { event.stopPropagation(); setOpen(true); }}>
        {label}
      </button>
      {open && (
        <div className="modal-backdrop report-modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal report-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div><span className="eyebrow">An toàn cộng đồng</span><h2 className="modal-title">Báo cáo nội dung</h2></div>
              <button className="modal-close" type="button" onClick={() => setOpen(false)} aria-label="Đóng">×</button>
            </div>
            <div className="modal-body">
              <p className="text-muted">Chọn lý do phù hợp nhất. Báo cáo của bạn sẽ được gửi kín đến quản trị viên.</p>
              <div className="report-reason-list">
                {reasons.map(([value, text]) => (
                  <label className={reason === value ? 'active' : ''} key={value}>
                    <input type="radio" name={`report-${targetType}-${targetId}`} value={value} checked={reason === value} onChange={() => setReason(value)} />
                    <span>{text}</span>
                  </label>
                ))}
              </div>
              <label className="form-label" htmlFor={`report-details-${targetType}-${targetId}`}>Mô tả thêm</label>
              <textarea id={`report-details-${targetType}-${targetId}`} className="form-textarea" maxLength={1000} rows={4} value={details} onChange={(event) => setDetails(event.target.value)} placeholder="Thông tin giúp quản trị viên hiểu rõ hơn..." />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={() => setOpen(false)}>Hủy</button>
              <button className="btn btn-primary" type="button" disabled={loading} onClick={submit}>{loading ? 'Đang gửi...' : 'Gửi báo cáo'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
