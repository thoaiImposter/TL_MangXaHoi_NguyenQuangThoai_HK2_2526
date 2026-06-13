export type FeedbackTone = 'success' | 'error' | 'warning' | 'info';

export type ToastFeedback = {
  id: number;
  message: string;
  tone: FeedbackTone;
};

export type ConfirmFeedback = {
  title?: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  resolve: (confirmed: boolean) => void;
};

type ToastListener = (toast: ToastFeedback) => void;
type ConfirmListener = (request: ConfirmFeedback) => void;

const toastListeners = new Set<ToastListener>();
const confirmListeners = new Set<ConfirmListener>();
let toastId = 0;

const inferTone = (message: string): FeedbackTone => {
  const normalized = message.toLocaleLowerCase('vi');
  if (/(không thể|không |lỗi|thất bại|failed|error)/.test(normalized)) return 'error';
  if (/(cảnh báo|vui lòng|chắc|yêu cầu)/.test(normalized)) return 'warning';
  if (/(đã |thành công|xong)/.test(normalized)) return 'success';
  return 'info';
};

export function notify(message: unknown, tone?: FeedbackTone) {
  const text = String(message ?? '').trim();
  if (!text) return;
  const toast = { id: ++toastId, message: text, tone: tone ?? inferTone(text) };
  toastListeners.forEach((listener) => listener(toast));
}

export function confirmAction(
  message: string,
  options: Omit<ConfirmFeedback, 'message' | 'resolve'> = {},
) {
  if (!confirmListeners.size) return Promise.resolve(window.confirm(message));
  return new Promise<boolean>((resolve) => {
    const request = { ...options, message, resolve };
    confirmListeners.forEach((listener) => listener(request));
  });
}

export function subscribeToToasts(listener: ToastListener) {
  toastListeners.add(listener);
  return () => toastListeners.delete(listener);
}

export function subscribeToConfirm(listener: ConfirmListener) {
  confirmListeners.add(listener);
  return () => confirmListeners.delete(listener);
}
