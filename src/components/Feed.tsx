import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ArrowUp,
  Clock,
  Download,
  EyeOff,
  Flame,
  Ghost,
  Layers,
  Loader2,
  PenSquare,
  RefreshCw,
  RotateCcw,
  Search,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import type { CategoryId, FeedFilter, Post } from '@/types';
import { CATEGORIES, FILTERS, LIMITS } from '@/lib/constants';
import { cn, downloadJson, formatCount, humanBytes } from '@/lib/utils';
import { applyFilter, useFeed } from '@/context/FeedContext';
import { useDebouncedValue, useNow } from '@/lib/hooks';
import PostCard from '@/components/PostCard';
import ConfirmDialog from '@/components/ConfirmDialog';

export interface FeedProps {
  heading: string;
  subheading: string;
  defaultFilter?: FeedFilter;
  onCreatePost: () => void;
}

const FILTER_ICONS = {
  layers: Layers,
  ghost: Ghost,
  flame: Flame,
  clock: Clock,
} as const;

const FILTER_IDS: FeedFilter[] = ['all', 'anonymous', 'trending', 'latest'];
const CATEGORY_IDS: CategoryId[] = CATEGORIES.map((category) => category.id);

function isFilter(value: string | null): value is FeedFilter {
  return !!value && (FILTER_IDS as string[]).includes(value);
}

function isCategory(value: string | null): value is CategoryId {
  return !!value && (CATEGORY_IDS as string[]).includes(value);
}

/**
 * Feed — the live anonymous stream.
 *
 * Owns the filter tabs ("All Posts", "Anonymous Only", "Trending", "Latest"),
 * keyword search, category chips, the local storage meter and the feed toolbar.
 * Filter state is mirrored into the URL so every view is deep-linkable and
 * crawlable.
 */
