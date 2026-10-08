import { useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/lib/hooks';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * ConfirmDialog — a brutalist yes/no gate for irreversible local actions
 * (deleting a post, nuking the whole local feed).
 */
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(open);
  useEscapeKey(onCancel, open);
  useFocusTrap(panelRef, open);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close confirmation dialog"
        onClick={onCancel}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-md animate-pop-in border-4 border-black bg-white shadow-brutal-2xl"
      >
        <div
          className={cn(
            'flex items-center gap-3 border-b-3 border-black px-4 py-3',
            destructive ? 'bg-danger text-white' : 'bg-lemon-400 text-ink',
          )}
        >
          <span className="flex h-8 w-8 items-center justify-center border-2 border-black bg-white text-ink">
            <AlertTriangle size={18} strokeWidth={3} aria-hidden />
          </span>
          <h2 id="confirm-title" className="flex-1 font-display text-base uppercase leading-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="border-2 border-black bg-white p-1 text-ink transition-colors hover:bg-ink hover:text-white"
          >
            <X size={16} strokeWidth={3} aria-hidden />
          </button>
        </div>

        <p id="confirm-message" className="px-4 py-4 text-sm leading-relaxed text-ink-soft">
          {message}
        </p>

        <div className="flex flex-col-reverse gap-3 border-t-3 border-black bg-cream px-4 py-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="btn btn-white w-full sm:w-auto">
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={cn('btn w-full sm:w-auto', destructive ? 'btn-danger' : 'btn-cobalt')}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
