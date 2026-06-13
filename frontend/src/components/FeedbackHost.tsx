import { useEffect, useState } from 'react';
import {
  notify,
  subscribeToConfirm,
  subscribeToToasts,
  type ConfirmFeedback,
  type ToastFeedback,
} from '../lib/feedback';

const toneTitle = {
  success: 'Thành công',
  error: 'Có lỗi xảy ra',
  warning: 'Cần chú ý',
  info: 'Thông báo',
};

export default function FeedbackHost() {
  const [toasts, setToasts] = useState<ToastFeedback[]>([]);
  const [confirmation, setConfirmation] = useState<ConfirmFeedback | null>(null);

  useEffect(() => {
    const unsubscribeToast = subscribeToToasts((toast) => {
      setToasts((current) => [...current.slice(-3), toast]);
      window.setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== toast.id));
      }, 4200);
    });
    const unsubscribeConfirm = subscribeToConfirm(setConfirmation);
    const nativeAlert = window.alert;
    window.alert = (message?: unknown) => notify(message);

    return () => {
      unsubscribeToast();
      unsubscribeConfirm();
      window.alert = nativeAlert;
    };
  }, []);

  const finishConfirm = (confirmed: boolean) => {
    confirmation?.resolve(confirmed);
    setConfirmation(null);
  };

  return (
    <>
      <div className="feedback-toast-stack" aria-live="polite" aria-atomic="true">
        {toasts.map((toast) => (
          <div className={`feedback-toast feedback-toast-${toast.tone}`} key={toast.id}>
            <span className="feedback-toast-mark" aria-hidden="true" />
            <div>
              <strong>{toneTitle[toast.tone]}</strong>
              <p>{toast.message}</p>
            </div>
            <button type="button" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} aria-label="Đóng">
              ×
            </button>
          </div>
        ))}
      </div>

      {confirmation && (
        <div className="feedback-confirm-backdrop" role="presentation" onClick={() => finishConfirm(false)}>
          <div className="feedback-confirm" role="alertdialog" aria-modal="true" aria-labelledby="feedback-confirm-title" onClick={(event) => event.stopPropagation()}>
            <div className={`feedback-confirm-icon ${confirmation.danger ? 'danger' : ''}`} aria-hidden="true">!</div>
            <div>
              <h2 id="feedback-confirm-title">{confirmation.title ?? 'Xác nhận thao tác'}</h2>
              <p>{confirmation.message}</p>
            </div>
            <div className="feedback-confirm-actions">
              <button className="btn btn-secondary" type="button" onClick={() => finishConfirm(false)}>Hủy</button>
              <button className={`btn ${confirmation.danger ? 'btn-danger' : 'btn-primary'}`} type="button" onClick={() => finishConfirm(true)}>
                {confirmation.confirmLabel ?? 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
