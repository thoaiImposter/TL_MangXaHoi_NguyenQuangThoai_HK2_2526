import { useState } from 'react';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

export type PollDraft = {
  title: string;
  content: string;
  visibility?: 'public' | 'friends' | 'private';
  options: string[];
  endDate?: string;
  allowMultiple: boolean;
};

interface PollCreatorProps {
  onSubmit: (data: PollDraft) => void;
  onCancel: () => void;
  showVisibility?: boolean;
  submitting?: boolean;
}

export default function PollCreator({ onSubmit, onCancel, showVisibility = false, submitting = false }: PollCreatorProps) {
  useModalScrollLock();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [options, setOptions] = useState(['', '']);
  const [endDate, setEndDate] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const question = title.trim();
    const validOptions = options.map((option) => option.trim()).filter(Boolean);
    if (!question) return setError('Vui lòng nhập câu hỏi bình chọn.');
    if (validOptions.length < 2) return setError('Cần ít nhất 2 phương án.');
    if (new Set(validOptions.map((option) => option.toLocaleLowerCase('vi'))).size !== validOptions.length) {
      return setError('Các phương án không được trùng nhau.');
    }
    setError('');
    onSubmit({ title: question, content: content.trim(), visibility: showVisibility ? visibility : undefined, options: validOptions, endDate: endDate || undefined, allowMultiple });
  };

  return (
    <form className="poll-creator" onSubmit={handleSubmit}>
      <div className="poll-creator-heading"><span className="poll-creator-icon">▥</span><div><p className="eyebrow">Bình chọn</p><h2 className="modal-title">Tạo cuộc bình chọn</h2></div></div>
      {showVisibility && <div className="poll-visibility">{([['public', 'Công khai'], ['friends', 'Bạn bè'], ['private', 'Riêng tư']] as const).map(([value, label]) => <button className={`chip ${visibility === value ? 'active' : ''}`} key={value} type="button" onClick={() => setVisibility(value)}>{label}</button>)}</div>}
      <label className="poll-field"><span>Câu hỏi</span><input className="form-input" value={title} maxLength={255} onChange={(event) => setTitle(event.target.value)} placeholder="Bạn muốn hỏi mọi người điều gì?" /></label>
      <label className="poll-field"><span>Mô tả <small>(không bắt buộc)</small></span><textarea className="form-input form-textarea" rows={2} value={content} onChange={(event) => setContent(event.target.value)} placeholder="Thêm một chút ngữ cảnh..." /></label>
      <div className="poll-field">
        <span>Phương án</span>
        <div className="poll-option-editor">{options.map((option, index) => <div className="poll-option-input" key={index}><span>{index + 1}</span><input className="form-input" value={option} maxLength={255} onChange={(event) => setOptions((current) => current.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder={`Phương án ${index + 1}`} />{options.length > 2 && <button type="button" aria-label="Xóa phương án" onClick={() => setOptions((current) => current.filter((_, itemIndex) => itemIndex !== index))}>×</button>}</div>)}</div>
        {options.length < 10 && <button className="poll-add-option" type="button" onClick={() => setOptions((current) => [...current, ''])}>+ Thêm phương án</button>}
      </div>
      <div className="poll-settings">
        <label className="poll-field"><span>Kết thúc lúc <small>(không bắt buộc)</small></span><input className="form-input" type="datetime-local" value={endDate} min={new Date().toISOString().slice(0, 16)} onChange={(event) => setEndDate(event.target.value)} /></label>
        <label className="poll-check"><input type="checkbox" checked={allowMultiple} onChange={(event) => setAllowMultiple(event.target.checked)} /><span><strong>Cho phép chọn nhiều</strong><small>Người tham gia có thể chọn hơn một phương án.</small></span></label>
      </div>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="poll-creator-actions"><button className="btn btn-secondary" type="button" onClick={onCancel} disabled={submitting}>Hủy</button><button className="btn btn-primary" type="submit" disabled={submitting}>{submitting ? 'Đang tạo...' : 'Đăng bình chọn'}</button></div>
    </form>
  );
}
