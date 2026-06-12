import { useState } from 'react';

interface PollCreatorProps {
  onSubmit: (data: { title: string; content: string; options: string[]; endDate?: string; allowMultiple: boolean }) => void;
  onCancel: () => void;
}

export default function PollCreator({ onSubmit, onCancel }: PollCreatorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [endDate, setEndDate] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setOptions(newOptions);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bình chọn');
      return;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      alert('Vui lòng nhập ít nhất 2 phương án');
      return;
    }

    onSubmit({
      title,
      content,
      options: validOptions,
      endDate: endDate || undefined,
      allowMultiple,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '16px' }}>📊 Tạo cuộc bình chọn</h3>

      {/* Title */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Tiêu đề *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bạn muốn hỏi gì?"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Nội dung (tùy chọn)
        </label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Mô tả thêm về cuộc bình chọn..."
          rows={3}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      {/* Options */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          Phương án *
        </label>
        {options.map((option, index) => (
          <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Phương án ${index + 1}`}
              style={{
                flex: 1,
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
              }}
            />
            {options.length > 2 && (
              <button
                type="button"
                onClick={() => removeOption(index)}
                style={{
                  padding: '8px 12px',
                  border: 'none',
                  background: '#dc3545',
                  color: '#fff',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}

        {options.length < 10 && (
          <button
            type="button"
            onClick={addOption}
            style={{
              padding: '8px 16px',
              border: '1px dashed #1876f2',
              background: 'transparent',
              color: '#1876f2',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              width: '100%',
            }}
          >
            + Thêm phương án
          </button>
        )}
      </div>

      {/* End date */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
          Thời gian kết thúc (tùy chọn)
        </label>
        <input
          type="datetime-local"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={new Date().toISOString().slice(0, 16)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <small style={{ color: '#65676b', fontSize: '12px' }}>
          Để trống nếu không muốn đặt thời gian kết thúc
        </small>
      </div>

      {/* Allow multiple choices */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(e) => setAllowMultiple(e.target.checked)}
            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
          />
          <span>Cho phép chọn nhiều phương án</span>
        </label>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          style={{ padding: '10px 20px' }}
        >
          Hủy
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '10px 20px' }}
        >
          Tạo bình chọn
        </button>
      </div>
    </form>
  );
}