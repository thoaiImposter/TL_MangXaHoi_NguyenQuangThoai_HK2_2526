import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { Post, GroupPost, PollResults, PollOption } from '../types';

interface PollCardProps {
  post: Post | GroupPost;
  userId: number;
}

export default function PollCard({ post, userId }: PollCardProps) {
  const [pollResults, setPollResults] = useState<PollResults | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [voting, setVoting] = useState(false);

  // Get the actual post ID (GroupPost uses postId, Post uses id)
  const getPostId = () => {
    if ('postId' in post && post.postId) return post.postId;
    return post.id;
  };

  useEffect(() => {
    loadPollResults();
  }, [getPostId()]);

  const loadPollResults = async () => {
    try {
      const postId = getPostId();
      const results = await api.getPollResults(postId, userId);
      setPollResults(results);
      // If user has voted, pre-select their options
      if (results.hasVoted) {
        const votedOptionIds = results.options
          .filter((opt: PollOption) => opt.votedByMe)
          .map((opt: PollOption) => opt.id);
        setSelectedOptions(votedOptionIds);
      }
    } catch (error) {
      console.error('Failed to load poll results:', error);
    }
  };

  const handleOptionToggle = (optionId: number) => {
    if (pollResults?.hasVoted || pollResults?.isEnded) return;

    if (pollResults?.allowMultiple) {
      setSelectedOptions(prev =>
        prev.includes(optionId)
          ? prev.filter(id => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleVote = async () => {
    if (selectedOptions.length === 0 || voting) return;

    setVoting(true);
    try {
      const postId = getPostId();
      const results = await api.votePoll(postId, userId, selectedOptions);
      setPollResults(results);
      alert('Đã bình chọn thành công!');
    } catch (error: any) {
      alert('Không thể bình chọn: ' + (error?.message || 'Lỗi không xác định'));
    } finally {
      setVoting(false);
    }
  };

  const handleRemoveVote = async () => {
    try {
      const postId = getPostId();
      await api.removePollVote(postId, userId);
      loadPollResults();
      setSelectedOptions([]);
      alert('Đã hủy bình chọn!');
    } catch (error) {
      console.error('Failed to remove vote:', error);
    }
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const isPollEnded = pollResults?.isEnded || (post.pollEndDate && new Date(post.pollEndDate) < new Date());

  if (!pollResults) {
    return <div>Đang tải bình chọn...</div>;
  }

  return (
    <div data-poll-card style={{ padding: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#f8f9fa' }}>
      <div style={{ marginBottom: '16px', fontWeight: '600', fontSize: '16px' }}>
        📊 Cuộc bình chọn
      </div>

      {/* Poll options */}
      <div style={{ marginBottom: '16px' }}>
        {pollResults.options.map((option: PollOption) => {
          const isSelected = pollResults.hasVoted
            ? option.votedByMe
            : selectedOptions.includes(option.id);
          return (
            <div
              key={option.id}
              onClick={() => handleOptionToggle(option.id)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                border: `2px solid ${isSelected ? '#1876f2' : '#ddd'}`,
                borderRadius: '8px',
                cursor: pollResults.hasVoted || isPollEnded ? 'default' : 'pointer',
                background: isSelected ? '#e7f3ff' : '#fff',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s',
              }}
            >
              {/* Progress bar background for voted polls */}
              {pollResults.hasVoted && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: `${option.percentage || 0}%`,
                    background: option.votedByMe ? 'rgba(24, 118, 242, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                    transition: 'width 0.3s',
                  }}
                />
              )}

              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {/* Custom radio/checkbox */}
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: pollResults.allowMultiple ? '4px' : '50%',
                    border: `2px solid ${isSelected ? '#1876f2' : '#ddd'}`,
                    background: isSelected ? '#1876f2' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && (
                    <span style={{ color: '#fff', fontSize: '12px' }}>✓</span>
                  )}
                </div>

                <span style={{ flex: 1 }}>{option.optionText}</span>

                {/* Show results if voted */}
                {pollResults.hasVoted && (
                  <>
                    <span style={{ fontWeight: '600', color: '#65676b' }}>
                      {option.percentage?.toFixed(1) || 0}%
                    </span>
                    <span style={{ fontSize: '12px', color: '#65676b' }}>
                      ({option.voteCount || 0} lượt)
                    </span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Poll info */}
      <div style={{ fontSize: '12px', color: '#65676b', marginBottom: '12px' }}>
        <div>
          {pollResults.totalVotes} lượt bình chọn
          {post.pollAllowMultiple && ' (có thể chọn nhiều)'}
        </div>
        {post.pollEndDate && (
          <div>
            Kết thúc: {formatDate(post.pollEndDate)}
            {isPollEnded && <span style={{ color: '#dc3545' }}> (Đã kết thúc)</span>}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        {!pollResults.hasVoted && !isPollEnded && selectedOptions.length > 0 && (
          <button
            className="btn btn-primary"
            onClick={handleVote}
            disabled={voting}
            style={{ padding: '8px 20px' }}
          >
            {voting ? 'Đang bình chọn...' : 'Bình chọn'}
          </button>
        )}

        {pollResults.hasVoted && !isPollEnded && (
          <button
            className="btn btn-secondary"
            onClick={handleRemoveVote}
            style={{ padding: '8px 20px' }}
          >
            Hủy bình chọn
          </button>
        )}
      </div>
    </div>
  );
}