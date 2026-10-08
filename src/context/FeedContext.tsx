import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { FeedFilter, FeedStats, Identity, NewPostInput, Post, PostComment, PersistReport } from '@/types';
import { LIMITS, getCategory } from '@/lib/constants';
import { countWords, trendingScore, uid } from '@/lib/utils';
import { createSeedPosts } from '@/lib/seed';
import {
  clearFeed,
  estimateFeedBytes,
  estimateMediaBytes,
  loadIdentity,
  loadPosts,
  loadVisits,
  registerVisit,
  saveIdentity,
  savePosts,
  type VisitStats,
} from '@/lib/storage';
import { ToastViewport, type ToastProps, type ToastVariant } from '@/components/Toast';

/* ------------------------------------------------------------------ reducer */

type Action =
  | { type: 'hydrate'; posts: Post[] }
  | { type: 'create'; post: Post }
  | { type: 'delete'; id: string }
  | { type: 'toggleLike'; id: string }
  | { type: 'incrementView'; id: string }
  | { type: 'addComment'; postId: string; comment: PostComment }
  | { type: 'deleteComment'; postId: string; commentId: string }
  | { type: 'toggleCommentLike'; postId: string; commentId: string }
  | { type: 'togglePin'; id: string }
  | { type: 'setHidden'; id: string; hidden: boolean }
  | { type: 'restoreSeed'; posts: Post[] }
  | { type: 'restore'; post: Post }
  | { type: 'clearAll' };

function mapPost(posts: Post[], id: string, mapper: (post: Post) => Post): Post[] {
  return posts.map((post) => (post.id === id ? mapper(post) : post));
}

