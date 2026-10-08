import { useCallback, useMemo, useState } from 'react';
import { CornerDownLeft, Ghost, Heart, MessagesSquare, Send, Trash2, UserRoundPen } from 'lucide-react';
import type { Post } from '@/types';
import { GHOST_HANDLE, LIMITS } from '@/lib/constants';
import { cn, formatCount, timeAgo } from '@/lib/utils';
import { useFeed } from '@/context/FeedContext';
import Avatar from '@/components/Avatar';

export interface CommentSectionProps {
  post: Post;
  /** Shared clock provided by the feed so every timestamp ticks together. */
  now: number;
}

/**
 * CommentSection — the expandable discourse drawer that lives under every post.
 *
 * Comments are stored on the post itself in localStorage, so the whole thread
 * travels with the post: no separate collection, no backend round trip.
 */
export default function CommentSection({ post, now }: CommentSectionProps) {
  const { identity, addComment, deleteComment, toggleCommentLike, notify } = useFeed();

  const [draft, setDraft] = useState('');
  const [asGhost, setAsGhost] = useState(identity.ghostMode);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  const comments = useMemo(() => [...post.comments].sort((a, b) => a.createdAt - b.createdAt), [post.comments]);

  const commentAuthor = asGhost ? null : identity.name.trim() || null;

  const submit = useCallback(() => {
    const value = draft.trim();
    if (!value) return;

    addComment(post.id, value, commentAuthor);
    setDraft('');
    notify({
      variant: commentAuthor ? 'success' : 'ghost',
      title: commentAuthor ? `Replied as ${commentAuthor}` : 'Replied anonymously',
      message: 'Your comment landed in the thread.',
      duration: 2600,
    });
  }, [addComment, commentAuthor, draft, notify, post.id]);

  return (
    <section
      aria-label={`Comments on this post (${comments.length})`}
      className="mt-3 border-t-3 border-black bg-cream px-3 pb-3 pt-3 sm:px-4"
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h4 className="flex items-center gap-1.5 font-display text-xs uppercase tracking-widest text-ink">
          <MessagesSquare size={14} strokeWidth={3} aria-hidden />
          {comments.length === 0 ? 'No comments yet' : `${formatCount(comments.length)} comment${comments.length === 1 ? '' : 's'}`}
        </h4>
        <span className="badge badge-beige">Thread is public</span>
      </header>

      {comments.length === 0 ? (
        <p className="border-3 border-dashed border-black bg-white px-3 py-4 text-center text-xs font-semibold text-ink-muted">
          Be the first to say something. Nobody here knows who you are.
        </p>
      ) : (
        <ul className="space-y-3">
          {comments.map((comment) => {
            const isLong = comment.content.length > 220;
            const isOpen = expandedComments[comment.id] ?? false;
            const shown = isLong && !isOpen ? `${comment.content.slice(0, 220)}…` : comment.content;

            return (
              <li key={comment.id} className="flex gap-2.5">
                <Avatar name={comment.author} size="sm" />
                <div className="min-w-0 flex-1 border-3 border-black bg-white px-3 py-2 shadow-brutal-xs">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="font-display text-[12px] uppercase leading-none tracking-tight text-ink">
                      {comment.author ?? GHOST_HANDLE}
                    </p>
                    {!comment.author ? <span className="badge badge-ink">Ghost</span> : null}
                    {comment.mine ? <span className="badge badge-olive">You</span> : null}
                    <time
                      className="text-[11px] font-semibold text-ink-muted"
                      dateTime={new Date(comment.createdAt).toISOString()}
                    >
                      {timeAgo(comment.createdAt, now)}
                    </time>
                  </div>

                  <p className="rich-text mt-1.5 text-[14px] text-ink-soft">{shown}</p>

                  {isLong ? (
                    <button
                      type="button"
                      onClick={() => setExpandedComments((current) => ({ ...current, [comment.id]: !isOpen }))}
                      className="mt-1 text-[11px] font-black uppercase tracking-widest text-cobalt-700 underline decoration-2 underline-offset-2 hover:bg-lemon-200"
                    >
                      {isOpen ? 'Show less' : 'Read more'}
                    </button>
                  ) : null}

                  <div className="mt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleCommentLike(post.id, comment.id)}
                      aria-pressed={comment.likedByMe}
                      aria-label={comment.likedByMe ? 'Remove upvote from comment' : 'Upvote comment'}
                      className={cn(
                        'push inline-flex items-center gap-1 border-2 border-black px-2 py-0.5 text-[11px] font-black tabular-nums shadow-brutal-xs',
                        comment.likedByMe ? 'bg-lemon-400 text-ink' : 'bg-white text-ink hover:bg-beige',
                      )}
                    >
                      <Heart size={12} strokeWidth={3} className={cn(comment.likedByMe && 'fill-current')} aria-hidden />
                      {formatCount(comment.likes)}
                    </button>

                    {comment.mine ? (
                      <button
                        type="button"
                        onClick={() => {
                          deleteComment(post.id, comment.id);
                          notify({ variant: 'info', title: 'Comment deleted', duration: 2200 });
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-ink-muted transition-colors hover:text-danger"
                      >
                        <Trash2 size={12} strokeWidth={3} aria-hidden /> Delete
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* ------------------------------------------------------- composer */}
      <div className="mt-4 border-3 border-black bg-white p-2.5 shadow-brutal-xs">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            role="switch"
            aria-checked={asGhost}
            onClick={() => setAsGhost((value) => !value)}
            className={cn(
              'push inline-flex items-center gap-1.5 border-2 border-black px-2 py-1 text-[10px] font-black uppercase tracking-widest shadow-brutal-xs',
              asGhost ? 'bg-ink text-lemon-400' : 'bg-beige text-ink',
            )}
          >
            {asGhost ? <Ghost size={12} strokeWidth={3} aria-hidden /> : <UserRoundPen size={12} strokeWidth={3} aria-hidden />}
            {asGhost ? 'Comment as Ghost' : `Comment as ${identity.name.trim() || 'Ghost'}`}
          </button>
          <span className="text-[10px] font-bold uppercase tracking-widest text-ink-muted">
            {asGhost ? 'No name attached' : 'Your saved name is attached'}
          </span>
        </div>

        <label htmlFor={`comment-${post.id}`} className="sr-only">
          Add a comment to this anonymous post
        </label>
        <textarea
          id={`comment-${post.id}`}
          value={draft}
          rows={2}
          maxLength={LIMITS.comment}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Add to the discourse… (Ctrl / ⌘ + Enter to send)"
          className="w-full resize-y border-2 border-black bg-white px-3 py-2 text-sm placeholder:text-ink-light focus:shadow-brutal-cobalt focus:outline-none"
        />

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold tabular-nums uppercase tracking-widest text-ink-muted">
            {LIMITS.comment - draft.length} left · <CornerDownLeft size={10} className="inline" strokeWidth={3} aria-hidden />
          </span>
          <button type="button" onClick={submit} disabled={draft.trim().length === 0} className="btn btn-sm btn-cobalt">
            <Send size={13} strokeWidth={3} aria-hidden /> Reply
          </button>
        </div>
      </div>
    </section>
  );
}