export default function Feed({ heading, subheading, defaultFilter = 'all', onCreatePost }: FeedProps) {
  const { posts, visiblePosts, stats, exportFeed, importFeed, restoreSeedFeed, clearAllPosts, unhidePost, notify } = useFeed();
  const now = useNow(60_000);

  const [searchParams, setSearchParams] = useSearchParams();
  const rawFilter = searchParams.get('filter');
  const rawCategory = searchParams.get('category');
  const rawQuery = searchParams.get('q') ?? '';

  const filter: FeedFilter = isFilter(rawFilter) ? rawFilter : defaultFilter;
  const activeCategory: CategoryId | 'all' = isCategory(rawCategory) ? rawCategory : 'all';

  const [query, setQuery] = useState(rawQuery);
  const debouncedQuery = useDebouncedValue(query, 200);

  const [showHidden, setShowHidden] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(LIMITS.pageSize);
  const [dialog, setDialog] = useState<'reset' | 'empty' | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  /* ------------------------------------------------------------ url syncing */

  const updateParams = useCallback(
    (updates: { filter?: FeedFilter; category?: CategoryId | 'all'; q?: string }) => {
      const next = new URLSearchParams(searchParams);

      if (updates.filter !== undefined) {
        if (updates.filter === defaultFilter) next.delete('filter');
        else next.set('filter', updates.filter);
      }
      if (updates.category !== undefined) {
        if (updates.category === 'all') next.delete('category');
        else next.set('category', updates.category);
      }
      if (updates.q !== undefined) {
        if (!updates.q.trim()) next.delete('q');
        else next.set('q', updates.q.trim());
      }

      setSearchParams(next, { replace: true });
    },
    [defaultFilter, searchParams, setSearchParams],
  );

  useEffect(() => {
    updateParams({ q: debouncedQuery });
    // Only push the query param when the debounced value actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  /* --------------------------------------------------------------- filtering */

  const filtered = useMemo(() => {
    const base = showHidden ? posts : visiblePosts;
    const sorted = applyFilter(base, filter, now);
    const needle = debouncedQuery.trim().toLowerCase();

    return sorted.filter((post) => {
      if (activeCategory !== 'all' && post.category !== activeCategory) return false;
      if (!needle) return true;

      const haystack = `${post.content} ${post.author ?? 'anonymous whaatever ghost'} ${post.category}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [posts, visiblePosts, showHidden, filter, now, debouncedQuery, activeCategory]);

  useEffect(() => {
    setVisibleCount(LIMITS.pageSize);
  }, [filter, activeCategory, debouncedQuery, showHidden]);

  const rendered = filtered.slice(0, visibleCount);
  const hiddenCount = posts.filter((post) => post.hidden).length;
  const storageUsed = stats.storageBytes;
  const storagePercent = Math.min(100, Math.round((storageUsed / LIMITS.storageSoftLimitBytes) * 100));

  /* ---------------------------------------------------------------- actions */

  const handleExport = useCallback(() => {
    const payload = exportFeed();
    downloadJson(`whaatever-feed-${new Date().toISOString().slice(0, 10)}.json`, {
      exportedFrom: 'https://whaatever.vercel.app',
      exportedAt: new Date().toISOString(),
      postCount: payload.length,
      posts: payload,
    });
    notify({
      variant: 'success',
      title: 'Feed exported',
      message: `${formatCount(payload.length)} posts downloaded as JSON. Keep it safe — there is no cloud copy.`,
      duration: 5200,
    });
  }, [exportFeed, notify]);

  const handleImportFile = useCallback(
    async (file: File) => {
      setIsImporting(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const list = Array.isArray(parsed)
          ? parsed
          : ((parsed as { posts?: unknown[] }).posts ?? []);

        if (!Array.isArray(list) || list.length === 0) {
          notify({ variant: 'error', title: 'Nothing to import', message: 'That JSON did not contain any posts.', duration: 5000 });
          return;
        }

        const imported = importFeed(list as Post[]);
        notify({
          variant: 'success',
          title: 'Feed imported',
          message: `${formatCount(imported)} posts merged into your local feed.`,
          duration: 5000,
        });
      } catch {
        notify({
          variant: 'error',
          title: 'Import failed',
          message: 'That file was not valid WHAATEVER JSON.',
          duration: 5000,
        });
      } finally {
        setIsImporting(false);
      }
    },
    [importFeed, notify],
  );

  const activeFilterDef = FILTERS.find((item) => item.id === filter) ?? FILTERS[0];

  return (
    <section aria-labelledby="feed-heading" className="mt-8">
      {/* ----------------------------------------------------------- headline */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="feed-heading" className="font-display text-2xl uppercase leading-none tracking-tight sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{subheading}</p>
        </div>
        <p className="hidden text-[11px] font-black uppercase tracking-widest text-ink-muted sm:block">
          {activeFilterDef.hint}
        </p>
      </div>

      {/* ------------------------------------------------------------ toolbar */}
      <div className="mt-4 border-3 border-black bg-white shadow-brutal">
        {/* Filter tabs */}
        <div role="tablist" aria-label="Feed filters" className="flex flex-wrap gap-2 border-b-3 border-black bg-cream p-3">
          {FILTERS.map((item) => {
            const Icon = FILTER_ICONS[item.icon];
            const active = item.id === filter;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={active}
                title={item.hint}
                onClick={() => updateParams({ filter: item.id })}
                className={cn(
                  'push inline-flex items-center gap-1.5 border-2 border-black px-3 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-brutal-xs',
                  active ? 'bg-cobalt-600 text-white' : 'bg-white text-ink hover:bg-lemon-200',
                )}
              >
                <Icon size={13} strokeWidth={3} aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Search + categories */}
        <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="relative">
            <label htmlFor="feed-search" className="sr-only">
              Search anonymous posts, confessions and rants
            </label>
            <Search
              size={15}
              strokeWidth={3}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
              aria-hidden
            />
            <input
              id="feed-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search confessions, rants, secrets…"
              className="w-full border-2 border-black bg-white py-2.5 pl-9 pr-9 text-sm placeholder:text-ink-light focus:shadow-brutal-cobalt focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 border-2 border-black bg-white p-1 hover:bg-beige"
              >
                <X size={12} strokeWidth={3} aria-hidden />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => updateParams({ category: 'all' })}
              aria-pressed={activeCategory === 'all'}
              className={cn(
                'push border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-brutal-xs',
                activeCategory === 'all' ? 'bg-ink text-lemon-400' : 'bg-white text-ink hover:bg-beige',
              )}
            >
              Every category
            </button>
            {CATEGORIES.map((category) => {
              const active = activeCategory === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  title={category.blurb}
                  aria-pressed={active}
                  onClick={() => updateParams({ category: category.id })}
                  className={cn(
                    'push border-2 border-black px-2.5 py-1.5 text-[11px] font-black uppercase tracking-widest shadow-brutal-xs',
                    active ? category.badge : 'bg-white text-ink hover:bg-beige',
                  )}
                >
                  <span aria-hidden>{category.emoji}</span> {category.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Status rail */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t-3 border-black bg-beige px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-widest text-ink-muted">
            Showing <span className="tabular-nums text-ink">{Math.min(rendered.length, filtered.length)}</span> of{' '}
            <span className="tabular-nums text-ink">{formatCount(filtered.length)}</span> posts
            {hiddenCount > 0 ? <span className="ml-1 text-ink">· {hiddenCount} hidden</span> : null}
          </p>

          <div className="flex items-center gap-2" title="Local storage used by your posts, upvotes, comments and images">
            <span className="text-[10px] font-black uppercase tracking-widest text-ink-muted">Local storage</span>
            <span className="h-2.5 w-24 border-2 border-black bg-white" aria-hidden>
              <span
                className={cn('block h-full', storagePercent > 85 ? 'bg-danger' : storagePercent > 55 ? 'bg-lemon-400' : 'bg-olive-600')}
                style={{ width: `${Math.max(3, storagePercent)}%` }}
              />
            </span>
            <span className="text-[10px] font-black tabular-nums uppercase tracking-widest text-ink">
              {humanBytes(storageUsed)}
            </span>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            {hiddenCount > 0 ? (
              <button type="button" onClick={() => setShowHidden((value) => !value)} className="btn btn-sm btn-white">
                <EyeOff size={12} strokeWidth={3} aria-hidden />
                {showHidden ? 'Hide hidden posts' : `Show hidden (${hiddenCount})`}
              </button>
            ) : null}

            {showHidden && hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  posts.filter((post) => post.hidden).forEach((post) => unhidePost(post.id));
                  setShowHidden(false);
                  notify({ variant: 'success', title: 'All posts restored to your feed', duration: 3000 });
                }}
                className="btn btn-sm btn-olive"
              >
                <RotateCcw size={12} strokeWidth={3} aria-hidden /> Unhide all
              </button>
            ) : null}

            <button type="button" onClick={handleExport} className="btn btn-sm btn-white">
              <Download size={12} strokeWidth={3} aria-hidden /> Export
            </button>

            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="btn btn-sm btn-white"
              disabled={isImporting}
            >
              {isImporting ? <Loader2 size={12} strokeWidth={3} className="animate-spin" aria-hidden /> : <Upload size={12} strokeWidth={3} aria-hidden />}
              Import
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              className="sr-only"
              aria-label="Import a WHAATEVER feed export"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void handleImportFile(file);
                event.target.value = '';
              }}
            />

            <button
              type="button"
              onClick={() => {
                restoreSeedFeed();
                notify({ variant: 'ghost', title: 'Seed feed topped up', message: 'Fresh anonymous confessions added to the top.', duration: 3200 });
              }}
              className="btn btn-sm btn-white"
            >
              <RefreshCw size={12} strokeWidth={3} aria-hidden /> Reseed
            </button>

            <button type="button" onClick={() => setDialog('reset')} className="btn btn-sm btn-danger">
              <Trash2 size={12} strokeWidth={3} aria-hidden /> Reset
            </button>

            <button type="button" onClick={() => setDialog('empty')} className="btn btn-sm btn-white">
              <EyeOff size={12} strokeWidth={3} aria-hidden /> Empty board
            </button>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------- stream */}
      {!posts.length ? (
        <div className="mt-6 border-4 border-black bg-lemon-200 p-6 text-center shadow-brutal-lg">
          <h3 className="font-display text-xl uppercase">The board is empty (and slightly haunted)</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-soft">
            You cleared every post from this browser. Drop the first unfiltered thought of the new era, or refill the
            feed with the WHAATEVER seed confessions.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={onCreatePost} className="btn btn-cobalt">
              <PenSquare size={15} strokeWidth={3} aria-hidden /> Create the first post
            </button>
            <button
              type="button"
              onClick={() => {
                restoreSeedFeed();
                notify({ variant: 'success', title: 'Seed feed restored', duration: 3000 });
              }}
              className="btn btn-white"
            >
              <RefreshCw size={15} strokeWidth={3} aria-hidden /> Restore seed posts
            </button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-6 border-4 border-black bg-white p-6 text-center shadow-brutal-lg">
          <h3 className="font-display text-xl uppercase">No posts match that combination</h3>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-soft">
            Try a different filter tab, clear the category chip, or empty the search box. The unfiltered feed is in there
            somewhere.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => updateParams({ filter: 'all', category: 'all', q: '' })} className="btn btn-cobalt">
              Reset filters
            </button>
            <button type="button" onClick={() => setQuery('')} className="btn btn-white">
              Clear search
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="masonry mt-6 columns-1 sm:columns-2 xl:columns-3">
            {rendered.map((post, index) => (
              <PostCard
                key={post.id}
                post={post}
                now={now}
                rank={filter === 'trending' ? index + 1 : undefined}
              />
            ))}
          </div>

          {rendered.length < filtered.length ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + LIMITS.pageSize)}
                className="btn btn-cobalt btn-lg"
              >
                <Layers size={16} strokeWidth={3} aria-hidden />
                Load {Math.min(LIMITS.pageSize, filtered.length - rendered.length)} more posts
              </button>
              <p className="text-[11px] font-bold uppercase tracking-widest text-ink-muted">
                {formatCount(filtered.length - rendered.length)} posts still queued in this browser
              </p>
            </div>
          ) : (
            <p className="mt-6 border-3 border-black bg-cream py-3 text-center text-[11px] font-black uppercase tracking-widest text-ink-muted shadow-brutal-xs">
              That is every post in this feed. Add one of your own — nobody will know it was you.
            </p>
          )}

          <div className="mt-6 flex justify-center">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="btn btn-white btn-sm"
            >
              <ArrowUp size={13} strokeWidth={3} aria-hidden /> Back to top
            </button>
          </div>
        </>
      )}

      <ConfirmDialog
        open={dialog === 'reset'}
        title="Reset the local feed?"
        message="This wipes every post, upvote, comment and image stored in this browser and installs a fresh WHAATEVER seed feed. There is no cloud backup — nothing here exists anywhere else, so this cannot be undone."
        confirmLabel="Reset everything"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          clearAllPosts();
          restoreSeedFeed();
          setDialog(null);
          notify({
            variant: 'ghost',
            title: 'Local feed reset',
            message: 'Fresh seed confessions installed. Your old posts are gone for good.',
            duration: 4500,
          });
        }}
      />

      <ConfirmDialog
        open={dialog === 'empty'}
        title="Empty the confession board?"
        message="Every post disappears from this browser, leaving a completely blank live feed. Use the Reseed button any time you want the community content back."
        confirmLabel="Empty the board"
        destructive
        onCancel={() => setDialog(null)}
        onConfirm={() => {
          clearAllPosts();
          setDialog(null);
          notify({
            variant: 'info',
            title: 'Board emptied',
            message: 'You are looking at a blank confession board. Reseed whenever you want the noise back.',
            duration: 4200,
          });
        }}
      />
    </section>
  );
}
