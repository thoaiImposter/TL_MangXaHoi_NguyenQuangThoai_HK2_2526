import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, resolveMediaUrl } from '../lib/api';
import GroupChat from '../components/GroupChat';
import ChatMessage from '../components/ChatMessage';
import ChatComposer from '../components/ChatComposer';
import BulkMessageModal from '../components/BulkMessageModal';
import type { Group, GroupMember, Message, User } from '../types';

type ChatPageProps = { user: User };

type ConversationItem = {
  otherId: number;
  otherName: string;
  otherAvatar?: string | null;
  lastContent: string;
  lastAt: string;
  unread: number;
  type: 'user';
};

type GroupItem = {
  groupId: number;
  groupName: string;
  groupAvatar?: string | null;
  lastContent: string;
  lastAt: string;
  type: 'group';
};

function ChatPage({ user }: ChatPageProps) {
  const { userId, groupId: routeGroupId } = useParams();
  const navigate = useNavigate();
  const targetId = userId ? Number(userId) : null;
  const targetGroupId = routeGroupId ? Number(routeGroupId) : null;
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otherUser, setOtherUser] = useState<{ fullName: string; avatar?: string | null } | null>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ messageId: number; x: number; y: number } | null>(null);
  const [sidebarSection, setSidebarSection] = useState<'all' | 'groups'>('all');
  const [showBulkMessageModal, setShowBulkMessageModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const initials = (name: string) => (name?.trim()?.charAt(0) || 'U').toUpperCase();

  const loadConversations = async () => {
    try {
      const data = await api.getConversations(user.id);
      const map = new Map<number, { msg: Message; unread: number }>();
      for (const m of data) {
        const oid = m.senderId === user.id ? m.receiverId : m.senderId;
        if (oid == null) continue;
        const existing = map.get(oid);
        if (!existing) {
          map.set(oid, { msg: m, unread: m.receiverId === user.id && !m.isRead ? 1 : 0 });
        } else if (m.receiverId === user.id && !m.isRead) {
          existing.unread += 1;
        }
      }
      const items: ConversationItem[] = Array.from(map.entries()).map(([otherId, { msg, unread }]) => {
        const isMe = msg.senderId === user.id;
        return {
          otherId,
          otherName: (isMe ? msg.receiverName : msg.senderName) || 'Người dùng',
          otherAvatar: isMe ? msg.receiverAvatar : msg.senderAvatar,
          lastContent: msg.content || '[Hình ảnh]',
          lastAt: msg.createdAt,
          unread,
          type: 'user' as const,
        };
      });
      setConversations(items);
    } catch { /* ignore */ }
  };

  const loadGroups = async () => {
    try {
      const myGroups = await api.getMyGroups(user.id, 0, 50);
      const groupItems: GroupItem[] = [];
      for (const g of myGroups) {
        try {
          const msgs = await api.getGroupMessages(g.id, user.id, 0, 1);
          const lastMsg = msgs.length > 0 ? msgs[0] : null;
          groupItems.push({
            groupId: g.id, groupName: g.name, groupAvatar: g.avatar,
            lastContent: lastMsg ? (lastMsg.content || '[Hình ảnh]') : 'Chưa có tin nhắn',
            lastAt: lastMsg?.createdAt || g.createdAt, type: 'group' as const,
          });
        } catch {
          groupItems.push({
            groupId: g.id, groupName: g.name, groupAvatar: g.avatar,
            lastContent: 'Chưa có tin nhắn', lastAt: g.createdAt, type: 'group' as const,
          });
        }
      }
      groupItems.sort((a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime());
      setGroups(groupItems);
    } catch { /* ignore */ }
  };

  const loadGroupData = async (gid: number) => {
    try {
      const [groupData, membersData] = await Promise.all([api.getGroup(gid), api.getGroupMembers(gid)]);
      setSelectedGroup(groupData);
      setGroupMembers(membersData);
    } catch { /* ignore */ }
  };

  const loadChat = async () => {
    if (!targetId || targetId === user.id) return;
    setLoading(true);
    setError('');
    try {
      const [msgs, profile] = await Promise.all([
        api.getMessages(user.id, targetId),
        api.getProfile(targetId).catch(() => null),
      ]);
      setMessages(msgs);
      if (profile) setOtherUser({ fullName: profile.fullName, avatar: profile.avatar });
      await api.markRead(user.id, targetId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được tin nhắn');
    } finally { setLoading(false); }
  };

  const checkBlocked = async () => {
    if (!targetId) return;
    try {
      const list = await api.getBlockedList(user.id);
      setBlocked(list.some((b: { id: number }) => b.id === targetId));
    } catch { setBlocked(false); }
  };

  useEffect(() => {
    loadConversations(); loadGroups(); loadChat(); checkBlocked(); setError('');
    if (targetGroupId) { loadGroupData(targetGroupId); } else { setSelectedGroup(null); setGroupMembers([]); }
  }, [targetId, targetGroupId, user.id]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/chat');
    wsRef.current = ws;
    ws.onopen = () => { ws.send(JSON.stringify({ type: 'auth', userId: user.id, token: localStorage.getItem('social_token') })); };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'new_message') {
          const senderId = Number(data.senderId);
          const receiverId = Number(data.receiverId);
          if (targetId && (senderId === targetId || receiverId === targetId)) loadChat();
          loadConversations();
        } else if (data.type === 'message_recalled') {
          const senderId = Number(data.senderId);
          const receiverId = Number(data.receiverId);
          if (targetId && (senderId === targetId || receiverId === targetId)) loadChat();
        }
      } catch { /* ignore */ }
    };
    ws.onclose = () => { setTimeout(() => { if (wsRef.current === ws) wsRef.current = null; }, 2000); };
    return () => { ws.close(); wsRef.current = null; };
  }, [user.id, targetId]);

  const send = async (content: string, mediaUrl: string | null) => {
    if (!targetId) return;
    if (!content && !mediaUrl) return;
    setError('');
    try {
      const sent = await api.sendMessage(user.id, targetId, content, mediaUrl ?? undefined);
      if (!sent || typeof sent !== 'object' || !('id' in sent)) throw new Error('Phản hồi từ server không hợp lệ');
      await loadChat();
      await loadConversations();
    } catch (err) {
      console.error('Send message error:', err);
      setError(err instanceof Error ? err.message : 'Không gửi được');
    }
  };

  const handleRecallMessage = async (messageId: number) => {
    try {
      await api.recallMessage(messageId, user.id);
      await loadChat();
      setContextMenu(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể thu hồi tin nhắn');
    }
  };

  const handleMessageContextMenu = (e: React.MouseEvent, messageId: number) => {
    e.preventDefault();
    const message = messages.find(m => m.id === messageId);
    if (message && message.senderId === user.id && !message.isRecalled) {
      setContextMenu({ messageId, x: e.clientX, y: e.clientY });
    }
  };

  const handleBlockToggle = async () => {
    if (!targetId) return;
    try {
      if (blocked) { await api.unblockUser(user.id, targetId); setBlocked(false); }
      else { await api.blockUser(user.id, targetId); setBlocked(true); }
      setError('');
    } catch (err) { setError(err instanceof Error ? err.message : 'Lỗi'); }
  };

  return (
    <>
    <div className="chat-page messenger-layout">
      <aside className="chat-sidebar">
        <div className="chat-sidebar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Đoạn chat</h2>
          {user.role === 'school_union' && (
            <button
              className="btn btn-primary"
              onClick={() => setShowBulkMessageModal(true)}
              style={{ padding: '6px 12px', fontSize: '12px' }}
            >
              📨 Gửi tin cho đoàn
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '4px', padding: '8px 12px' }}>
          <button type="button" onClick={() => setSidebarSection('all')} style={{
            flex: 1, padding: '6px 8px', border: 'none', borderRadius: '6px',
            background: sidebarSection === 'all' ? '#1876f2' : '#e4e6eb',
            color: sidebarSection === 'all' ? '#fff' : '#050505', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
          }}>Tất cả</button>
          <button type="button" onClick={() => setSidebarSection('groups')} style={{
            flex: 1, padding: '6px 8px', border: 'none', borderRadius: '6px',
            background: sidebarSection === 'groups' ? '#1876f2' : '#e4e6eb',
            color: sidebarSection === 'groups' ? '#fff' : '#050505', cursor: 'pointer', fontSize: '13px', fontWeight: 500,
          }}>Nhóm</button>
        </div>
        <div className="chat-conversation-list">
          {(sidebarSection === 'all' || sidebarSection === 'groups') && conversations.length === 0 && groups.length === 0 && sidebarSection === 'all' && (
            <div className="subtle" style={{ padding: 16 }}>Chưa có cuộc trò chuyện.</div>
          )}
          {sidebarSection === 'groups' && groups.length === 0 && (
            <div className="subtle" style={{ padding: 16 }}>Chưa có nhóm nào.</div>
          )}
          {sidebarSection === 'all' && conversations.map((c) => (
            <button key={`user-${c.otherId}`} className={`chat-conversation-item ${targetId === c.otherId ? 'active' : ''}`} type="button" onClick={() => navigate(`/chat/${c.otherId}`)}>
              <div className="chat-conv-avatar">{c.otherAvatar ? <img src={c.otherAvatar} alt={c.otherName} /> : initials(c.otherName)}</div>
              <div className="chat-conv-info">
                <div className="chat-conv-name">{c.otherName}{c.unread > 0 && <span className="chat-unread-badge">{c.unread}</span>}</div>
                <div className="chat-conv-preview">{c.lastContent}</div>
              </div>
            </button>
          ))}
          {(sidebarSection === 'all' || sidebarSection === 'groups') && groups.map((g) => (
            <button key={`group-${g.groupId}`} className={`chat-conversation-item ${targetGroupId === g.groupId ? 'active' : ''}`} type="button" onClick={() => navigate(`/chat/group/${g.groupId}`)}>
              <div className="chat-conv-avatar">{g.groupAvatar ? <img src={g.groupAvatar} alt={g.groupName} /> : '👥'}</div>
              <div className="chat-conv-info">
                <div className="chat-conv-name">{g.groupName}</div>
                <div className="chat-conv-preview">{g.lastContent}</div>
              </div>
            </button>
          ))}
        </div>
      </aside>

      <section className="chat-main">
        {targetGroupId && selectedGroup ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div className="chat-header">
              <Link to={`/groups/${targetGroupId}`} className="chat-header-user" style={{ textDecoration: 'none' }}>
                <div className="chat-header-avatar">{selectedGroup.avatar ? <img src={selectedGroup.avatar} alt={selectedGroup.name} /> : '👥'}</div>
                <strong>{selectedGroup.name}</strong>
              </Link>
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <GroupChat groupId={targetGroupId} user={user} members={groupMembers} fillHeight />
            </div>
          </div>
        ) : !targetId || targetId === user.id ? (
          <div className="chat-empty">
            <div className="subtle">Chọn một cuộc trò chuyện để bắt đầu nhắn tin.</div>
          </div>
        ) : (
          <>
            <div className="chat-header">
              <Link to={`/users/${targetId}`} className="chat-header-user">
                <div className="chat-header-avatar">{otherUser?.avatar ? <img src={otherUser.avatar} alt={otherUser.fullName} /> : initials(otherUser?.fullName ?? '?')}</div>
                <strong>{otherUser?.fullName ?? 'Người dùng'}</strong>
              </Link>
            </div>

            <div className="chat-messages" onClick={() => setContextMenu(null)}>
              {loading && messages.length === 0 && <div className="subtle">Đang tải...</div>}
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  isOwn={m.senderId === user.id}
                  onImageClick={(url) => setViewerImage(url)}
                  onContextMenu={handleMessageContextMenu}
                  onRecall={handleRecallMessage}
                />
              ))}
              <div ref={bottomRef} />
            </div>

            {contextMenu && (
              <div className="chat-context-menu" style={{ position: 'fixed', left: contextMenu.x, top: contextMenu.y, zIndex: 1000 }}>
                <button className="chat-context-item" onClick={() => handleRecallMessage(contextMenu.messageId)}>Thu hồi tin nhắn</button>
              </div>
            )}

            {error && <div className="form-error" style={{ margin: '0 16px' }}>{error}</div>}

            <ChatComposer onSend={send} />
          </>
        )}
      </section>

      {targetGroupId && selectedGroup ? (
        <aside className="chat-right-sidebar">
          <div className="chat-right-profile">
            <div className="chat-right-avatar">{selectedGroup.avatar ? <img src={selectedGroup.avatar} alt={selectedGroup.name} /> : '👥'}</div>
            <strong className="chat-right-name">{selectedGroup.name}</strong>
            <div className="subtle" style={{ fontSize: 12, marginTop: 4 }}>{selectedGroup.memberCount} thành viên</div>
          </div>
          <div className="chat-right-actions">
            <button className="chat-right-action" type="button" onClick={() => navigate(`/groups/${targetGroupId}`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              Xem trang nhóm
            </button>
          </div>
        </aside>
      ) : targetId && targetId !== user.id && (
        <aside className="chat-right-sidebar">
          <div className="chat-right-profile">
            <div className="chat-right-avatar">{otherUser?.avatar ? <img src={otherUser.avatar} alt={otherUser.fullName} /> : initials(otherUser?.fullName ?? '?')}</div>
            <strong className="chat-right-name">{otherUser?.fullName ?? '...'}</strong>
          </div>
          <div className="chat-right-actions">
            <button className="chat-right-action" type="button" onClick={() => navigate(`/users/${targetId}`)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Xem trang cá nhân
            </button>
            <button className="chat-right-action danger" type="button" onClick={handleBlockToggle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
              {blocked ? 'Bỏ chặn' : 'Chặn'}
            </button>
          </div>
        </aside>
      )}
    </div>

    {viewerImage && (
      <div className="image-viewer" onClick={() => setViewerImage(null)} role="presentation">
        <img src={resolveMediaUrl(viewerImage)} alt="viewer" />
      </div>
    )}

    {showBulkMessageModal && (
      <BulkMessageModal
        currentUser={user}
        onClose={() => setShowBulkMessageModal(false)}
      />
    )}
    </>
  );
}

export default ChatPage;
