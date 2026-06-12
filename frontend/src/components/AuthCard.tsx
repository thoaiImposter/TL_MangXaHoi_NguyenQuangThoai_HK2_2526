import { type FormEvent, type ReactNode } from 'react';

type AuthCardProps = {
  title: string;
  subtitle: string;
  footer: ReactNode;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
};

function AuthCard({ title, subtitle, footer, onSubmit, children }: AuthCardProps) {
  return (
    <section className="auth-shell">
      <div className="auth-card">
        <aside className="auth-visual">
          <div className="auth-mark">NLU Social</div>
          <div>
            <h1>Timeline your story.</h1>
            <p>
              Một lớp giao diện sáng, hiện đại, lấy nhịp từ mạng xã hội lớn nhưng giữ riêng phong cách của bạn.
            </p>
          </div>
          <div className="auth-metric">
            <strong>{title}</strong>
            <span>{subtitle}</span>
          </div>
        </aside>
        <div className="auth-form-wrap">
          <div className="auth-header">
            <span className="eyebrow">Tài khoản</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <form className="auth-form" onSubmit={onSubmit}>
            {children}
          </form>
          <div className="auth-footer">{footer}</div>
        </div>
      </div>
    </section>
  );
}

export default AuthCard;
