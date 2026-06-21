import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import MiniChat from './MiniChat';
import type { User, NotificationItem, GroupNotification } from '../types';

type MiniChatItem = {
  userId?: number;
  groupId?: number;
  minimized: boolean;
};

type AppNotification = NotificationItem & {
  source: 'general' | 'group';
  groupId?: number;
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
  const [notifOpen, setNotifOpen] = useState(false);
  const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') ?? '');
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifRef = useRef<HTMLDivElement | null>(null);
  const notifiedRef = useRef<Set<number>>(new Set());

  const initials = useMemo(() => (user.fullName?.trim()?.charAt(0) || 'U').toUpperCase(), [user.fullName]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(target)) setNotifOpen(false);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (location.pathname === '/search') {
      setQuery(new URLSearchParams(location.search).get('q') ?? '');
    }
  }, [location.pathname, location.search]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;
    navigate(`/search?q=${encodeURIComponent(keyword)}`);
  };

  const loadNotifications = async () => {
    try {
      const [general, group, generalUnread, groupUnread] = await Promise.all([
        api.getNotifications(user.id),
        api.getGroupNotifications(user.id),
        api.getUnreadNotificationCount(user.id),
        api.getUnreadGroupNotificationCount(user.id),
      ]);
      const groupItems: AppNotification[] = group.map((item: GroupNotification) => ({
        id: item.id,
        recipientId: item.userId,
        actorId: item.groupId,
        actorName: item.groupName,
        actorAvatar: null,
        type: item.type,
        message: item.message,
        targetType: item.targetType,
        targetId: item.targetId,
        isRead: item.isRead,
        createdAt: item.createdAt,
        source: 'group',
        groupId: item.groupId,
      }));
      setNotifications([
        ...general.map((item) => ({ ...item, source: 'general' as const })),
        ...groupItems,
      ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setUnreadCount(generalUnread.count + groupUnread.count);
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

  const handleNotificationClick = async (n: AppNotification) => {
    if (!n.isRead) {
      try {
        if (n.source === 'group') await api.markGroupNotificationRead(n.id);
        else await api.markNotificationRead(n.id);
        setNotifications((prev) => prev.map((item) =>
          item.id === n.id && item.source === n.source ? { ...item, isRead: true } : item));
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // ignore
      }
    }
    setNotifOpen(false);
    if (n.source === 'group' && n.groupId && n.targetType === 'post' && n.targetId) {
      navigate(`/group/${n.groupId}/post/${n.targetId}`);
    } else if (n.source === 'group' && n.groupId) {
      navigate(`/groups/${n.groupId}`);
    } else if (n.targetType === 'user' && n.targetId) {
      navigate(`/users/${n.targetId}`);
    } else if (n.targetType === 'post' && n.targetId) {
      navigate(`/post/${n.targetId}`);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await Promise.all([
        api.markAllNotificationsRead(user.id),
        api.markAllGroupNotificationsRead(user.id),
      ]);
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

        <div className="topbar-center">
          <form className="search-pill" onSubmit={submitSearch}>
            <svg className="search-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4-4" />
            </svg>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm kiếm trên NLU Social"
              aria-label="Tìm kiếm"
            />
          </form>
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
                      key={`${n.source}-${n.id}`}
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
                {user.role === 'admin' && (
                  <button type="button" onClick={() => navigate('/admin')}>
                    Quản trị hệ thống
                  </button>
                )}
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
