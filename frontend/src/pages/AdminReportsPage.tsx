import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { confirmAction, notify } from '../lib/feedback';
import type { ReportItem, ReportStatus, User } from '../types';

type Props = { user: User };
type Filter = ReportStatus | 'all';
const targetLabels = { post: 'Bài viết', comment: 'Bình luận', user: 'Tài khoản', group: 'Nhóm' };
const reasonLabels: Record<string, string> = { spam: 'Spam hoặc quảng cáo', harassment: 'Quấy rối hoặc bắt nạt', hate: 'Ngôn từ thù ghét', violence: 'Bạo lực hoặc nguy hiểm', nudity: 'Nội dung nhạy cảm', misinformation: 'Thông tin sai lệch', other: 'Lý do khác' };
const statusLabels = { pending: 'Chờ xử lý', resolved: 'Đã xử lý', rejected: 'Đã bỏ qua' };

export default function AdminReportsPage({ user }: Props) {
  const [filter, setFilter] = useState<Filter>('pending');
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState<Record<'all' | ReportStatus, number>>({ all: 0, pending: 0, resolved: 0, rejected: 0 });
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [items, totals] = await Promise.all([api.getAdminReports(user.id, filter), api.getAdminReportStats(user.id)]);
      setReports(items); setStats(totals);
    } catch (error) { notify(error instanceof Error ? error.message : 'Không tải được danh sách báo cáo', 'error'); }
    finally { setLoading(false); }
  }, [filter, user.id]);
  useEffect(() => { load(); }, [load]);

  const handle = async (report: ReportItem, action: 'dismiss' | 'resolve' | 'delete_target') => {
    if (action === 'delete_target' && !await confirmAction('Hành động này sẽ xóa mục tiêu bị báo cáo và không thể hoàn tác.', { title: 'Xóa nội dung vi phạm', confirmLabel: 'Xóa và xử lý', danger: true })) return;
    try {
      await api.resolveReport(report.id, user.id, { action, adminNote: notes[report.id] ?? '' });
      notify(action === 'dismiss' ? 'Đã bỏ qua báo cáo.' : 'Đã xử lý báo cáo.', 'success');
      await load();
    } catch (error) { notify(error instanceof Error ? error.message : 'Không thể xử lý báo cáo', 'error'); }
  };

  if (user.role !== 'admin') return <div className="search-state"><strong>Không có quyền truy cập</strong></div>;
  const filters: { id: Filter; label: string }[] = [{ id: 'pending', label: 'Chờ xử lý' }, { id: 'resolved', label: 'Đã xử lý' }, { id: 'rejected', label: 'Đã bỏ qua' }, { id: 'all', label: 'Tất cả' }];

  return <main className="admin-reports-page">
    <header className="admin-page-header">
      <div><span className="eyebrow">Quản trị hệ thống</span><h1>Trung tâm báo cáo</h1><p>Xem xét nội dung bị cộng đồng báo cáo và ghi lại quyết định xử lý.</p></div>
      <div className="admin-report-stats"><div><strong>{stats.pending}</strong><span>Chờ xử lý</span></div><div><strong>{stats.resolved}</strong><span>Đã xử lý</span></div><div><strong>{stats.all}</strong><span>Tổng báo cáo</span></div></div>
    </header>
    <nav className="admin-report-filters">{filters.map((item) => <button type="button" className={filter === item.id ? 'active' : ''} onClick={() => setFilter(item.id)} key={item.id}>{item.label}<span>{stats[item.id]}</span></button>)}</nav>
    {loading ? <div className="search-state">Đang tải báo cáo...</div> : reports.length === 0 ? <div className="search-state"><strong>Không có báo cáo trong mục này</strong></div> :
      <div className="admin-report-list">{reports.map((report) => <article className="admin-report-card" key={report.id}>
        <div className="admin-report-card-head"><div><span className={`report-status ${report.status}`}>{statusLabels[report.status]}</span><span className="report-target-type">{targetLabels[report.targetType]}</span></div><time>{new Date(report.createdAt).toLocaleString('vi-VN')}</time></div>
        <div className="admin-report-grid">
          <section><span className="eyebrow">Mục tiêu</span><h3>{report.targetTitle || `${targetLabels[report.targetType]} #${report.targetId}`}</h3><p className="admin-report-snapshot">{report.targetSnapshot || 'Không có nội dung xem trước.'}</p>{report.targetUrl && <Link className="btn btn-secondary" to={report.targetUrl}>Mở nội dung</Link>}</section>
          <section><span className="eyebrow">Báo cáo bởi {report.reporterName}</span><h3>{reasonLabels[report.reason] || report.reason}</h3><p>{report.details || 'Người dùng không cung cấp mô tả thêm.'}</p></section>
        </div>
        {report.status === 'pending' ? <div className="admin-report-actions"><textarea rows={2} value={notes[report.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [report.id]: event.target.value }))} placeholder="Ghi chú xử lý nội bộ..." /><div><button className="btn btn-secondary" type="button" onClick={() => handle(report, 'dismiss')}>Bỏ qua</button><button className="btn btn-secondary" type="button" onClick={() => handle(report, 'resolve')}>Đánh dấu đã xử lý</button><button className="btn btn-danger" type="button" onClick={() => handle(report, 'delete_target')}>Xóa mục tiêu</button></div></div> :
          <div className="admin-report-result"><strong>{report.handledByName}</strong> · {report.resolution === 'delete_target' ? 'Đã xóa mục tiêu' : report.resolution === 'dismiss' ? 'Đã bỏ qua' : 'Đã xử lý'}{report.adminNote ? ` · ${report.adminNote}` : ''}</div>}
      </article>)}</div>}
  </main>;
}
