import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { User } from '../types';

type BulkMessageModalProps = {
  currentUser: User;
  onClose: () => void;
};

type FacultyUnionUser = {
  id: number;
  fullName: string;
  email: string;
  avatar: string | null;
  faculty: string | null;
};

export default function BulkMessageModal({ currentUser, onClose }: BulkMessageModalProps) {
  const [activeTab, setActiveTab] = useState<'compose' | 'recipients'>('compose');
  const [message, setMessage] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [facultyUnions, setFacultyUnions] = useState<FacultyUnionUser[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sendResult, setSendResult] = useState<{ success: number; failed: number } | null>(null);

  // Load faculty union users
  useEffect(() => {
    loadFacultyUnions();
  }, []);

  const loadFacultyUnions = async () => {
    setLoading(true);
    try {
      const recipients = await api.getFacultyUnions(currentUser.id);
      setFacultyUnions(recipients.filter((u: User) => u.id !== currentUser.id));
    } catch (error) {
      console.error('Failed to load faculty unions:', error);
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(file.type.startsWith('image/') ? URL.createObjectURL(file) : null);
    }
  };

  const toggleRecipient = (userId: number) => {
    setSelectedRecipients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedRecipients.size === filteredUnions.length) {
      setSelectedRecipients(new Set());
    } else {
      setSelectedRecipients(new Set(filteredUnions.map(u => u.id)));
    }
  };

  const filteredUnions = facultyUnions.filter(u =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.faculty && u.faculty.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleSend = async () => {
    if (selectedRecipients.size === 0) {
      alert('Vui lòng chọn ít nhất một người nhận');
      return;
    }
    if (!message.trim() && !mediaFile) {
      alert('Vui lòng nhập nội dung hoặc đính kèm file');
      return;
    }

    setSending(true);
    setSendResult(null);

    let successCount = 0;
    let failedCount = 0;

    try {
      const mediaUrl = mediaFile
        ? (await api.uploadFile(
            mediaFile,
            mediaFile.type.startsWith('image/') ? 'image' : mediaFile.type.startsWith('video/') ? 'video' : 'file',
            'messages'
          )).mediaUrl
        : undefined;

      // If both media and content, send media first, then content
      for (const recipientId of selectedRecipients) {
        try {
          if (mediaUrl && message.trim()) {
            // Send media first
            await api.sendMessage(currentUser.id, recipientId, '', mediaUrl);
            // Then send content
            await api.sendMessage(currentUser.id, recipientId, message, undefined);
            successCount++;
          } else if (mediaUrl) {
            await api.sendMessage(currentUser.id, recipientId, '', mediaUrl);
            successCount++;
          } else if (message.trim()) {
            await api.sendMessage(currentUser.id, recipientId, message, undefined);
            successCount++;
          }
        } catch (err) {
          console.error(`Failed to send to user ${recipientId}:`, err);
          failedCount++;
        }
      }
      setSendResult({ success: successCount, failed: failedCount });
    } catch (error) {
      console.error('Bulk send error:', error);
      alert('Có lỗi xảy ra khi gửi tin nhắn');
    } finally {
      setSending(false);
    }
  };

  const initials = (name: string) => (name?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e4e6eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '20px' }}>📨 Gửi tin nhắn cho đoàn khoa</h2>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#65676b' }}
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e4e6eb' }}>
          <button
            onClick={() => setActiveTab('compose')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'compose' ? '#e7f3ff' : 'transparent',
              color: activeTab === 'compose' ? '#1876f2' : '#65676b',
              fontWeight: activeTab === 'compose' ? '600' : '400',
              fontSize: '14px',
              borderBottom: activeTab === 'compose' ? '2px solid #1876f2' : '2px solid transparent',
            }}
          >
            Soạn tin nhắn
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            style={{
              flex: 1,
              padding: '12px',
              border: 'none',
              cursor: 'pointer',
              background: activeTab === 'recipients' ? '#e7f3ff' : 'transparent',
              color: activeTab === 'recipients' ? '#1876f2' : '#65676b',
              fontWeight: activeTab === 'recipients' ? '600' : '400',
              fontSize: '14px',
              borderBottom: activeTab === 'recipients' ? '2px solid #1876f2' : '2px solid transparent',
            }}
          >
            Chọn người nhận ({selectedRecipients.size})
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          {activeTab === 'compose' ? (
            <>
              {/* Message Input */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Nội dung tin nhắn
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Nhập nội dung tin nhắn..."
                  rows={5}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical',
                  }}
                />
              </div>

              {/* File Attachment */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  Đính kèm (hình ảnh, file)
                </label>
                {mediaPreview ? (
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img src={mediaPreview} alt="preview" style={{ maxWidth: '200px', maxHeight: '150px', borderRadius: '8px' }} />
                    <button
                      onClick={() => { setMediaFile(null); setMediaPreview(null); }}
                      style={{
                        position: 'absolute',
                        top: '-8px',
                        right: '-8px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ) : (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '20px',
                    border: '2px dashed #ddd',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    color: '#65676b',
                  }}>
                    📎 Nhấp để chọn file
                    <input
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>

              {/* Recipients Summary */}
              <div style={{ padding: '12px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontSize: '14px', color: '#65676b' }}>
                  Sẽ gửi đến <strong>{selectedRecipients.size}</strong> đoàn khoa
                </div>
              </div>

              {/* Send Button */}
              <button
                className="btn btn-primary"
                onClick={handleSend}
                disabled={sending || selectedRecipients.size === 0 || (!message.trim() && !mediaFile)}
                style={{ width: '100%', padding: '12px 20px' }}
              >
                {sending ? 'Đang gửi...' : `Gửi tin nhắn cho ${selectedRecipients.size} đoàn khoa`}
              </button>

              {/* Result */}
              {sendResult && (
                <div style={{
                  marginTop: '16px',
                  padding: '16px',
                  borderRadius: '8px',
                  background: sendResult.failed === 0 ? '#f0fdf4' : '#fef3c7',
                  border: `1px solid ${sendResult.failed === 0 ? '#bbf7d0' : '#fcd34d'}`,
                }}>
                  {sendResult.failed === 0 ? (
                    <div style={{ color: '#166534', fontWeight: '600' }}>
                      ✅ Đã gửi thành công {sendResult.success} tin nhắn!
                    </div>
                  ) : (
                    <div style={{ color: '#92400e' }}>
                      ✅ Đã gửi {sendResult.success} tin nhắn | ❌ Thất bại {sendResult.failed} tin nhắn
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Search */}
              <input
                type="text"
                placeholder="Tìm kiếm đoàn khoa theo tên hoặc khoa..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  marginBottom: '12px',
                }}
              />

              {/* Select All */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  id="selectAll"
                  checked={selectedRecipients.size === filteredUnions.length && filteredUnions.length > 0}
                  onChange={selectAll}
                />
                <label htmlFor="selectAll" style={{ cursor: 'pointer' }}>
                  Chọn tất cả ({filteredUnions.length} đoàn khoa)
                </label>
              </div>

              {/* Recipients List */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '20px', color: '#65676b' }}>
                  Đang tải...
                </div>
              ) : filteredUnions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#65676b' }}>
                  Không tìm thấy đoàn khoa nào
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
                  {filteredUnions.map((union) => (
                    <div
                      key={union.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '8px',
                        background: selectedRecipients.has(union.id) ? '#e7f3ff' : '#f8f9fa',
                        border: `1px solid ${selectedRecipients.has(union.id) ? '#1876f2' : '#e4e6eb'}`,
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleRecipient(union.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selectedRecipients.has(union.id)}
                        onChange={() => { }}
                        style={{ pointerEvents: 'none' }}
                      />
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: union.avatar ? `url(${union.avatar}) center/cover` : '#1876f2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '16px',
                          flexShrink: 0,
                        }}
                      >
                        {!union.avatar && initials(union.fullName)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '600', fontSize: '14px' }}>{union.fullName}</div>
                        <div style={{ fontSize: '12px', color: '#65676b' }}>
                          {union.faculty || union.email}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
