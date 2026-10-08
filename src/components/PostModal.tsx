import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Ghost,
  Hash,
  ImagePlus,
  Loader2,
  Send,
  Sparkles,
  Trash2,
  UserRoundPen,
  X,
} from 'lucide-react';
import type { CategoryId, MediaAttachment } from '@/types';
import { CATEGORIES, COMPOSER_PROMPTS, GHOST_HANDLE, LIMITS } from '@/lib/constants';
import { cn, humanBytes } from '@/lib/utils';
import { clearDraft, loadDraft, saveDraft } from '@/lib/storage';
import { fileToAttachment, filesFromDataTransfer } from '@/lib/image';
import { useBodyScrollLock, useEscapeKey, useFocusTrap } from '@/lib/hooks';
import { useFeed } from '@/context/FeedContext';
import Avatar from '@/components/Avatar';

export interface PostModalProps {
  open: boolean;
  onClose: () => void;
  /** Pre-select a category when the composer is opened from a deep link. */
  initialCategory?: CategoryId;
}

/**
 * PostModal — "The Vault".
 *
 * The composer for every anonymous post: rich text box, Ghost Mode / named
 * identity switcher, drag-drop-paste image attachment with instant preview and
 * a publish action that lands on the feed with optimistic UI + a success toast.
 */
