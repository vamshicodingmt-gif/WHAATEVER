import { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Ghost, Heart, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastVariant = 'success' | 'error' | 'info' | 'like' | 'ghost';

export interface ToastProps {
  id: string;
  variant?: ToastVariant;
  title: string;
  message?: string;
  /** Auto-dismiss delay in ms. Use 0 to keep the toast pinned until dismissed. */
  duration?: number;
  action?: { label: string; onClick: () => void };
  onDismiss: (id: string) => void;
}

const VARIANTS: Record<
  ToastVariant,
  { accent: string; icon: typeof Info; iconWrap: string; label: string }
> = {
  success: { accent: 'bg-olive-600', icon: CheckCircle2, iconWrap: 'bg-olive-600 text-white', label: 'Success' },
  error: { accent: 'bg-danger', icon: AlertTriangle, iconWrap: 'bg-danger text-white', label: 'Error' },
  info: { accent: 'bg-cobalt-600', icon: Info, iconWrap: 'bg-cobalt-600 text-white', label: 'Info' },
  like: { accent: 'bg-lemon-400', icon: Heart, iconWrap: 'bg-lemon-400 text-ink', label: 'Appreciation' },
  ghost: { accent: 'bg-ink', icon: Ghost, iconWrap: 'bg-ink text-lemon-400', label: 'Anonymous' },
};

/**
 * Toast — the tactile New Brutalist notification.
 *
 * Heavy black border, hard offset shadow, coloured accent rail and a physical
 * dismiss button. Rendering it is the job of <ToastViewport> inside the feed
 * provider; this component is purely presentational.
 */
export default function Toast({
  id,
  variant = 'info',
  title,
  message,
  duration = 4200,
  action,
  onDismiss,
}: ToastProps) {
  const config = VARIANTS[variant];
  const Icon = config.icon;
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!duration) return;
    timerRef.current = window.setTimeout(() => onDismiss(id), duration);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [duration, id, onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex w-[min(24rem,calc(100vw-2rem))] animate-toast-in items-start gap-3 border-3 border-black bg-white p-3 shadow-brutal-lg',
      )}
    >
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center border-2 border-black', config.iconWrap)}>
        <Icon size={16} strokeWidth={2.75} aria-hidden />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-display text-[13px] uppercase leading-tight tracking-tight text-ink">{title}</p>
        {message ? <p className="mt-1 text-[13px] leading-snug text-ink-muted">{message}</p> : null}

        {action ? (
          <button
            type="button"
            onClick={() => {
              action.onClick();
              onDismiss(id);
            }}
            className="mt-2 inline-flex items-center gap-1 border-2 border-black bg-lemon-400 px-2 py-1 text-[11px] font-black uppercase tracking-widest shadow-brutal-xs push hover:bg-lemon-300"
          >
            {action.label}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(id)}
        aria-label={`Dismiss ${config.label} notification`}
        className="shrink-0 border-2 border-black bg-white p-1 transition-colors hover:bg-ink hover:text-white"
      >
        <X size={14} strokeWidth={3} aria-hidden />
      </button>

      {duration > 0 ? (
        <span
          aria-hidden
          className={cn('absolute bottom-0 left-0 h-1', config.accent)}
          style={{ animation: `toast-timer ${duration}ms linear forwards` }}
        />
      ) : null}

      <style>{`@keyframes toast-timer { from { width: 100%; } to { width: 0%; } }`}</style>
    </div>
  );
}

/**
 * ToastViewport — bottom-right stack of notifications. `relative` is required
 * on the toast (above) for the timer rail, so the wrapper keeps them stacked.
 */
export function ToastViewport({ toasts, onDismiss }: { toasts: ToastProps[]; onDismiss: (id: string) => void }) {
  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-[130] flex flex-col items-end gap-3 sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="relative">
          <Toast {...toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
