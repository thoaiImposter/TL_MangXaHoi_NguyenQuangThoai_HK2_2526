import type { User } from '../types';

type PostComposerBarProps = {
  user: User;
  title: string;
  subtitle: string;
  buttonLabel: string;
  onOpen: () => void;
};

function PostComposerBar({ user, title, subtitle, buttonLabel, onOpen }: PostComposerBarProps) {
  const initial = (user.fullName?.trim()?.charAt(0) || 'U').toUpperCase();

  return (
    <section className="composer composer-bar" onClick={onOpen} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && onOpen()}>
      <div className="composer-bar-top">
        <div className="composer-avatar">
          {user.avatar ? <img src={user.avatar} alt={user.fullName} /> : <span>{initial}</span>}
        </div>
        <div className="composer-copy">
          <div className="composer-title">{title}</div>
          <div className="composer-subtitle">{subtitle}</div>
        </div>
      </div>
      <button className="primary-button composer-action" type="button" onClick={onOpen}>
        {buttonLabel}
      </button>
    </section>
  );
}

export default PostComposerBar;
