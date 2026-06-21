import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { confirmAction, notify } from '../lib/feedback';
import AdminReportsPage from './AdminReportsPage';
import type { AdminCommentItem, AdminGroupItem, AdminPostItem, AdminSection, AdminStats, AdminUserItem, User } from '../types';

type Props = { user: User };
type Item = AdminUserItem | AdminGroupItem | AdminPostItem | AdminCommentItem;
const labels: Record<AdminSection, string> = { overview: 'Tổng quan', reports: 'Báo cáo', users: 'Người dùng', groups: 'Nhóm', posts: 'Bài viết', comments: 'Bình luận' };
const roleLabels: Record<string, string> = { student: 'Sinh viên', advisor: 'Giảng viên', faculty_union: 'Đoàn khoa', school_union: 'Đoàn trường', admin: 'Quản trị viên' };

export default function AdminPage({ user }: Props) {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const section = (params.get('tab') as AdminSection) || (location.pathname === '/admin/reports' ? 'reports' : 'overview');
  const [stats, setStats] = useState<AdminStats>({ users: 0, groups: 0, posts: 0, comments: 0, pendingReports: 0 });
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    try { setStats(await api.getAdminStats(user.id)); }
    catch (error) { notify(error instanceof Error ? error.message : 'Không tải được thống kê', 'error'); }
  }, [user.id]);

  const loadItems = useCallback(async () => {
    if (section === 'overview' || section === 'reports') return;
    setLoading(true);
    try {
      if (section === 'users') {
        const status = ['active', 'locked'].includes(filter) ? filter : 'all';
        const role = status === 'all' ? filter : 'all';
        setItems(await api.getAdminUsers(user.id, query, role, status));
      }
      if (section === 'groups') setItems(await api.getAdminGroups(user.id, query, filter));
      if (section === 'posts') setItems(await api.getAdminPosts(user.id, query, filter));
      if (section === 'comments') setItems(await api.getAdminComments(user.id, query));
    } catch (error) { notify(error instanceof Error ? error.message : 'Không tải được dữ liệu', 'error'); }
    finally { setLoading(false); }
  }, [filter, query, section, user.id]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { setQuery(''); setFilter('all'); }, [section]);
  useEffect(() => { const timer = setTimeout(loadItems, 250); return () => clearTimeout(timer); }, [loadItems]);

  const open = (next: AdminSection) => setParams(next === 'overview' ? {} : { tab: next });
  const remove = async (type: 'users' | 'groups' | 'posts' | 'comments', id: number, name: string) => {
    if (type === 'users') {
      const warned = await confirmAction(
        `Xóa vĩnh viễn ${name} sẽ xóa toàn bộ bài viết, bình luận, lượt thích, tin nhắn, quan hệ bạn bè, nhóm đã tạo và dữ liệu liên quan. Thao tác này không thể hoàn tác.`,
        { title: 'Xóa vĩnh viễn tài khoản?', confirmLabel: 'Tiếp tục', danger: true },
      );
      if (!warned) return;
      if (!await confirmAction(
        'Đây là bước xác nhận cuối. Tài khoản và toàn bộ dữ liệu liên quan sẽ biến mất ngay lập tức.',
        { title: 'Xác nhận lần cuối', confirmLabel: 'Xóa vĩnh viễn', danger: true },
      )) return;
    } else if (!await confirmAction(
      `Xóa ${name} và dữ liệu liên quan? Thao tác này không thể hoàn tác.`,
      { title: 'Xác nhận xóa', confirmLabel: 'Xóa', danger: true },
    )) return;
    try { await api.deleteAdminItem(user.id, type, id); notify('Đã xóa thành công.', 'success'); await Promise.all([loadItems(), loadStats()]); }
    catch (error) { notify(error instanceof Error ? error.message : 'Không thể xóa', 'error'); }
  };
  const toggleLock = async (item: AdminUserItem) => {
    const verb = item.locked ? 'mở khóa' : 'khóa';
    if (!await confirmAction(`Bạn muốn ${verb} tài khoản ${item.fullName}?`, { title: `${verb[0].toUpperCase()}${verb.slice(1)} tài khoản`, confirmLabel: verb })) return;
    try { await api.setAdminUserLocked(user.id, item.id, !item.locked); notify(`Đã ${verb} tài khoản.`, 'success'); await loadItems(); }
    catch (error) { notify(error instanceof Error ? error.message : `Không thể ${verb}`, 'error'); }
  };

  if (user.role !== 'admin') return <div className="search-state"><strong>Không có quyền truy cập</strong></div>;
  const overview = [
    ['users', 'Người dùng', stats.users], ['groups', 'Nhóm', stats.groups], ['posts', 'Bài viết', stats.posts],
    ['comments', 'Bình luận', stats.comments], ['reports', 'Báo cáo chờ xử lý', stats.pendingReports],
  ] as const;

  return <main className="admin-console">
    <aside className="admin-sidebar">
      <div><span className="eyebrow">NLU Social</span><h2>Quản trị</h2><p>Kiểm soát nội dung và an toàn cộng đồng.</p></div>
      <nav>{(Object.keys(labels) as AdminSection[]).map((id) => <button key={id} type="button" className={section === id ? 'active' : ''} onClick={() => open(id)}><span>{labels[id]}</span>{id === 'reports' && stats.pendingReports > 0 && <b>{stats.pendingReports}</b>}</button>)}</nav>
    </aside>
    <section className="admin-workspace">
      {section === 'overview' && <>
        <Header eyebrow="Bảng điều khiển" title="Tổng quan hệ thống" text="Theo dõi quy mô dữ liệu và xử lý các mục cần chú ý." />
        <div className="admin-overview-grid">{overview.map(([id, label, count]) => <button type="button" onClick={() => open(id)} key={id}><span>{label}</span><strong>{count}</strong><small>Mở danh sách quản lý</small></button>)}</div>
        <section className="admin-attention"><div><span className="eyebrow">Ưu tiên hôm nay</span><h2>{stats.pendingReports ? `${stats.pendingReports} báo cáo đang chờ xử lý` : 'Không có báo cáo tồn đọng'}</h2><p>Xem xét báo cáo trước khi xóa nội dung hoặc khóa tài khoản.</p></div><button className="btn btn-primary" type="button" onClick={() => open('reports')}>Mở trung tâm báo cáo</button></section>
      </>}
      {section === 'reports' && <AdminReportsPage user={user} />}
      {!['overview', 'reports'].includes(section) && <>
        <Header eyebrow="Quản lý dữ liệu" title={labels[section]} text="Tìm kiếm, kiểm tra và thực hiện thao tác quản trị." />
        <Toolbar section={section} query={query} filter={filter} setQuery={setQuery} setFilter={setFilter} />
        {loading ? <div className="search-state">Đang tải dữ liệu...</div> : items.length === 0 ? <div className="search-state"><strong>Không tìm thấy dữ liệu</strong></div> :
          <div className="admin-data-list">
            {section === 'users' && (items as AdminUserItem[]).map((item) => <UserRow key={item.id} item={item} onLock={() => toggleLock(item)} onDelete={() => remove('users', item.id, `tài khoản ${item.fullName}`)} />)}
            {section === 'groups' && (items as AdminGroupItem[]).map((item) => <GroupRow key={item.id} item={item} onDelete={() => remove('groups', item.id, `nhóm ${item.name}`)} />)}
            {section === 'posts' && (items as AdminPostItem[]).map((item) => <PostRow key={item.id} item={item} onDelete={() => remove('posts', item.id, `bài viết #${item.id}`)} />)}
            {section === 'comments' && (items as AdminCommentItem[]).map((item) => <CommentRow key={item.id} item={item} onDelete={() => remove('comments', item.id, `bình luận #${item.id}`)} />)}
          </div>}
      </>}
    </section>
  </main>;
}

