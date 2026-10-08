import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Eye,
  Flame,
  Ghost,
  Heart,
  Link2,
  Loader2,
  MessagesSquare,
  MoreHorizontal,
  Pin,
  PinOff,
  RotateCcw,
  Share2,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import type { Post } from '@/types';
import { GHOST_HANDLE, SITE, absoluteUrl, getCategory } from '@/lib/constants';
import { cn, formatCount, formatDateTime, timeAgo, truncate } from '@/lib/utils';
import { useCopy } from '@/lib/hooks';
import { useFeed } from '@/context/FeedContext';
import Avatar from '@/components/Avatar';
import CommentSection from '@/components/CommentSection';

export interface PostCardProps {
  post: Post;
  /** Shared clock from the feed so all relative timestamps tick in unison. */
  now: number;
  /** 1-based position, used for the ranking label on the trending tab. */
  rank?: number;
}

const BODY_LIMIT = 340;
const IMAGE_COLLAPSE_PX = 420;

/**
 * PostCard — the New Brutalist unit of the WHAATEVER feed.
 *
 * Heavy black frame, hard offset shadow, coloured category rail, hard-shadow
 * action buttons that physically push into their own shadow on press, a live
 * engagement meter, optional base64 media, and the expandable comment drawer.
 */
export default function PostCard({ post, now, rank }: PostCardProps) {
  const { toggleLike, deletePost, restorePost, togglePin, hidePost, notify, identity, registerView } = useFeed();
  const { copied, copy } = useCopy(2000);

  const [showComments, setShowComments] = useState(false);
  const [showFullBody, setShowFullBody] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const cardRef = useRef<HTMLElement>(null);

  const category = useMemo(() => getCategory(post.category), [post.category]);

  const isLongBody = post.content.length > BODY_LIMIT;
  const shownBody = isLongBody && !showFullBody ? truncate(post.content, BODY_LIMIT) : post.content;

  /** Saturated engagement meter — 3 points per upvote, 6 per comment. */
  const heat = useMemo(() => {
    const score = post.likes * 3 + post.comments.length * 6;
    return Math.max(6, Math.min(100, Math.round((score / 240) * 100)));
  }, [post.likes, post.comments.length]);

  /* Count a view once per session when the card scrolls into the viewport. */
  useEffect(() => {
    const node = cardRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      registerView(post.id);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            registerView(post.id);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [post.id, registerView]);

  const shareUrl = useMemo(() => `${SITE.url}/#post-${post.id}`, [post.id]);

  async function handleShare() {
    const text = `${post.author ?? GHOST_HANDLE} on WHAATEVER: ${truncate(post.content, 120)}`;
    const shareData = { title: 'WHAATEVER — anonymous post', text, url: shareUrl };

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share(shareData);
        notify({ variant: 'success', title: 'Shared', message: 'Thanks for spreading the anonymous word.', duration: 2600 });
        return;
      } catch {
        /* user cancelled — fall through to clipboard */
      }
    }

    const ok = await copy(shareUrl);
    notify(
      ok
        ? { variant: 'success', title: 'Link copied', message: 'Paste it anywhere — the post travels with it.', duration: 2800 }
        : { variant: 'error', title: 'Could not copy', message: 'Your browser blocked clipboard access.', duration: 4000 },
    );
  }

  function handleDelete() {
    setIsDeleting(true);
    const snapshot = post;
    deletePost(post.id);
    notify({
      variant: 'info',
      title: 'Post deleted from this browser',
      message: 'It only ever existed locally, so it is gone.',
      duration: 6000,
      action: {
        label: 'Undo',
        onClick: () => {
          restorePost(snapshot);
          setIsDeleting(false);
          notify({ variant: 'ghost', title: 'Post restored', message: 'Back where it belongs.', duration: 2400 });
        },
      },
    });
  }

  const authorLabel = post.author ?? GHOST_HANDLE;

  return (
    <article
      ref={cardRef}
      id={`post-${post.id}`}
      data-post-id={post.id}
      itemScope
      itemType="https://schema.org/SocialMediaPosting"
      className={cn(
        'group relative scroll-mt-28 border-3 border-black bg-white shadow-brutal transition-transform duration-150',
        isDeleting && 'pointer-events-none opacity-40',
        post.pinned && 'border-4 shadow-brutal-lg',
      )}
    >
      {/* Category rail */}
      <span aria-hidden className={cn('absolute left-0 top-0 h-full w-1.5', category.accent)} />

      {/* ------------------------------------------------------------- header */}
      <header className="flex items-start gap-3 border-b-3 border-black pl-4 pr-3 py-3">
        <Avatar name={post.author} size="md" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="font-display text-[13px] uppercase leading-none tracking-tight text-ink" itemProp="author">
              {authorLabel}
            </h3>

            {!post.author ? (
              <span className="badge badge-ink" title="Posted with Ghost Mode — no name attached">
                <Ghost size={10} strokeWidth={3} aria-hidden /> Ghost
              </span>
            ) : (
              <span className="badge badge-cobalt" title="This poster attached a name">
                Named
              </span>
            )}

            {post.mine ? <span className="badge badge-olive">Your post</span> : null}
            {post.pinned ? (
              <span className="badge badge-lemon">
                <Pin size={10} strokeWidth={3} aria-hidden /> Pinned
              </span>
            ) : null}
            {typeof rank === 'number' && rank <= 3 ? (
              <span className="badge badge-lemon">#{rank} trending</span>
            ) : null}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-ink-muted">
            <time dateTime={new Date(post.createdAt).toISOString()} title={formatDateTime(post.createdAt)} itemProp="datePublished">
              {timeAgo(post.createdAt, now)}
            </time>
            <span aria-hidden>·</span>
            <span className={cn('badge', category.badge)}>
              <span aria-hidden>{category.emoji}</span>
              {category.label}
            </span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 tabular-nums" title="Local views">
              <Eye size={11} strokeWidth={3} aria-hidden /> {formatCount(post.views)}
            </span>
          </div>
        </div>

        {/* Owner actions */}
        <div className="flex shrink-0 items-center gap-1.5">
          {post.mine ? (
            <>
              <button
                type="button"
                onClick={() => {
                  togglePin(post.id);
                  notify({
                    variant: 'info',
                    title: post.pinned ? 'Unpinned' : 'Pinned to the top',
                    duration: 2200,
                  });
                }}
                aria-label={post.pinned ? 'Unpin this post' : 'Pin this post to the top of the feed'}
                className="push border-2 border-black bg-white p-1.5 shadow-brutal-xs hover:bg-lemon-400"
              >
                {post.pinned ? <PinOff size={13} strokeWidth={3} aria-hidden /> : <Pin size={13} strokeWidth={3} aria-hidden />}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                aria-label="Delete this post from this browser"
                className="push border-2 border-black bg-white p-1.5 shadow-brutal-xs hover:bg-danger hover:text-white"
              >
                {isDeleting ? <Loader2 size={13} strokeWidth={3} className="animate-spin" aria-hidden /> : <Trash2 size={13} strokeWidth={3} aria-hidden />}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => hidePost(post.id)}
              aria-label="Hide this post from your feed"
              className="push border-2 border-black bg-white p-1.5 shadow-brutal-xs hover:bg-beige"
              title="Hide from your feed (restore any time from the toolbar)"
            >
              <MoreHorizontal size={14} strokeWidth={3} aria-hidden />
            </button>
          )}
        </div>
      </header>

      {/* --------------------------------------------------------------- body */}
      <div className="px-4 py-3.5">
        {post.content.trim().length > 0 ? (
          <p className="rich-text text-ink-soft" itemProp="articleBody">
            {shownBody}
          </p>
        ) : (
          <p className="text-sm italic text-ink-muted">(image only — no caption given)</p>
        )}

        {isLongBody ? (
          <button
            type="button"
            onClick={() => setShowFullBody((value) => !value)}
            className="mt-2 text-[11px] font-black uppercase tracking-widest text-cobalt-700 underline decoration-2 underline-offset-2 hover:bg-lemon-200"
          >
            {showFullBody ? 'Collapse post' : 'Read the whole thing'}
          </button>
        ) : null}

        {post.image ? (
          <figure className="mt-3">
            <div
              className={cn(
                'relative cursor-zoom-in overflow-hidden border-3 border-black bg-beige shadow-brutal-sm',
                !imageExpanded && 'max-h-[420px]',
              )}
              onClick={() => setImageExpanded((value) => !value)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setImageExpanded((value) => !value);
                }
              }}
              aria-label={imageExpanded ? 'Collapse attached image' : 'Expand attached image'}
            >
              {!isImageLoaded ? <div className="skeleton h-52 w-full" /> : null}
              <img
                src={post.image.dataUrl}
                alt={
                  post.author
                    ? `Image attached to a post by ${post.author}`
                    : 'Anonymous image attachment on the WHAATEVER feed'
                }
                loading="lazy"
                decoding="async"
                onLoad={() => setIsImageLoaded(true)}
                className={cn(
                  'w-full object-cover transition-opacity duration-300',
                  isImageLoaded ? 'opacity-100' : 'absolute inset-0 h-full opacity-0',
                )}
                style={{ maxHeight: imageExpanded ? 'none' : IMAGE_COLLAPSE_PX }}
                itemProp="image"
              />
            </div>
            <figcaption className="mt-1.5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-widest text-ink-muted">
              <span>Anonymous image · {post.image.width}×{post.image.height}px</span>
              <span>{imageExpanded ? 'Tap image to collapse' : 'Tap image to expand'}</span>
            </figcaption>
          </figure>
        ) : null}
      </div>

      {/* Engagement meter */}
      <div className="px-4">
        <div className="flex items-center gap-2" title={`Engagement heat: ${heat}%`}>
          <Flame size={12} strokeWidth={3.5} className={cn(heat > 66 ? 'text-danger' : heat > 33 ? 'text-lemon-500' : 'text-olive-600')} aria-hidden />
          <span className="h-2 flex-1 border-2 border-black bg-beige" aria-hidden>
            <span
              className={cn('block h-full', heat > 66 ? 'bg-danger' : heat > 33 ? 'bg-lemon-400' : 'bg-olive-600')}
              style={{ width: `${heat}%` }}
            />
          </span>
          <span className="text-[10px] font-black tabular-nums uppercase tracking-widest text-ink-muted">{heat}%</span>
        </div>
      </div>

      {/* ------------------------------------------------------------ actions */}
      <footer className="mt-3 flex flex-wrap items-center gap-2 border-t-3 border-black bg-cream px-4 py-3">
        <button
          type="button"
          onClick={() => toggleLike(post.id)}
          aria-pressed={post.likedByMe}
          aria-label={post.likedByMe ? 'Remove your upvote' : 'Upvote this post'}
          className={cn(
            'push inline-flex items-center gap-1.5 border-2 border-black px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-brutal-xs',
            post.likedByMe ? 'bg-lemon-400 text-ink animate-wiggle' : 'bg-white text-ink hover:bg-lemon-200',
          )}
        >
          <Heart
            size={14}
            strokeWidth={3}
            className={cn(post.likedByMe && 'fill-current')}
            aria-hidden
          />
          <span className="tabular-nums">{formatCount(post.likes)}</span>
          <span className="sr-only">upvotes</span>
        </button>

        <button
          type="button"
          onClick={() => setShowComments((value) => !value)}
          aria-expanded={showComments}
          aria-controls={`comments-${post.id}`}
          className={cn(
            'push inline-flex items-center gap-1.5 border-2 border-black px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-brutal-xs',
            showComments ? 'bg-cobalt-600 text-white' : 'bg-white text-ink hover:bg-cobalt-50',
          )}
        >
          <MessagesSquare size={14} strokeWidth={3} aria-hidden />
          <span className="tabular-nums">{formatCount(post.comments.length)}</span>
          <span className="hidden sm:inline">{showComments ? 'Hide' : 'Comments'}</span>
        </button>

        <button
          type="button"
          onClick={handleShare}
          className="push inline-flex items-center gap-1.5 border-2 border-black bg-white px-3 py-1.5 text-xs font-black uppercase tracking-widest shadow-brutal-xs hover:bg-beige"
        >
          {copied ? <Check size={14} strokeWidth={3} aria-hidden /> : <Share2 size={14} strokeWidth={3} aria-hidden />}
          {copied ? 'Copied' : 'Share'}
        </button>

        <a
          href="#top"
          onClick={async (event) => {
            event.preventDefault();
            const ok = await copy(absoluteUrl(`/#post-${post.id}`));
            if (ok) notify({ variant: 'success', title: 'Permalink copied', duration: 2400 });
          }}
          className="push ml-auto inline-flex items-center gap-1.5 border-2 border-black bg-white px-2.5 py-1.5 text-[11px] font-black uppercase tracking-widest text-ink-muted shadow-brutal-xs hover:bg-white hover:text-ink"
          aria-label="Copy a permalink to this post"
        >
          <Link2 size={13} strokeWidth={3} aria-hidden />
          #{post.id.replace(/^[a-z]+_/, '').slice(0, 6)}
        </a>
      </footer>

      {/* Hidden-post restore affordance */}
      {post.hidden ? (
        <p className="flex items-center gap-2 border-t-3 border-black bg-beige px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-ink-muted">
          <RotateCcw size={12} strokeWidth={3} aria-hidden /> Hidden from your feed
        </p>
      ) : null}

      {showComments ? (
        <div id={`comments-${post.id}`} className="animate-fade-up">
          <CommentSection post={post} now={now} />
        </div>
      ) : null}

      {/* Screen-reader friendly author + trend context */}
      <span className="sr-only">
        <TrendingUp size={0} aria-hidden /> Posted by {authorLabel} in {category.label}.{' '}
        {identity.ghostMode ? 'You are currently composing as a ghost.' : `You are currently composing as ${identity.name || 'a ghost'}.`}
      </span>
    </article>
  );
}
