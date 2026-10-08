import type { Identity, MediaAttachment, PersistReport, Post } from '@/types';
import { CATEGORY_MAP, LIMITS } from '@/lib/constants';
import { byteLength, uid } from '@/lib/utils';
import { createSeedPosts } from '@/lib/seed';

/**
 * WHAATEVER persistence layer.
 *
 * Everything lives in localStorage — there is no backend, no database and no
 * network call anywhere in this file. Every read is defensive: a corrupted or
 * hand-edited key falls back to freshly seeded content instead of crashing the
 * app, which is the behaviour you want when the storage engine belongs to the
 * user.
 */

export const STORAGE_KEYS = {
  posts: 'whaatever:posts:v1',
  identity: 'whaatever:identity:v1',
  draft: 'whaatever:draft:v1',
  visit: 'whaatever:visit:v1',
} as const;

/* ------------------------------------------------------------------ plumbing */

export function isStorageAvailable(): boolean {
  try {
    const probe = '__whaatever_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

function readRaw(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeRaw(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function removeRaw(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* nothing to do — storage may be unavailable in private modes */
  }
}

/* --------------------------------------------------------------------- posts */

function isMediaAttachment(value: unknown): value is MediaAttachment {
  if (!value || typeof value !== 'object') return false;
  const media = value as Partial<MediaAttachment>;
  return typeof media.dataUrl === 'string' && media.dataUrl.startsWith('data:image/');
}

/** Coerce an unknown blob into a valid Post, or return null if it is hopeless. */
function normalisePost(raw: unknown): Post | null {
  if (!raw || typeof raw !== 'object') return null;
  const candidate = raw as Partial<Post>;

  if (typeof candidate.id !== 'string' || typeof candidate.content !== 'string') return null;

  const category =
    typeof candidate.category === 'string' && candidate.category in CATEGORY_MAP
      ? (candidate.category as Post['category'])
      : 'confession';

  const comments = Array.isArray(candidate.comments)
    ? candidate.comments
        .filter((comment): comment is Post['comments'][number] => !!comment && typeof comment.content === 'string')
        .map((comment) => ({
          id: typeof comment.id === 'string' ? comment.id : uid('c'),
          author: typeof comment.author === 'string' && comment.author.trim() ? comment.author.trim() : null,
          content: comment.content,
          createdAt: typeof comment.createdAt === 'number' ? comment.createdAt : Date.now(),
          likes: typeof comment.likes === 'number' ? Math.max(0, comment.likes) : 0,
          likedByMe: comment.likedByMe === true,
          mine: comment.mine === true,
        }))
    : [];

  return {
    id: candidate.id,
    author: typeof candidate.author === 'string' && candidate.author.trim() ? candidate.author.trim() : null,
    content: candidate.content,
    category,
    image: isMediaAttachment(candidate.image) ? candidate.image : null,
    createdAt: typeof candidate.createdAt === 'number' ? candidate.createdAt : Date.now(),
    likes: typeof candidate.likes === 'number' ? Math.max(0, candidate.likes) : 0,
    likedByMe: candidate.likedByMe === true,
    comments,
    mine: candidate.mine === true,
    hidden: candidate.hidden === true,
    pinned: candidate.pinned === true,
    views: typeof candidate.views === 'number' ? Math.max(0, candidate.views) : 0,
  };
}

export interface LoadedFeed {
  posts: Post[];
  /** True when this was the very first visit and the seed feed was installed. */
  seeded: boolean;
}

/** Read the feed. Falls back to keyword-optimised seed content on first run. */
export function loadPosts(): LoadedFeed {
  const raw = readRaw(STORAGE_KEYS.posts);

  if (!raw) {
    const seeded = createSeedPosts();
    savePosts(seeded);
    return { posts: seeded, seeded: true };
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const list = Array.isArray(parsed) ? parsed : [];
    const posts = list.map(normalisePost).filter((post): post is Post => post !== null);

    if (posts.length === 0) {
      const seeded = createSeedPosts();
      savePosts(seeded);
      return { posts: seeded, seeded: true };
    }

    // Newest first on hydrate; the UI re-sorts per filter anyway.
    return { posts: posts.sort((a, b) => b.createdAt - a.createdAt), seeded: false };
  } catch {
    const seeded = createSeedPosts();
    savePosts(seeded);
    return { posts: seeded, seeded: true };
  }
}

/**
 * Persist the feed. If localStorage rejects the payload (almost always the
 * 5MB quota, and almost always because of base64 imagery) we progressively
 * strip attachments from the oldest posts and retry before giving up.
 */
export function savePosts(posts: Post[]): PersistReport {
  const payload = () => JSON.stringify(posts);
  const serialised = payload();

  if (writeRaw(STORAGE_KEYS.posts, serialised)) {
    return { ok: true, strippedImages: 0 };
  }

  // Retry 1: drop the heaviest images first, oldest post first.
  const working = posts.map((post) => ({ ...post }));
  const withImages = working
    .filter((post) => post.image)
    .sort((a, b) => a.createdAt - b.createdAt);

  let stripped = 0;
  for (const post of withImages) {
    post.image = null;
    stripped += 1;
    if (writeRaw(STORAGE_KEYS.posts, JSON.stringify(working))) {
      return { ok: true, strippedImages: stripped };
    }
    if (stripped >= 6) break;
  }

  // Retry 2: keep the 120 freshest text posts only.
  const trimmed = working.slice(0, 120);
  if (writeRaw(STORAGE_KEYS.posts, JSON.stringify(trimmed))) {
    return {
      ok: true,
      strippedImages: stripped,
      error: 'Browser storage was nearly full, so older image attachments were dropped.',
    };
  }

  return {
    ok: false,
    strippedImages: stripped,
    error: 'Browser storage is full — this post is live in the feed but could not be saved for your next visit.',
  };
}

export function clearFeed(): void {
  removeRaw(STORAGE_KEYS.posts);
}

/** Approximate byte footprint of the whole feed (UTF-16 aware). */
export function estimateFeedBytes(posts: Post[]): number {
  try {
    return byteLength(JSON.stringify(posts));
  } catch {
    return 0;
  }
}

/** Total decoded size of every attached image, used by the storage meter. */
export function estimateMediaBytes(posts: Post[]): number {
  return posts.reduce((total, post) => total + (post.image?.bytes ?? 0), 0);
}

/* ------------------------------------------------------------------ identity */

const DEFAULT_IDENTITY: Identity = { ghostMode: true, name: '' };

export function loadIdentity(): Identity {
  const raw = readRaw(STORAGE_KEYS.identity);
  if (!raw) return { ...DEFAULT_IDENTITY };

  try {
    const parsed = JSON.parse(raw) as Partial<Identity>;
    return {
      ghostMode: parsed.ghostMode !== false,
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, LIMITS.name) : '',
    };
  } catch {
    return { ...DEFAULT_IDENTITY };
  }
}

export function saveIdentity(identity: Identity): void {
  writeRaw(
    STORAGE_KEYS.identity,
    JSON.stringify({ ghostMode: identity.ghostMode, name: identity.name.slice(0, LIMITS.name) }),
  );
}

/* --------------------------------------------------------------------- draft */

export interface Draft {
  content: string;
  category: Post['category'];
  ghostMode: boolean;
  name: string;
  savedAt: number;
}

export function loadDraft(): Draft | null {
  const raw = readRaw(STORAGE_KEYS.draft);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<Draft>;
    if (typeof parsed.content !== 'string') return null;
    return {
      content: parsed.content.slice(0, LIMITS.post),
      category: typeof parsed.category === 'string' ? (parsed.category as Post['category']) : 'confession',
      ghostMode: parsed.ghostMode !== false,
      name: typeof parsed.name === 'string' ? parsed.name.slice(0, LIMITS.name) : '',
      savedAt: typeof parsed.savedAt === 'number' ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveDraft(draft: Omit<Draft, 'savedAt'>): void {
  writeRaw(STORAGE_KEYS.draft, JSON.stringify({ ...draft, savedAt: Date.now() }));
}

export function clearDraft(): void {
  removeRaw(STORAGE_KEYS.draft);
}

/* ---------------------------------------------------------------- visit stats */

export interface VisitStats {
  /** Local visit count for this browser. */
  count: number;
  firstSeen: number;
  lastSeen: number;
}

const DEFAULT_VISIT: VisitStats = { count: 1, firstSeen: Date.now(), lastSeen: Date.now() };

export function loadVisits(): VisitStats {
  const raw = readRaw(STORAGE_KEYS.visit);
  if (!raw) return { ...DEFAULT_VISIT };

  try {
    const parsed = JSON.parse(raw) as Partial<VisitStats>;
    return {
      count: typeof parsed.count === 'number' ? Math.max(1, parsed.count) : 1,
      firstSeen: typeof parsed.firstSeen === 'number' ? parsed.firstSeen : Date.now(),
      lastSeen: typeof parsed.lastSeen === 'number' ? parsed.lastSeen : Date.now(),
    };
  } catch {
    return { ...DEFAULT_VISIT };
  }
}

export function registerVisit(): VisitStats {
  const current = loadVisits();
  const next: VisitStats = { ...current, count: current.count + 1, lastSeen: Date.now() };
  writeRaw(STORAGE_KEYS.visit, JSON.stringify(next));
  return next;
}
