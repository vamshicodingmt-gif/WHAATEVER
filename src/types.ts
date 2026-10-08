/**
 * WHAATEVER — shared domain types.
 */

export type CategoryId = 'confession' | 'rant' | 'secret' | 'hottake' | 'question' | 'win' | 'media';

export interface Category {
  id: CategoryId;
  /** Human label rendered on the badge. */
  label: string;
  emoji: string;
  /** Tailwind classes for the category badge. */
  badge: string;
  /** Tailwind background class for the accent strip / bullet. */
  accent: string;
  /** Short keyword-rich blurb used offline (SEO copy + composer tooltip). */
  blurb: string;
}

export interface MediaAttachment {
  /** Base64 data URL — this is what makes attachments 100% client-side. */
  dataUrl: string;
  width: number;
  height: number;
  /** Approximate decoded byte size, used for the storage budget meter. */
  bytes: number;
  name: string;
}

export interface PostComment {
  id: string;
  /** `null` means the comment came from the Anonymous Whaatever Ghost. */
  author: string | null;
  content: string;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  /** True when this browser created the comment (enables local delete). */
  mine: boolean;
}

export interface Post {
  id: string;
  /** `null` means anonymous (ghost handle), otherwise the custom pseudonym. */
  author: string | null;
  content: string;
  category: CategoryId;
  image: MediaAttachment | null;
  createdAt: number;
  likes: number;
  likedByMe: boolean;
  comments: PostComment[];
  /** True when this browser created the post. */
  mine: boolean;
  /** Locally hidden by the reader (soft delete from their own view). */
  hidden: boolean;
  pinned?: boolean;
  views: number;
}

export type FeedFilter = 'all' | 'anonymous' | 'trending' | 'latest';

export interface FeedStats {
  posts: number;
  ghosts: number;
  named: number;
  likes: number;
  comments: number;
  images: number;
  words: number;
  trendingScore: number;
  storageBytes: number;
}

export interface Identity {
  /** When true the user posts as the Anonymous Whaatever Ghost. */
  ghostMode: boolean;
  /** The saved custom name / pseudonym used when ghostMode is false. */
  name: string;
}

export interface NewPostInput {
  content: string;
  author: string | null;
  category: CategoryId;
  image: MediaAttachment | null;
}

export interface PersistReport {
  ok: boolean;
  /** How many image payloads had to be dropped to fit the storage budget. */
  strippedImages: number;
  error?: string;
}
