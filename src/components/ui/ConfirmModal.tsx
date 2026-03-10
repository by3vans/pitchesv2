'use client';

import Icon from '@/components/ui/AppIcon';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmModalProps) {
  const iconColor = variant === 'danger' ? 'var(--crimson)' : 'var(--orange)';
  const iconBg    = variant === 'danger' ? 'rgba(194,59,46,0.1)' : 'rgba(184,98,42,0.1)';

  return (
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-4"
      style={{ background: 'rgba(26,26,24,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="pm-panel w-full max-w-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="flex items-start gap-3 mb-5">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: iconBg }}
          >
            <Icon
              name="ExclamationTriangleIcon"
              size={20}
              variant="outline"
              style={{ color: iconColor }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="confirm-modal-title"
              className="font-semibold text-sm mb-1"
              style={{ fontFamily: 'Epilogue, sans-serif', color: 'var(--ink)' }}
            >
              {title}
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--stone)', fontFamily: 'Epilogue, sans-serif' }}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="pm-btn"
            autoFocus
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="pm-btn inline-flex items-center gap-1.5"
            style={{ color: iconColor, borderColor: iconColor }}
          >
            <Icon name="TrashIcon" size={14} variant="outline" />
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}