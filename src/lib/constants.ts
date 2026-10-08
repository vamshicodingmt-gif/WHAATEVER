import type { Category, CategoryId, FeedFilter } from '@/types';

/* ==========================================================================
   SITE CONSTANTS — the single source of truth for branding + SEO plumbing.
   ========================================================================== */

export const SITE = {
  name: 'WHAATEVER',
  /** The canonical deployment target. */
  url: 'https://whaatever.vercel.app',
  domain: 'WHAATEVER.VERCEL.APP',
  host: 'whaatever.vercel.app',
  tagline: 'The Ultimate Anonymous Posting & Confession Platform',
  shortTagline: 'Post it anonymously. WHAATEVER.',
  description:
    'Welcome to WHAATEVER at WHAATEVER.VERCEL.APP — the ultimate anonymous posting platform for unfiltered rants, secrets, and thoughts. Post instantly with zero logins required.',
  keywords:
    'WHAATEVER, WHAATEVER.VERCEL.APP, anonymous posting, confession platform, unfiltered thoughts, public rants, micro-blogging, anonymous text and image sharing',
  longDescription:
    'WHAATEVER is a 100% client-side anonymous posting platform, online confession board and unfiltered micro-blogging community. Publish rants, secrets, confessions, hot takes and images instantly as an anonymous ghost — or attach a name if you feel like it. No accounts. No logins. No backend.',
  ogImage: '/og-image.png',
  twitter: '@whaatever',
  founded: '2026',
  locale: 'en_US',
} as const;