function reducer(state: Post[], action: Action): Post[] {
  switch (action.type) {
    case 'hydrate':
      return action.posts;

    case 'create':
      return [action.post, ...state];

    case 'delete':
      return state.filter((post) => post.id !== action.id);

    case 'toggleLike':
      return mapPost(state, action.id, (post) => ({
        ...post,
        likedByMe: !post.likedByMe,
        likes: Math.max(0, post.likes + (post.likedByMe ? -1 : 1)),
      }));

    case 'incrementView':
      return mapPost(state, action.id, (post) => ({ ...post, views: post.views + 1 }));

    case 'addComment':
      return mapPost(state, action.postId, (post) => ({ ...post, comments: [...post.comments, action.comment] }));

    case 'deleteComment':
      return mapPost(state, action.postId, (post) => ({
        ...post,
        comments: post.comments.filter((comment) => comment.id !== action.commentId),
      }));

    case 'toggleCommentLike':
      return mapPost(state, action.postId, (post) => ({
        ...post,
        comments: post.comments.map((comment) =>
          comment.id === action.commentId
            ? {
                ...comment,
                likedByMe: !comment.likedByMe,
                likes: Math.max(0, comment.likes + (comment.likedByMe ? -1 : 1)),
              }
            : comment,
        ),
      }));

    case 'togglePin':
      return mapPost(state, action.id, (post) => ({ ...post, pinned: !post.pinned }));

    case 'setHidden':
      return mapPost(state, action.id, (post) => ({ ...post, hidden: action.hidden }));

    case 'restoreSeed': {
      const existing = new Set(state.map((post) => post.id));
      const additions = action.posts.filter((post) => !existing.has(post.id));
      return [...additions, ...state];
    }

    case 'restore':
      // Undo path for deletes: re-insert the exact post at its original rank.
      return [...state.filter((post) => post.id !== action.post.id), action.post].sort(
        (a, b) => b.createdAt - a.createdAt,
      );

    case 'clearAll':
      return [];

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ context */

export interface ToastOptions {
  variant?: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
  action?: { label: string; onClick: () => void };
}

export interface FeedContextValue {
  posts: Post[];
  visiblePosts: Post[];
  stats: FeedStats;
  identity: Identity;
  visits: VisitStats;
  isHydrated: boolean;
  storageAvailable: boolean;
  lastPersist: PersistReport | null;
  setIdentity: (next: Identity) => void;
  setGhostMode: (ghostMode: boolean) => void;
  setName: (name: string) => void;
  createPost: (input: NewPostInput) => Post;
  deletePost: (id: string) => void;
  restorePost: (post: Post) => void;
  toggleLike: (id: string) => void;
  registerView: (id: string) => void;
  addComment: (postId: string, content: string, author: string | null) => PostComment;
  deleteComment: (postId: string, commentId: string) => void;
  toggleCommentLike: (postId: string, commentId: string) => void;
  togglePin: (id: string) => void;
  hidePost: (id: string) => void;
  unhidePost: (id: string) => void;
  clearAllPosts: () => void;
  restoreSeedFeed: () => void;
  exportFeed: () => Post[];
  importFeed: (posts: Post[]) => number;
  notify: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
}

const FeedContext = createContext<FeedContextValue | null>(null);

interface ToastRecord extends ToastProps {
  createdAt: number;
}

const MAX_TOASTS = 4;

/* ---------------------------------------------------------------- provider */

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, dispatch] = useReducer(reducer, [] as Post[]);
  const [identity, setIdentityState] = useState<Identity>({ ghostMode: true, name: '' });
  const [visits, setVisits] = useState<VisitStats>({ count: 1, firstSeen: Date.now(), lastSeen: Date.now() });
  const [isHydrated, setIsHydrated] = useState(false);
  const [storageAvailable, setStorageAvailable] = useState(true);
  const [lastPersist, setLastPersist] = useState<PersistReport | null>(null);
  const [toasts, setToasts] = useState<ToastRecord[]>([]);

  const hydratedRef = useRef(false);
  const countedViews = useRef<Set<string>>(new Set());
  const storageWarningShown = useRef(false);

  /* ------------------------------------------------------------ notifications */

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback((options: ToastOptions) => {
    const id = uid('toast');
    const record: ToastRecord = {
      id,
      variant: options.variant ?? 'info',
      title: options.title,
      message: options.message,
      duration: options.duration ?? 4200,
      action: options.action,
      createdAt: Date.now(),
      onDismiss: dismissToast,
    };
    setToasts((current) => [record, ...current].slice(0, MAX_TOASTS));
    return id;
  }, [dismissToast]);

  /* ---------------------------------------------------------------- hydration */

  useEffect(() => {
    let cancelled = false;

    const hydrate = async () => {
      const [{ posts: stored, seeded }] = await Promise.all([Promise.resolve(loadPosts())]);
      if (cancelled) return;

      dispatch({ type: 'hydrate', posts: stored });
      setIdentityState(loadIdentity());
      setVisits(registerVisit());
      setIsHydrated(true);
      hydratedRef.current = true;

      if (seeded) {
        notify({
          variant: 'ghost',
          title: 'Ghost mode engaged',
          message: 'No account, no email, no trace. Drop your first unfiltered post whenever you are ready.',
          duration: 6000,
        });
      }
    };

    void hydrate();

    return () => {
      cancelled = true;
    };
  }, [notify]);

  /* -------------------------------------------------------------- persistence */

  useEffect(() => {
    if (!hydratedRef.current) return;

    const timer = window.setTimeout(() => {
      const report = savePosts(posts);
      setLastPersist(report);

      if (!report.ok && report.error) {
        if (!storageWarningShown.current) {
          storageWarningShown.current = true;
          notify({ variant: 'error', title: 'Storage limit reached', message: report.error, duration: 7000 });
        }
      } else if (report.strippedImages > 0 && report.error) {
        notify({ variant: 'info', title: 'Feed trimmed to fit', message: report.error, duration: 6000 });
      }
    }, 450);

    return () => window.clearTimeout(timer);
  }, [posts, notify]);

  useEffect(() => {
    if (!isHydrated) return;
    saveIdentity(identity);
  }, [identity, isHydrated]);

  /* ------------------------------------------------------------------ actions */

  const createPost = useCallback(
    (input: NewPostInput): Post => {
      const post: Post = {
        id: uid('p'),
        author: input.author && input.author.trim() ? input.author.trim().slice(0, LIMITS.name) : null,
        content: input.content.trim().slice(0, LIMITS.post),
        category: input.category,
        image: input.image,
        createdAt: Date.now(),
        likes: 0,
        likedByMe: false,
        comments: [],
        mine: true,
        hidden: false,
        pinned: false,
        views: 1,
      };

      dispatch({ type: 'create', post });
      return post;
    },
    [],
  );

  const deletePost = useCallback((id: string) => {
    dispatch({ type: 'delete', id });
  }, []);

  const restorePost = useCallback((post: Post) => {
    dispatch({ type: 'restore', post });
  }, []);

  const toggleLike = useCallback((id: string) => {
    dispatch({ type: 'toggleLike', id });
  }, []);

  const registerView = useCallback((id: string) => {
    if (countedViews.current.has(id)) return;
    countedViews.current.add(id);
    dispatch({ type: 'incrementView', id });
  }, []);

  const addComment = useCallback((postId: string, content: string, author: string | null): PostComment => {
    const comment: PostComment = {
      id: uid('c'),
      author: author && author.trim() ? author.trim().slice(0, LIMITS.name) : null,
      content: content.trim().slice(0, LIMITS.comment),
      createdAt: Date.now(),
      likes: 0,
      likedByMe: false,
      mine: true,
    };

    dispatch({ type: 'addComment', postId, comment });
    return comment;
  }, []);

  const deleteComment = useCallback((postId: string, commentId: string) => {
    dispatch({ type: 'deleteComment', postId, commentId });
  }, []);

  const toggleCommentLike = useCallback((postId: string, commentId: string) => {
    dispatch({ type: 'toggleCommentLike', postId, commentId });
  }, []);

  const togglePin = useCallback((id: string) => {
    dispatch({ type: 'togglePin', id });
  }, []);

  const hidePost = useCallback((id: string) => {
    dispatch({ type: 'setHidden', id, hidden: true });
  }, []);

  const unhidePost = useCallback((id: string) => {
    dispatch({ type: 'setHidden', id, hidden: false });
  }, []);

  const clearAllPosts = useCallback(() => {
    dispatch({ type: 'clearAll' });
    clearFeed();
  }, []);

  const restoreSeedFeed = useCallback(() => {
    const seed = createSeedPosts();
    dispatch({ type: 'restoreSeed', posts: seed });
  }, []);

  const exportFeed = useCallback((): Post[] => posts, [posts]);

  const importFeed = useCallback((incoming: Post[]): number => {
    const seed = incoming.filter((post) => post && typeof post.content === 'string');
    dispatch({ type: 'restoreSeed', posts: seed });
    return seed.length;
  }, []);

  const setIdentity = useCallback((next: Identity) => {
    setIdentityState({ ghostMode: next.ghostMode, name: next.name.slice(0, LIMITS.name) });
  }, []);

  const setGhostMode = useCallback((ghostMode: boolean) => {
    setIdentityState((current) => ({ ...current, ghostMode }));
  }, []);

  const setName = useCallback((name: string) => {
    setIdentityState((current) => ({ ...current, name: name.slice(0, LIMITS.name) }));
  }, []);

  /* -------------------------------------------------------------------- stats */

  const visiblePosts = useMemo(() => posts.filter((post) => !post.hidden), [posts]);

  const stats = useMemo<FeedStats>(() => {
    const now = Date.now();
    return {
      posts: visiblePosts.length,
      ghosts: visiblePosts.filter((post) => !post.author).length,
      named: visiblePosts.filter((post) => !!post.author).length,
      likes: visiblePosts.reduce((total, post) => total + post.likes, 0),
      comments: visiblePosts.reduce((total, post) => total + post.comments.length, 0),
      images: visiblePosts.filter((post) => !!post.image).length,
      words: visiblePosts.reduce((total, post) => total + countWords(post.content), 0),
      trendingScore: Math.round(visiblePosts.reduce((total, post) => total + trendingScore(post, now), 0)),
      storageBytes: estimateFeedBytes(visiblePosts) + estimateMediaBytes(visiblePosts),
    };
  }, [visiblePosts]);

  useEffect(() => {
    // Probe once so the UI can warn private-mode visitors that nothing will stick.
    try {
      const probe = '__whaatever_probe__';
      window.localStorage.setItem(probe, '1');
      window.localStorage.removeItem(probe);
      setStorageAvailable(true);
    } catch {
      setStorageAvailable(false);
    }
  }, []);

  useEffect(() => {
    if (isHydrated && !storageAvailable) {
      notify({
        variant: 'info',
        title: 'Session-only mode',
        message: 'Your browser is blocking local storage, so posts will vanish on refresh. Try disabling private browsing.',
        duration: 8000,
      });
    }
  }, [isHydrated, storageAvailable, notify]);

  const value = useMemo<FeedContextValue>(
    () => ({
      posts,
      visiblePosts,
      stats,
      identity,
      visits,
      isHydrated,
      storageAvailable,
      lastPersist,
      setIdentity,
      setGhostMode,
      setName,
      createPost,
      deletePost,
      restorePost,
      toggleLike,
      registerView,
      addComment,
      deleteComment,
      toggleCommentLike,
      togglePin,
      hidePost,
      unhidePost,
      clearAllPosts,
      restoreSeedFeed,
      exportFeed,
      importFeed,
      notify,
      dismissToast,
    }),
    [
      posts,
      visiblePosts,
      stats,
      identity,
      visits,
      isHydrated,
      storageAvailable,
      lastPersist,
      setIdentity,
      setGhostMode,
      setName,
      createPost,
      deletePost,
      restorePost,
      toggleLike,
      registerView,
      addComment,
      deleteComment,
      toggleCommentLike,
      togglePin,
      hidePost,
      unhidePost,
      clearAllPosts,
      restoreSeedFeed,
      exportFeed,
      importFeed,
      notify,
      dismissToast,
    ],
  );

  return (
    <FeedContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </FeedContext.Provider>
  );
}

