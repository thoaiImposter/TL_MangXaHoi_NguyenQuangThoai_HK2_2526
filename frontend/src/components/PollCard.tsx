import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { GroupPost, PollOption, PollResults, Post } from '../types';

interface PollCardProps {
  post: Post | GroupPost;
  userId: number;
}

export default function PollCard({ post, userId }: PollCardProps) {
  const postId = 'postId' in post && post.postId ? post.postId : post.id;
  const [results, setResults] = useState<PollResults | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const data = await api.getPollResults(postId, userId);
      setResults(data);
      setSelected(data.options.filter((option) => option.votedByMe).map((option) => option.id));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không tải được cuộc bình chọn');
    }
  };

  useEffect(() => {
    load();
  }, [postId, userId]);

  const ended = Boolean(results?.isEnded || (post.pollEndDate && new Date(post.pollEndDate) < new Date()));

  const toggle = (optionId: number) => {
    if (!results || results.hasVoted || ended) return;
    setSelected((current) => results.allowMultiple
      ? current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId]
      : [optionId]);
  };

  const vote = async () => {
    if (!selected.length || working) return;
    setWorking(true);
    try {
      setResults(await api.votePoll(postId, userId, selected));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể bình chọn');
    } finally {
      setWorking(false);
    }
  };

  const removeVote = async () => {
    setWorking(true);
    try {
      await api.removePollVote(postId, userId);
      await load();
      setSelected([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể hủy bình chọn');
    } finally {
      setWorking(false);
    }
  };

  if (error && !results) return <div className="poll-card poll-error">{error}</div>;
  if (!results) return <div className="poll-card poll-loading">Đang tải cuộc bình chọn...</div>;

  return (
    <section className="poll-card" data-poll-card>
      <header className="poll-card-head">
        <div><span className="poll-card-icon">▥</span><strong>Cuộc bình chọn</strong></div>
        <span className={`poll-status ${ended ? 'ended' : ''}`}>{ended ? 'Đã kết thúc' : 'Đang diễn ra'}</span>
      </header>
      <h3 className="poll-question">{post.title}</h3>
      <div className="poll-options">
        {results.options.map((option: PollOption) => {
          const active = results.hasVoted ? Boolean(option.votedByMe) : selected.includes(option.id);
          return (
            <button className={`poll-option ${active ? 'selected' : ''}`} disabled={results.hasVoted || ended} key={option.id} type="button" onClick={() => toggle(option.id)}>
              {results.hasVoted && <span className="poll-progress" style={{ width: `${option.percentage || 0}%` }} />}
              <span className={`poll-choice ${results.allowMultiple ? 'multiple' : ''}`}>{active ? '✓' : ''}</span>
              <span className="poll-option-label">{option.optionText}</span>
              {results.hasVoted && <span className="poll-result"><strong>{option.percentage?.toFixed(0) || 0}%</strong><small>{option.voteCount || 0} lượt</small></span>}
            </button>
          );
        })}
      </div>
      <footer className="poll-card-foot">
        <div><strong>{results.totalVotes}</strong> lượt bình chọn{results.allowMultiple ? ' · Chọn nhiều phương án' : ''}{post.pollEndDate ? ` · Kết thúc ${new Date(post.pollEndDate).toLocaleString('vi-VN')}` : ''}</div>
        <div className="poll-actions">
          {!results.hasVoted && !ended && <button className="btn btn-primary btn-sm" disabled={!selected.length || working} type="button" onClick={vote}>{working ? 'Đang gửi...' : 'Bình chọn'}</button>}
          {results.hasVoted && !ended && <button className="btn btn-secondary btn-sm" disabled={working} type="button" onClick={removeVote}>Đổi lựa chọn</button>}
        </div>
      </footer>
      {error && <div className="alert alert-error">{error}</div>}
    </section>
  );
}
