import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import type { Message, User, GroupMember } from '../types';

interface GroupChatProps {
  groupId: number;
  user: User;
  members: GroupMember[];
  fillHeight?: boolean;
}

interface WebSocketMessage {
  type: string;
  messageId: number;
  senderId: number;
  senderName: string;
  senderAvatar: string | null;
  groupId: number;
  groupName: string;
  groupAvatar: string | null;
  content: string;
  mediaUrl: string;
  mentionedUserIds: string | null;
  isAllMentioned: boolean;
  isRecalled: boolean;
  createdAt: string;
}

export default function GroupChat({ groupId, user, members, fillHeight = false }: GroupChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || 0;
  const activeMembers = members.filter(m => m.status === 'active');

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  useEffect(() => {
    if (groupId && userId) { loadMessages(); connectWebSocket(); }
    return () => { disconnectWebSocket(); };
  }, [groupId, userId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const data = await api.getGroupMessages(groupId, userId, 0, 50);
      setMessages(data.reverse());
    } catch (error) { console.error('Failed to load group messages:', error); }
    setLoading(false);
  };

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8080/ws/chat');
    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', userId }));
      setWsConnected(true);
      api.joinGroupChat(groupId, userId).catch(console.error);
    };
    ws.onmessage = (event) => {
      try {
        const data: WebSocketMessage = JSON.parse(event.data);
        if (data.type === 'new_group_message') {
          const exists = messages.some(m => m.id === data.messageId);
          if (!exists) {
            setMessages(prev => [...prev, {
              id: data.messageId, senderId: data.senderId, senderName: data.senderName,
              senderAvatar: data.senderAvatar, receiverId: null, receiverName: null, receiverAvatar: null,
              groupId: data.groupId, groupName: data.groupName, groupAvatar: data.groupAvatar,
              content: data.content, mediaUrl: data.mediaUrl || null, isRead: false,
              isRecalled: data.isRecalled, mentionedUserIds: data.mentionedUserIds,
              isAllMentioned: data.isAllMentioned, createdAt: data.createdAt,
            }]);
          }
        } else if (data.type === 'message_recalled') {
          setMessages(prev => prev.map(m => m.id === data.messageId ? { ...m, isRecalled: true, content: '', mediaUrl: null } : m));
        }
      } catch (error) { console.error('WebSocket message error:', error); }
    };
    ws.onclose = () => {
      setWsConnected(false);
      setTimeout(() => { if (groupId && userId) connectWebSocket(); }, 3000);
    };
    ws.onerror = () => { console.error('WebSocket error'); };
    wsRef.current = ws;
  };

  const disconnectWebSocket = () => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    if (groupId && userId) api.leaveGroupChat(groupId, userId).catch(console.error);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(JSON.stringify({ type: 'ping' }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSend = async (content: string, mediaUrl: string | null) => {
    if (!content.trim() && !mediaUrl) return;
    if (!wsConnected) { alert('Không kết nối được với máy chủ chat'); return; }
    try {
      await api.sendGroupMessage(groupId, userId, content, mediaUrl ?? undefined, [], false);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert('Không thể gửi tin nhắn: ' + (error?.message || 'Lỗi không xác định'));
    }
  };

  const handleRecall = async (messageId: number) => {
    if (!confirm('Bạn có chắc muốn thu hồi tin nhắn này?')) return;
    try { await api.recallMessage(messageId, userId); }
    catch (error: any) { alert('Không thể thu hồi: ' + (error?.message || 'Lỗi')); }
  };

  // Group messages by date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hôm nay';
    if (days === 1) return 'Hôm qua';
    return date.toLocaleDateString('vi-VN');
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {} as Record<string, Message[]>);

  return (
    <>
    <div className={`group-chat-container ${fillHeight ? 'fill-height' : ''}`}>
      {/* Header */}
      <div className="group-chat-header">
        <div>
          <strong>Tin nhắn nhóm</strong>
          <div className="group-chat-subtitle">
            {activeMembers.length} thành viên • {wsConnected ? '🟢 Online' : '🔴 Offline'}
          </div>
        </div>
        <button className="group-chat-members-btn" onClick={() => setShowMembers(!showMembers)}>
          👥 Thành viên
        </button>
      </div>

      {/* Members List */}
      {showMembers && (
        <div className="group-chat-members-list">
          <div className="group-chat-members-count">Thành viên ({activeMembers.length})</div>
          <div className="group-chat-members-chips">
            {activeMembers.map(member => (
              <span key={member.id} className={`group-chat-member-chip ${member.userId === userId ? 'self' : ''}`}>
                {member.userId === userId ? '👉 ' : ''}{member.userName}
                {member.role === 'gold_key' && ' 👑'}
                {member.role === 'silver_key' && ' 🛡'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="group-chat-messages">
        {loading ? (
          <div className="group-chat-loading">Đang tải tin nhắn...</div>
        ) : messages.length === 0 ? (
          <div className="group-chat-empty">Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!</div>
        ) : (
          Object.entries(groupedMessages).map(([date, msgs]) => (
            <div key={date}>
              <div className="chat-date-divider">
                <span>{date}</span>
              </div>
              {msgs.map(msg => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  isOwn={msg.senderId === userId}
                  showAvatar
                  showSenderName={!msg.senderId || msg.senderId !== userId}
                  onImageClick={(url) => setViewerImage(url)}
                  onRecall={handleRecall}
                />
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <ChatComposer onSend={handleSend} placeholder="Nhập tin nhắn nhóm..." />
    </div>

    {viewerImage && (
      <div className="image-viewer" onClick={() => setViewerImage(null)} role="presentation">
        <img src={viewerImage} alt="viewer" />
      </div>
    )}
    </>
  );
}