/* ------------------------------------------------------------------- hook */

export function useFeed(): FeedContextValue {
  const context = useContext(FeedContext);
  if (!context) {
    throw new Error('useFeed() must be used inside <FeedProvider> — check your provider tree.');
  }
  return context;
}

/* ------------------------------------------------------------------ helpers */

export function loadVisitsSnapshot(): VisitStats {
  return loadVisits();
}

/** Apply a filter tab to the feed. Exported so the feed view can compose it. */
export function applyFilter(posts: Post[], filter: FeedFilter, now = Date.now()): Post[] {
  const base = posts.filter((post) => !post.hidden);

  switch (filter) {
    case 'anonymous':
      return base
        .filter((post) => !post.author)
        .sort((a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.createdAt - a.createdAt);

    case 'trending':
      return [...base].sort((a, b) => trendingScore(b, now) - trendingScore(a, now));

    case 'latest':
      return [...base].sort((a, b) => b.createdAt - a.createdAt);

    case 'all':
    default:
      return [...base].sort(
        (a, b) => Number(b.pinned ?? false) - Number(a.pinned ?? false) || b.createdAt - a.createdAt,
      );
  }
}

/** Category label for a post, with a safe fallback. */
export function categoryOf(post: Post) {
  return getCategory(post.category);
}