function Header({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return <header className="admin-workspace-head"><div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{text}</p></div></header>;
}
function Toolbar({ section, query, filter, setQuery, setFilter }: { section: AdminSection; query: string; filter: string; setQuery: (v: string) => void; setFilter: (v: string) => void }) {
  return <div className="admin-toolbar"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Tìm trong ${labels[section].toLowerCase()}...`} />
    {section === 'users' && <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Tất cả tài khoản</option><option value="active">Đang hoạt động</option><option value="locked">Đã khóa</option><option value="student">Sinh viên</option><option value="advisor">Giảng viên</option><option value="faculty_union">Đoàn khoa</option><option value="school_union">Đoàn trường</option></select>}
    {section === 'groups' && <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Tất cả nhóm</option><option value="public">Công khai</option><option value="private">Riêng tư</option></select>}
    {section === 'posts' && <select value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Tất cả phạm vi</option><option value="public">Công khai</option><option value="friends">Bạn bè</option><option value="private">Riêng tôi</option></select>}
  </div>;
}
function UserRow({ item, onLock, onDelete }: { item: AdminUserItem; onLock: () => void; onDelete: () => void }) {
  return <article><Avatar src={item.avatar} name={item.fullName} /><div className="admin-item-main"><div><Link to={`/users/${item.id}`}>{item.fullName}</Link>{item.locked && <Badge danger>Đã khóa</Badge>}</div><p>{item.email}</p><small>{roleLabels[item.role]} · Tham gia {new Date(item.createdAt).toLocaleDateString('vi-VN')}</small></div><Actions>{item.role !== 'admin' && <><button className="btn btn-secondary" onClick={onLock}>{item.locked ? 'Mở khóa' : 'Khóa'}</button><button className="btn btn-danger" onClick={onDelete}>Xóa</button></>}</Actions></article>;
}
function GroupRow({ item, onDelete }: { item: AdminGroupItem; onDelete: () => void }) {
  return <article><Avatar src={item.avatar} name={item.name} /><div className="admin-item-main"><div><Link to={`/groups/${item.id}`}>{item.name}</Link><Badge>{item.privacy === 'public' ? 'Công khai' : 'Riêng tư'}</Badge></div><p>{item.description || 'Không có mô tả'}</p><small>{item.memberCount} thành viên · Tạo bởi {item.creatorName}</small></div><Actions><button className="btn btn-danger" onClick={onDelete}>Xóa</button></Actions></article>;
}
function PostRow({ item, onDelete }: { item: AdminPostItem; onDelete: () => void }) {
  return <article><div className="admin-item-main"><div><Link to={item.groupId ? `/group/${item.groupId}/post/${item.id}` : `/post/${item.id}`}>Bài viết #{item.id}</Link><Badge>{item.visibility}</Badge>{item.groupName && <Badge>{item.groupName}</Badge>}</div><p>{item.content || 'Bài viết không có nội dung chữ.'}</p><small>{item.authorName} · {item.commentCount} bình luận · {new Date(item.createdAt).toLocaleString('vi-VN')}</small></div><Actions><button className="btn btn-danger" onClick={onDelete}>Xóa</button></Actions></article>;
}
function CommentRow({ item, onDelete }: { item: AdminCommentItem; onDelete: () => void }) {
  return <article><div className="admin-item-main"><div><Link to={item.groupId ? `/group/${item.groupId}/post/${item.postId}` : `/post/${item.postId}`}>Bình luận #{item.id}</Link>{item.parentCommentId && <Badge>Trả lời #{item.parentCommentId}</Badge>}</div><p>{item.content || 'Bình luận chỉ có tệp đa phương tiện.'}</p><small>{item.authorName} · {new Date(item.createdAt).toLocaleString('vi-VN')}</small></div><Actions><button className="btn btn-danger" onClick={onDelete}>Xóa</button></Actions></article>;
}
function Avatar({ src, name }: { src: string | null; name: string }) { return <div className="admin-item-avatar">{src ? <img src={src} alt="" /> : name.charAt(0)}</div>; }
function Badge({ children, danger = false }: { children: ReactNode; danger?: boolean }) { return <span className={`admin-badge${danger ? ' danger' : ''}`}>{children}</span>; }
function Actions({ children }: { children: ReactNode }) { return <div className="admin-row-actions">{children}</div>; }