/** Absolute URL helper so canonical / OG tags are always fully qualified. */
export function absoluteUrl(path = '/'): string {
  if (/^https?:\/\//i.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE.url}${clean === '/' ? '/' : clean}`;
}

/** The default handle shown for every anonymous post. */
export const GHOST_HANDLE = 'Anonymous Whaatever Ghost';

export const LIMITS = {
  post: 2000,
  comment: 500,
  name: 32,
  /** Soft budget for the whole localStorage feed before images get pruned. */
  storageSoftLimitBytes: 4_200_000,
  /** Hard cap for a single uploaded file. */
  uploadBytes: 8 * 1024 * 1024,
  /** Pages of the feed rendered incrementally (posts per page). */
  pageSize: 12,
} as const;

/* ==========================================================================
   CATEGORIES
   ========================================================================== */

export const CATEGORIES: Category[] = [
  {
    id: 'confession',
    label: 'Confession',
    emoji: '🤫',
    badge: 'border-black bg-cobalt-600 text-white',
    accent: 'bg-cobalt-600',
    blurb: 'Confess anonymously to the confession board — no account, no judgement, no trace.',
  },
  {
    id: 'rant',
    label: 'Rant',
    emoji: '🔥',
    badge: 'border-black bg-lemon-400 text-ink',
    accent: 'bg-lemon-400',
    blurb: 'Unfiltered rants and public venting, posted anonymously in real time.',
  },
  {
    id: 'secret',
    label: 'Secret',
    emoji: '🗝️',
    badge: 'border-black bg-olive-600 text-white',
    accent: 'bg-olive-600',
    blurb: 'Drop a secret on the anonymous board and let it go.',
  },
  {
    id: 'hottake',
    label: 'Hot Take',
    emoji: '🌶️',
    badge: 'border-black bg-danger text-white',
    accent: 'bg-danger',
    blurb: 'Scorching hot takes, unpopular opinions and unfiltered thoughts.',
  },
  {
    id: 'question',
    label: 'Question',
    emoji: '❓',
    badge: 'border-black bg-beige text-ink',
    accent: 'bg-beige',
    blurb: 'Ask the anonymous crowd anything and read brutally honest answers.',
  },
  {
    id: 'win',
    label: 'Win',
    emoji: '🏆',
    badge: 'border-black bg-olive-700 text-white',
    accent: 'bg-olive-700',
    blurb: 'Small wins, big wins and anonymous celebrations.',
  },
  {
    id: 'media',
    label: 'Media',
    emoji: '📸',
    badge: 'border-black bg-cobalt-800 text-white',
    accent: 'bg-cobalt-800',
    blurb: 'Anonymous image sharing — screenshots, memes and photos nobody can trace back to you.',
  },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, category) => {
    acc[category.id] = category;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

export function getCategory(id: CategoryId | string | undefined): Category {
  if (id && id in CATEGORY_MAP) return CATEGORY_MAP[id as CategoryId];
  return CATEGORY_MAP.confession;
}

/* ==========================================================================
   FEED FILTERS
   ========================================================================== */

export interface FilterDef {
  id: FeedFilter;
  label: string;
  hint: string;
  icon: 'layers' | 'ghost' | 'flame' | 'clock';
}

export const FILTERS: FilterDef[] = [
  { id: 'all', label: 'All Posts', hint: 'Every post on the anonymous feed', icon: 'layers' },
  { id: 'anonymous', label: 'Anonymous Only', hint: 'Pure ghost posts, zero names attached', icon: 'ghost' },
  { id: 'trending', label: 'Trending', hint: 'Most upvoted + most argued about right now', icon: 'flame' },
  { id: 'latest', label: 'Latest', hint: 'Newest confessions first', icon: 'clock' },
];

/* ==========================================================================
   NAVIGATION
   ========================================================================== */

export interface NavLink {
  to: string;
  label: string;
  description: string;
  /** Whether the route should appear in sitemap.xml (all of them do). */
  footer?: boolean;
}

export const NAV_LINKS: NavLink[] = [
  { to: '/', label: 'The Feed', description: 'Live anonymous feed and confessions', footer: true },
  { to: '/trending', label: 'Trending', description: 'Trending anonymous posts and rants', footer: true },
  { to: '/about', label: 'About', description: 'About the WHAATEVER anonymous posting platform', footer: true },
  { to: '/guidelines', label: 'Guidelines', description: 'Community guidelines and house rules', footer: true },
  { to: '/privacy', label: 'Privacy', description: 'How WHAATEVER keeps your words in your browser', footer: true },
];

/* ==========================================================================
   COMPOSER PROMPTS — light-touch nudges that make the vault feel alive.
   ========================================================================== */

export interface ComposerPrompt {
  label: string;
  text: string;
}

export const COMPOSER_PROMPTS: ComposerPrompt[] = [
  { label: 'I need to confess…', text: 'I need to confess something I have never said out loud: ' },
  { label: 'Hot take:', text: 'Hot take: ' },
  { label: 'Unpopular opinion:', text: 'Unpopular opinion: ' },
  { label: 'Nobody at work knows…', text: 'Nobody at work knows that ' },
  { label: 'I finally did it.', text: 'After months of putting it off, I finally did it. ' },
  { label: 'Small win:', text: 'Small win worth celebrating: ' },
];

/* ==========================================================================
   FAQ — powers the on-page FAQ accordion *and* the FAQPage structured data.
   ========================================================================== */

export interface FaqItem {
  question: string;
  answer: string;
}

export const FAQS: FaqItem[] = [
  {
    question: 'What is WHAATEVER?',
    answer:
      'WHAATEVER is an anonymous posting platform, online confession board and unfiltered micro-blogging community hosted at WHAATEVER.VERCEL.APP. It lets you publish thoughts, rants, secrets and images to a live feed without creating an account.',
  },
  {
    question: 'Do I need to sign up or log in to post anonymously?',
    answer:
      'No. There are zero logins, zero email confirmations and zero captchas. Open the site, tap Create Post, type whatever you need to say and hit publish. Ghost Mode is on by default so your post goes out as the Anonymous Whaatever Ghost.',
  },
  {
    question: 'Can I attach a name to my confession instead of posting as a ghost?',
    answer:
      'Yes. The Vault (our composer) has an identity switch: leave Ghost Mode on for a fully anonymous post, or switch it off and type any name, handle or pseudonym you want attached to the post.',
  },
  {
    question: 'Where are my posts stored?',
    answer:
      'WHAATEVER is a 100% client-side rendered single page application with no backend and no database. Your posts, upvotes, comments and base64 image attachments live in your own browser localStorage, which means your words never leave your device unless you export them yourself.',
  },
  {
    question: 'Can I post images anonymously?',
    answer:
      'Absolutely. Drop, paste or pick an image in the composer and it is compressed and converted to a local base64 payload right inside your browser. Anonymous text and image sharing with no upload server in the middle.',
  },
  {
    question: 'Are unfiltered thoughts and explicit language allowed?',
    answer:
      'WHAATEVER is built for raw, unfiltered expression — swearing, messy feelings and unpopular opinions are welcome. What is not welcome is targeted harassment, doxxing, hate speech or anything illegal. See the community guidelines for the short list.',
  },
  {
    question: 'How does the Trending feed work?',
    answer:
      'Every post is scored from upvotes, comment volume and recency decay, so the Trending tab surfaces the anonymous confessions and rants the community is actually engaging with right now.',
  },
  {
    question: 'Is WHAATEVER free?',
    answer:
      'Yes — WHAATEVER is completely free, ad-free and tracker-free. It is a static site deployed to Vercel, so there is nothing to subscribe to and nothing to sign away.',
  },
];

/* ==========================================================================
   TICKER COPY — the marquee strip under the navbar.
   ========================================================================== */

export const TICKER_ITEMS: string[] = [
  'ZERO LOGINS REQUIRED',
  'GHOST MODE ON BY DEFAULT',
  'UNFILTERED THOUGHTS & RANTS',
  'ANONYMOUS IMAGE SHARING',
  'NO ACCOUNTS. NO TRACKERS. NO BACKEND.',
  'WHAATEVER.VERCEL.APP',
  'SPILL IT ANONYMOUSLY',
  '100% CLIENT-SIDE',
];

export const SEO_BADGES: string[] = [
  'Anonymous Posting Platform',
  'Online Confession Board',
  'Zero Logins',
  '100% Client-Side SPA',
];
