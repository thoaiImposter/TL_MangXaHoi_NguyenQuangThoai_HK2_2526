import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import GroupChat from './GroupChat';
import ChatMessage from './ChatMessage';
import ChatComposer from './ChatComposer';
import type { Group, GroupMember, Message, User } from '../types';

type MiniChatProps = {
  userId?: number;
  groupId?: number;
  currentUser: User;
  minimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
};

function MiniChat({ userId, groupId, currentUser, minimized, onClose, onToggleMinimize }: MiniChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<{ fullName: string; avatar?: string | null } | null>(null);
  const [groupInfo, setGroupInfo] = useState<Group | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const isGroup = !!groupId;

  const initials = (name: string) => (name?.trim()?.charAt(0) || 'U').toUpperCase();

  const loadChat = async () => {
    if (!userId) return;
    try {
      const [msgs, profile] = await Promise.all([
        api.getMessages(currentUser.id, userId),
        api.getProfile(userId).catch(() => null),
      ]);
      setMessages(msgs);
      if (profile) setOtherUser({ fullName: profile.fullName, avatar: profile.avatar });
      await api.markRead(currentUser.id, userId);
    } catch { /* ignore */ }
  };

  const loadGroupInfo = async () => {
    if (!groupId) return;
    try {
      const [g, members] = await Promise.all([api.getGroup(groupId), api.getGroupMembers(groupId)]);
      setGroupInfo(g);
      setGroupMembers(members);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (isGroup) {
      loadGroupInfo();
    } else {
      loadChat();
      const interval = setInterval(loadChat, 1500);
      return () => clearInterval(interval);
    }
  }, [userId, groupId, currentUser.id]);

  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, minimized]);

  const send = async (content: string, mediaUrl: string | null) => {
    if (!content && !mediaUrl) return;
    try {
      await api.sendMessage(currentUser.id, userId!, content, mediaUrl ?? undefined);
      await loadChat();
    } catch (err) {
      console.error('MiniChat send error:', err);
    }
  };

  const headerName = isGroup ? (groupInfo?.name ?? 'Nhóm') : (otherUser?.fullName ?? '...');
  const headerAvatar = isGroup
    ? (groupInfo?.avatar ? <img src={groupInfo.avatar} alt={groupInfo.name} /> : '👥')
    : (otherUser?.avatar ? <img src={otherUser.avatar} alt={otherUser.fullName} /> : initials(otherUser?.fullName ?? '?'));
  const headerLink = isGroup ? `/groups/${groupId}` : `/users/${userId}`;

  return (
    <>
    <div className={`mini-chat ${minimized ? 'minimized' : ''}`} style={isGroup && !minimized ? { width: '380px', height: '450px' } : undefined}>
      <div className="mini-chat-header" onClick={onToggleMinimize} role="button" tabIndex={0}>
        <Link to={headerLink} className="mini-chat-header-user" onClick={(e) => e.stopPropagation()}>
          <div className="mini-chat-header-avatar">{headerAvatar}</div>
          <span className="mini-chat-header-name">{headerName}</span>
        </Link>
        <div className="mini-chat-header-actions">
          <button className="mini-chat-btn" type="button" onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}>
            {minimized ? '▲' : '▼'}
          </button>
          <button className="mini-chat-btn" type="button" onClick={(e) => { e.stopPropagation(); onClose(); }}>✕</button>
        </div>
      </div>

      {!minimized && isGroup && groupId && (
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <GroupChat groupId={groupId} user={currentUser} members={groupMembers} fillHeight />
        </div>
      )}

      {!minimized && !isGroup && (
        <>
          <div className="mini-chat-body">
            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                isOwn={m.senderId === currentUser.id}
                compact
                onImageClick={(url) => setViewerImage(url)}
              />
            ))}
            <div ref={bottomRef} />
          </div>

          <ChatComposer onSend={send} compact />
        </>
      )}
    </div>

    {viewerImage && (
      <div className="image-viewer" onClick={() => setViewerImage(null)} role="presentation">
        <img src={viewerImage} alt="viewer" />
      </div>
    )}
    </>
  );
}

export default MiniChat;
