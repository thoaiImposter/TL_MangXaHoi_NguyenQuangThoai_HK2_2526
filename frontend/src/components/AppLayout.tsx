import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import MiniChat from './MiniChat';
import type { User, NotificationItem } from '../types';

type MiniChatItem = {
  userId?: number;
  groupId?: number;
  minimized: boolean;
};

type AppLayoutProps = {
  children: ReactNode;
  onLogout: () => void;
  user: User;
  miniChats: MiniChatItem[];
  onOpenMiniChat: (userId: number) => void;
  onOpenMiniGroupChat: (groupId: number) => void;
  onCloseMiniChat: (chat: { userId?: number; groupId?: number }) => void;
  onToggleMiniChat: (chat: { userId?: number; groupId?: number }) => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
};

function AppLayout({ children, onLogout, user, miniChats, onOpenMiniChat, onCloseMiniChat, onToggleMiniChat, theme, onToggleTheme }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifiedRef = useRef<Set<number>>(new Set());

  const initials = useMemo(() => (user.fullName?.trim()?.charAt(0) || 'U').toUpperCase(), [user.fullName]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (searchRef.current && !searchRef.current.contains(target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const data = await api.searchUsers(query.trim());
        setResults(data.filter((item) => item.id !== user.id).slice(0, 6));
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [query, user.id]);

  const goToProfile = (userId: number) => {
    setSearchOpen(false);
    setQuery('');
    navigate(`/users/${userId}`);
  };

  const loadNotifications = async () => {
    try {
      const data = await api.getNotifications(user.id);
      setNotifications(data);
      const unread = await api.getUnreadNotificationCount(user.id);
      setUnreadCount(unread.count);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  const handleNotificationClick = async (n: NotificationItem) => {
    if (!n.isRead) {
      try {
        await api.markNotificationRead(n.id);
        setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item)));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }
    setNotifOpen(false);
    if (n.targetType === 'user' && n.targetId) {
      navigate(`/users/${n.targetId}`);
    } else if (n.targetType === 'post' && n.targetId) {
      navigate(`/home`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead(user.id);
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  // Auto-open mini chat on new unread messages when not on /chat
  useEffect(() => {
    const isChatPage = location.pathname.startsWith('/chat');
    if (isChatPage) {
      notifiedRef.current.clear();
      return;
    }

    const check = async () => {
      try {
        const unread = await api.getUnreadMessages(user.id);
        for (const m of unread) {
          const senderId = m.senderId;
          const alreadyOpen = miniChats.some((c) => c.userId === senderId);
          const alreadyNotified = notifiedRef.current.has(senderId);
          if (!alreadyOpen && !alreadyNotified) {
            notifiedRef.current.add(senderId);
            onOpenMiniChat(senderId);
          }
        }
      } catch {
        // ignore
      }
    };

    check();
    const interval = setInterval(check, 3000);
    return () => clearInterval(interval);
  }, [location.pathname, user.id, miniChats, onOpenMiniChat]);

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/home">
          NLU Social
        </Link>

        <div className="topbar-center" ref={searchRef}>
          <button className="search-pill" type="button" onClick={() => setSearchOpen((value) => !value)}>
            <span className="search-icon">⌕</span>
            <span>Tìm ngườI dùng</span>
          </button>
          {searchOpen && (
            <div className="search-popover">
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nhập tên ngườI dùng..." />
              <div className="search-results">
                {loading && <div className="subtle">Đang tìm...</div>}
                {!loading && !results.length && <div className="subtle">Chưa có kết quả.</div>}
                {results.map((item) => (
                  <button key={item.id} className="search-result" type="button" onClick={() => goToProfile(item.id)}>
                    <span className="search-avatar">{item.avatar ? <img src={item.avatar} alt={item.fullName} /> : item.fullName.charAt(0).toUpperCase()}</span>
                    <span>
                      <strong>{item.fullName}</strong>
                      <span className="subtle">ID #{item.id}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="topbar-right">
          <button
            className="icon-nav theme-toggle"
            type="button"
            aria-label={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            title={theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
            onClick={onToggleTheme}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
          <button className="icon-nav" type="button" aria-label="Tin nhắn" onClick={() => navigate('/chat')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <div className="notif-wrapper" ref={notifRef}>
            <button className="icon-nav" type="button" aria-label="Thông báo" onClick={() => setNotifOpen((v) => !v)}>
              <span>🔔</span>
              {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-header">
                  <strong>Thông báo</strong>
                  {unreadCount > 0 && (
                    <button type="button" className="notif-mark-all" onClick={handleMarkAllRead}>
                      Đánh dấu đã đọc
                    </button>
                  )}
                </div>
                <div className="notif-list">
                  {notifications.length === 0 && <div className="notif-empty">Chưa có thông báo</div>}
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      className={`notif-item${n.isRead ? '' : ' unread'}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <span className="notif-avatar">
                        {n.actorAvatar ? (
                          <img src={n.actorAvatar} alt={n.actorName} />
                        ) : (
                          n.actorName.charAt(0).toUpperCase()
                        )}
                      </span>
                      <span className="notif-text">
                        <span className="notif-message">{n.message}</span>
                        <span className="notif-time">{new Date(n.createdAt).toLocaleString('vi-VN')}</span>
                      </span>
                      {!n.isRead && <span className="notif-dot" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="avatar-menu" ref={menuRef}>
            <button className="avatar-trigger" type="button" onClick={() => setMenuOpen((value) => !value)}>
              <span className="avatar-trigger-ring">
                {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : <span>{initials}</span>}
              </span>
            </button>
            {menuOpen && (
              <div className="avatar-dropdown">
                <button type="button" onClick={() => navigate(`/users/${user.id}`)}>
                  Hồ sơ của tôi
                </button>
                <button type="button" onClick={() => navigate('/friends')}>
                  Bạn bè
                </button>
                <button type="button" onClick={() => navigate('/groups')}>
                  Nhóm
                </button>
                <button type="button" onClick={() => navigate('/settings')}>
                  Cài đặt
                </button>
                <button type="button" onClick={() => navigate('/privacy')}>
                  Riêng tư
                </button>
                <button type="button" onClick={onToggleTheme}>
                  {theme === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
                </button>
                <button type="button" onClick={onLogout}>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <section className="page-content">{children}</section>

      <div className="mini-chat-dock">
        {miniChats.map((c) => (
          <MiniChat
            key={c.userId ? `user-${c.userId}` : `group-${c.groupId}`}
            userId={c.userId}
            groupId={c.groupId}
            currentUser={user}
            minimized={c.minimized}
            onClose={() => onCloseMiniChat({ userId: c.userId, groupId: c.groupId })}
            onToggleMinimize={() => onToggleMiniChat({ userId: c.userId, groupId: c.groupId })}
          />
        ))}
      </div>
    </main>
  );
}

export default AppLayout;
