import PostComposer, { type PostComposerMode } from './PostComposer';
import type { User } from '../types';
import { useModalScrollLock } from '../hooks/useModalScrollLock';

type EditingPost = {
  id: number;
  content: string;
  media: { mediaUrl: string }[];
  visibility?: string;
};

type PostComposerModalProps = {
  user: User;
  mode?: PostComposerMode;
  groupId?: number;
  editingData?: EditingPost | null;
  showVisibility?: boolean;
  eyebrow?: string;
  title?: string;
  successMessage?: string;
  errorMessage?: string;
  closeDisabled?: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onCreatePoll?: () => void;
};

export default function PostComposerModal({
  user,
  mode = 'regular',
  groupId,
  editingData,
  showVisibility = false,
  eyebrow,
  title,
  successMessage,
  errorMessage,
  closeDisabled = false,
  onClose,
  onSuccess,
  onCreatePoll,
}: PostComposerModalProps) {
  useModalScrollLock();
  const modalEyebrow = eyebrow || (editingData ? 'Chỉnh sửa bài viết' : 'Tạo bài viết');
  const modalTitle = title || 'Bạn đang nghĩ gì?';

  return (
    <div className="modal-backdrop" role="presentation" onClick={() => !closeDisabled && onClose()}>
      <div className="modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">{modalEyebrow}</p>
            <h2 className="modal-title">{modalTitle}</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} disabled={closeDisabled} aria-label="Đóng">
            ×
          </button>
        </div>

        <div className="modal-body">
          <PostComposer
            key={editingData?.id || `${mode}-${groupId || 'new'}`}
            user={user}
            mode={mode}
            groupId={groupId}
            showVisibility={showVisibility}
            editingData={editingData}
            onSuccess={onSuccess}
            onClose={onClose}
            onCreatePoll={onCreatePoll}
          />
        </div>

        {(successMessage || errorMessage) && (
          <div className="modal-footer">
            {successMessage && <div className="alert alert-success">{successMessage}</div>}
            {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