export default function PostModal({ open, onClose, initialCategory }: PostModalProps) {
  const { identity, setGhostMode, setName, createPost, deletePost, notify } = useFeed();

  const panelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState('');
  const [category, setCategory] = useState<CategoryId>(initialCategory ?? 'confession');
  const [image, setImage] = useState<MediaAttachment | null>(null);
  const [imageMeta, setImageMeta] = useState<{ originalBytes: number; compressed: boolean } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useBodyScrollLock(open);
  useEscapeKey(handleClose, open);
  useFocusTrap(panelRef, open);

  /* ---------------------------------------------------------------- drafts */

  useEffect(() => {
    if (!open) return;

    const draft = loadDraft();
    if (draft && draft.content.trim().length > 0) {
      const knownCategory = CATEGORIES.some((option) => option.id === draft.category) ? draft.category : 'confession';
      setContent(draft.content);
      setCategory(knownCategory);
      setName(draft.name);
      setGhostMode(draft.ghostMode);
      setDraftSavedAt(draft.savedAt);
    }
    // Only re-read the draft when the modal opens, not on every identity tweak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      if (content.trim().length === 0 && !image) {
        clearDraft();
        setDraftSavedAt(null);
        return;
      }
      saveDraft({ content, category, ghostMode: identity.ghostMode, name: identity.name });
      setDraftSavedAt(Date.now());
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [content, category, identity.ghostMode, identity.name, image, open]);

  /* ------------------------------------------------------------- publishing */

  const canPublish = useMemo(
    () => (content.trim().length > 0 || !!image) && content.length <= LIMITS.post && !isProcessing,
    [content, image, isProcessing],
  );

  const remaining = LIMITS.post - content.length;
  const handleName = identity.ghostMode ? null : identity.name.trim() || null;

  function handleClose() {
    if (content.trim().length > 0) {
      saveDraft({ content, category, ghostMode: identity.ghostMode, name: identity.name });
      notify({
        variant: 'info',
        title: 'Draft stashed in the vault',
        message: 'Your words are saved locally — reopen Create Post to finish the thought.',
        duration: 3600,
      });
    }
    onClose();
  }

  function handlePublish() {
    if (!canPublish) {
      setError('Write something or attach an image before publishing. WHAATEVER cannot post silence.');
      return;
    }

    setIsPublishing(true);
    setError(null);

    const post = createPost({
      content,
      author: handleName,
      category,
      image,
    });

    // Optimistic UI: the feed already shows the post, so close immediately.
    notify({
      variant: 'success',
      title: handleName ? `Posted as ${handleName}` : 'Posted anonymously',
      message: 'Your post is live on the WHAATEVER feed. No account, no trace, no waiting.',
      action: {
        label: 'Undo',
        onClick: () => {
          deletePost(post.id);
          notify({ variant: 'info', title: 'Post removed', message: 'Zapped from the local feed.', duration: 2600 });
        },
      },
    });

    clearDraft();
    setContent('');
    setImage(null);
    setImageMeta(null);
    setDraftSavedAt(null);
    setIsPublishing(false);
    onClose();
  }

  /* ---------------------------------------------------------------- images */

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;

      setIsProcessing(true);
      setError(null);

      try {
        const result = await fileToAttachment(files[0]);

        if (!result.ok) {
          setError(result.reason);
          notify({ variant: 'error', title: 'Attachment rejected', message: result.reason, duration: 5200 });
          return;
        }

        setImage(result.attachment);
        setImageMeta({ originalBytes: result.originalBytes, compressed: result.compressed });

        if (files.length > 1) {
          notify({ variant: 'info', title: 'One image per post', message: 'WHAATEVER kept the first image.', duration: 3200 });
        }
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : 'That image could not be processed.';
        setError(message);
        notify({ variant: 'error', title: 'Something ate that image', message, duration: 5200 });
      } finally {
        setIsProcessing(false);
      }
    },
    [notify],
  );

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      void handleFiles(filesFromDataTransfer(event.dataTransfer));
    },
    [handleFiles],
  );

  const onPaste = useCallback(
    (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      const files = filesFromDataTransfer(event.clipboardData);
      if (files.length > 0) {
        event.preventDefault();
        void handleFiles(files);
      }
    },
    [handleFiles],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        handlePublish();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canPublish, content, category, image, handleName],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close the composer"
        onClick={handleClose}
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-title"
        className="relative flex max-h-[94vh] w-full max-w-3xl animate-pop-in flex-col border-4 border-black bg-white shadow-brutal-2xl sm:max-h-[88vh]"
      >
        {/* ------------------------------------------------------------ header */}
        <header className="flex items-center gap-3 border-b-4 border-black bg-lemon-400 px-4 py-3">
          <span className="flex h-9 w-9 items-center justify-center border-3 border-black bg-ink text-lemon-400 shadow-brutal-xs">
            <Sparkles size={18} strokeWidth={2.75} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="vault-title" className="font-display text-lg uppercase leading-none tracking-tight sm:text-xl">
              The Vault
            </h2>
            <p className="mt-1 truncate text-[11px] font-bold uppercase tracking-widest text-ink/70">
              Anonymous composer · zero logins · zero traces
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close the composer"
            className="push border-3 border-black bg-white p-2 shadow-brutal-xs transition-colors hover:bg-ink hover:text-white"
          >
            <X size={18} strokeWidth={3} aria-hidden />
          </button>
        </header>

        {/* -------------------------------------------------------------- body */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {/* Identity switcher */}
          <section aria-label="Posting identity" className="border-3 border-black bg-beige p-3 shadow-brutal-sm sm:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar name={handleName} size="lg" />
                <div>
                  <p className="font-display text-sm uppercase leading-none">
                    {identity.ghostMode ? 'Ghost Mode' : handleName ? 'Named post' : 'Named post (name empty)'}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    Posting as: {handleName ?? GHOST_HANDLE}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={identity.ghostMode}
                onClick={() => setGhostMode(!identity.ghostMode)}
                className={cn(
                  'push flex items-center gap-2 border-3 border-black px-3 py-2 text-xs font-black uppercase tracking-widest shadow-brutal-xs',
                  identity.ghostMode ? 'bg-ink text-lemon-400' : 'bg-white text-ink',
                )}
              >
                {identity.ghostMode ? <Ghost size={15} strokeWidth={3} aria-hidden /> : <UserRoundPen size={15} strokeWidth={3} aria-hidden />}
                {identity.ghostMode ? 'Anonymous' : 'Named'}
                <span
                  aria-hidden
                  className={cn(
                    'relative inline-flex h-5 w-9 items-center border-2 border-black transition-colors',
                    identity.ghostMode ? 'bg-cobalt-600' : 'bg-beige-deep',
                  )}
                >
                  <span
                    className={cn(
                      'absolute h-3.5 w-3.5 border-2 border-black bg-white transition-all',
                      identity.ghostMode ? 'left-[18px]' : 'left-[1px]',
                    )}
                  />
                </span>
              </button>
            </div>

            {!identity.ghostMode ? (
              <div className="mt-3 animate-fade-up">
                <label
                  htmlFor="vault-name"
                  className="mb-1 block text-[11px] font-black uppercase tracking-widest text-ink-muted"
                >
                  Your name / pseudonym (optional)
                </label>
                <input
                  id="vault-name"
                  type="text"
                  value={identity.name}
                  maxLength={LIMITS.name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Midnight Kettle, ThirdCoffee, anything goes…"
                  className="field"
                />
                <p className="mt-1 text-[11px] font-semibold text-ink-muted">
                  Leave it blank and we will quietly send you out as the {GHOST_HANDLE} anyway. No judgement.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-[12px] leading-snug text-ink-soft">
                <strong className="font-black">Ghost Mode is on.</strong> Your post carries no name, no email and no
                account. Nothing is uploaded anywhere — it is written straight into this browser.
              </p>
            )}
          </section>

          {/* Body copy */}
          <section aria-label="Your post" className="mt-4">
            <label htmlFor="vault-content" className="mb-1 flex items-center justify-between gap-2">
              <span className="font-display text-sm uppercase tracking-tight">Say the unfiltered thing</span>
              <span
                className={cn(
                  'border-2 border-black px-2 py-0.5 text-[11px] font-black tabular-nums',
                  remaining < 0 ? 'bg-danger text-white' : remaining < 200 ? 'bg-lemon-400 text-ink' : 'bg-beige text-ink',
                )}
              >
                {remaining < 0 ? `${Math.abs(remaining)} over` : `${remaining} left`}
              </span>
            </label>

            <div
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
              className={cn('relative border-3 border-black bg-white transition-shadow', isDragging && 'shadow-brutal-cobalt')}
            >
              <textarea
                id="vault-content"
                ref={textareaRef}
                data-autofocus="true"
                value={content}
                onChange={(event) => {
                  setContent(event.target.value);
                  if (error) setError(null);
                }}
                onPaste={onPaste}
                onKeyDown={onKeyDown}
                rows={7}
                maxLength={LIMITS.post + 200}
                placeholder="Confess it. Rant about it. Ask it. Nobody knows your name here — that is the entire point of WHAATEVER…"
                className="rich-text min-h-[190px] w-full resize-y border-0 bg-transparent p-4 text-ink placeholder:text-ink-light focus:outline-none"
              />
              {isDragging ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-cobalt-600/10">
                  <span className="border-3 border-black bg-lemon-400 px-3 py-1 font-display text-xs uppercase shadow-brutal-xs">
                    Drop the image right here
                  </span>
                </div>
              ) : null}
            </div>

            {/* Quick prompts */}
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              {COMPOSER_PROMPTS.map((prompt) => (
                <button
                  key={prompt.label}
                  type="button"
                  onClick={() => {
                    setContent((current) => (current.trim().length ? current : `${prompt.text}`));
                    textareaRef.current?.focus();
                  }}
                  className="push shrink-0 border-2 border-black bg-cream px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide shadow-brutal-xs hover:bg-lemon-200"
                >
                  {prompt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section aria-label="Category" className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 font-display text-sm uppercase tracking-tight">
              <Hash size={14} strokeWidth={3} aria-hidden /> Pick a category
            </p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((option) => {
                const active = option.id === category;
                return (
                  <button
                    key={option.id}
                    type="button"
                    title={option.blurb}
                    aria-pressed={active}
                    onClick={() => setCategory(option.id)}
                    className={cn(
                      'push inline-flex items-center gap-1.5 border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-brutal-xs',
                      active ? cn(option.badge, 'ring-2 ring-black ring-offset-2') : 'bg-white text-ink hover:bg-beige',
                    )}
                  >
                    <span aria-hidden>{option.emoji}</span>
                    {option.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Image attachment */}
          <section aria-label="Image attachment" className="mt-4">
            <p className="mb-2 flex items-center gap-1.5 font-display text-sm uppercase tracking-tight">
              <ImagePlus size={14} strokeWidth={3} aria-hidden /> Attach an image (optional)
            </p>

            {image ? (
              <figure className="border-3 border-black bg-cream p-3 shadow-brutal-sm">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <img
                    src={image.dataUrl}
                    alt="Attachment preview for your anonymous post"
                    className="max-h-52 w-full border-2 border-black object-cover sm:w-56"
                  />
                  <figcaption className="flex-1 text-xs leading-relaxed text-ink-soft">
                    <p className="font-display text-[13px] uppercase text-ink">{image.name}</p>
                    <p className="mt-1 tabular-nums">
                      {image.width}×{image.height}px · {humanBytes(image.bytes)}
                    </p>
                    {imageMeta ? (
                      <p className="mt-1 font-bold text-olive-700">
                        {imageMeta.compressed
                          ? `Compressed client-side from ${humanBytes(imageMeta.originalBytes)} → ${humanBytes(image.bytes)}`
                          : `Kept as-is (${humanBytes(imageMeta.originalBytes)})`}
                      </p>
                    ) : null}
                    <p className="mt-2 text-ink-muted">
                      Stored as a base64 payload inside this browser. It never touches a server.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setImage(null);
                        setImageMeta(null);
                      }}
                      className="btn btn-sm btn-danger mt-3"
                    >
                      <Trash2 size={13} strokeWidth={3} aria-hidden /> Remove image
                    </button>
                  </figcaption>
                </div>
              </figure>
            ) : (
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={cn(
                  'grid-paper flex flex-col items-center justify-center gap-2 border-3 border-dashed border-black bg-cream px-4 py-7 text-center',
                  isDragging && 'bg-lemon-200',
                )}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={26} strokeWidth={2.5} className="animate-spin" aria-hidden />
                    <p className="font-display text-sm uppercase">Compressing in your browser…</p>
                  </>
                ) : (
                  <>
                    <ImagePlus size={26} strokeWidth={2.5} aria-hidden />
                    <p className="font-display text-sm uppercase">Drag, drop or paste an image</p>
                    <p className="max-w-md text-xs text-ink-muted">
                      Screenshots, memes, photos — anything. Images are downscaled and converted to local base64 so your
                      anonymous attachment never leaves the device. Max 8MB per file.
                    </p>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="btn btn-cobalt btn-sm mt-1">
                      Choose a file
                    </button>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  aria-label="Attach an image to your anonymous post"
                  onChange={(event) => {
                    void handleFiles(Array.from(event.target.files ?? []));
                    event.target.value = '';
                  }}
                />
              </div>
            )}
          </section>

          {error ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 border-3 border-black bg-danger/10 p-3 text-xs font-bold text-danger-dark"
            >
              <AlertTriangle size={16} strokeWidth={3} className="mt-0.5 shrink-0" aria-hidden />
              {error}
            </p>
          ) : null}

          <p className="mt-4 flex items-start gap-2 border-3 border-black bg-beige p-3 text-[11px] font-semibold leading-relaxed text-ink-soft">
            <Ban size={15} strokeWidth={3} className="mt-0.5 shrink-0" aria-hidden />
            Swearing, messy feelings and unpopular opinions are welcome. Targeted harassment, doxxing and anything
            illegal are not. Everything you publish here is stored only in your own browser.
          </p>
        </div>

        {/* ------------------------------------------------------------ footer */}
        <footer className="flex flex-col gap-3 border-t-4 border-black bg-cream px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
            {draftSavedAt ? `Draft saved locally · ${new Date(draftSavedAt).toLocaleTimeString()}` : 'Ctrl / ⌘ + Enter to publish'}
          </p>

          <div className="flex gap-3">
            <button type="button" onClick={handleClose} className="btn btn-white flex-1 sm:flex-none">
              Cancel
            </button>
            <button
              type="button"
              onClick={handlePublish}
              disabled={!canPublish}
              className="btn btn-cobalt btn-lg flex-1 sm:flex-none"
            >
              {isPublishing ? (
                <Loader2 size={16} strokeWidth={3} className="animate-spin" aria-hidden />
              ) : (
                <Send size={16} strokeWidth={3} aria-hidden />
              )}
              Publish
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
