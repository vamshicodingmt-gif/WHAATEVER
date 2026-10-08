# WHAATEVER

**The ultimate anonymous posting platform, online confession board and unfiltered micro-blogging community.**
Live at **[whaatever.vercel.app](https://whaatever.vercel.app)**

WHAATEVER lets anyone post thoughts, rants, secrets and media instantly — **no sign-up, no account, no login, no email**.
Posters can stay completely anonymous (as the *Anonymous Whaatever Ghost*) or attach an optional name / pseudonym.
Explicit language, unfiltered thoughts and raw expression are fully allowed.

---

## Table of contents

1. [What is in the box](#what-is-in-the-box)
2. [Architecture: 100% client-side rendered](#architecture-100-client-side-rendered)
3. [Design system: high-end New Brutalism](#design-system-high-end-new-brutalism)
4. [Feature specifications](#feature-specifications)
5. [Technical SEO architecture](#technical-seo-architecture)
6. [Project structure](#project-structure)
7. [Getting started](#getting-started)
8. [Deploying to Vercel](#deploying-to-vercel)
9. [Data model & localStorage keys](#data-model--localstorage-keys)
10. [Testing](#testing)
11. [Accessibility & performance notes](#accessibility--performance-notes)

---

## What is in the box

| Requirement | Implementation |
| --- | --- |
| 100% client-side rendered SPA | Vite + React 18 + TypeScript, `BrowserRouter`, static `dist/` output |
| Zero backend / zero database | All state in browser `localStorage`; no API calls anywhere in `src/` |
| Live feed + masonry stream | `src/components/Feed.tsx` + `src/components/PostCard.tsx` (CSS multi-column masonry) |
| Filter tabs | All Posts · Anonymous Only · Trending · Latest (+ category chips + keyword search) |
| Composer ("The Vault") | `src/components/PostModal.tsx` — text, identity switch, image attach, optimistic publish |
| Engagement engine | Persisted upvotes/hearts + expandable comment drawer (`src/components/CommentSection.tsx`) |
| Dynamic head management | `src/components/SEOHead.tsx` (react-helmet-async) with OG, Twitter Cards and JSON-LD |
| Crawler files | `public/robots.txt`, `public/sitemap.xml`, plus static `<noscript>` SEO fallback in `index.html` |
| Tactile notifications | `src/components/Toast.tsx` (+ `ConfirmDialog.tsx`) |
| Keyword-optimised seed content | `src/lib/seed.ts` — 13 rich posts with comments and generated poster artwork |

---

## Architecture: 100% client-side rendered

```
Browser ──▶ index.html (static SEO payload + noscript fallback)
              └─▶ src/main.tsx
                    └─▶ App.tsx
                          ├─ HelmetProvider      (SEO head management)
                          ├─ BrowserRouter       (client-side routing)
                          ├─ FeedProvider        (localStorage state + toasts)
                          └─ Shell               (Navbar / routed <main> / Footer / PostModal)
```

* **No server render step.** `npm run build` emits plain HTML, CSS and JS into `dist/`.
* **No backend.** Nothing in `src/` performs a network request — not for posts, not for images, not for analytics.
* **Deep links work.** `vercel.json` rewrites every non-asset path to `/index.html`, so `/trending`, `/about`,
  `/guidelines`, `/privacy` and `/#post-<id>` all resolve on a hard refresh.
* **Graceful degradation.** `index.html` ships hardcoded meta tags and a semantic `<noscript>` document, so crawlers
  that never execute JavaScript still receive the full keyword payload and a crawlable internal link mesh.
* **Corruption-proof storage.** Every `localStorage` read is validated and coerced; a hand-edited or truncated key
  silently falls back to freshly seeded content instead of white-screening the app.
* **Quota-aware writes.** When the ~5MB storage budget is hit, `savePosts()` progressively strips the oldest image
  payloads and retries before surfacing a friendly toast.

## Design system: high-end New Brutalism

Defined once in `tailwind.config.js` + `src/index.css`, then composed everywhere.

| Role | Token | Value | Used for |
| --- | --- | --- | --- |
| Dominant base | `white` / `ink` | `#FFFFFF` / `#0A0A0A` | Backgrounds, 3–4px black borders, type |
| Primary accent | `cobalt.600` | `#2563EB` | Primary buttons, active tabs, branding, links |
| Vibrant highlight | `lemon.400` / `lemon.200` | `#FACC15` / `#FEF08A` | Alert banners, badges, primary CTAs, highlights |
| Earthy grounding | `olive.600` / `olive.700` | `#65A30D` / `#4D7C0F` | Secondary cards, win/secret tags, success states |
| Warm neutrals | `beige` / `cream` | `#F5F5DC` / `#FDFBF7` | Container fills, toolbars, breaking up contrast |

**UI mechanics**

* Hard offset shadows: `shadow-brutal` = `shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
  (plus `-xs/-sm/-lg/-xl/-2xl` and tinted `-cobalt/-lemon/-olive` variants).
* Physical push-down micro-interaction: `.push:active` → `translate(4px,4px)` + `box-shadow: none`
  (equivalently `active:translate-x-1 active:translate-y-1 active:shadow-none`).
* Typography: **Archivo Black** display headings + **Inter** body + **JetBrains Mono** for storage keys.
* Tactile extras: chunky black scrollbars, marquee ticker, hatched stickers, grid-paper panels, `wiggle` like
  animation, `pop-in` modals and `toast-in` notifications — all disabled under `prefers-reduced-motion`.

## Feature specifications

### 1. The live feed & masonry stream
* Renders every post from `localStorage`, newest first, in a responsive 1/2/3-column CSS masonry (`break-inside: avoid`).
* Each card shows: author name (or **Anonymous Whaatever Ghost**), relative + full timestamp, category badge, ghost/named
  chip, "Your post" and "Pinned" badges, local view count, media attachment, engagement heat meter, upvote/comment/share
  counts and a copyable permalink.
* Filter tabs: **All Posts**, **Anonymous Only**, **Trending**, **Latest** — mirrored into the URL (`?filter=trending`)
  so every view is linkable and crawlable. Plus seven category chips, debounced keyword search and paginated "load more".
* Feed toolbar: export/import JSON, reseed the starter content, hide/unhide posts, reset or empty the whole board, and a
  live localStorage budget meter.

### 2. The posting modal ("The Vault")
* Rich, resizeable text area (2 000 chars) with a live character counter and one-tap prompt starters.
* **Identity selector:** a Ghost Mode switch. On → posts as the anonymous ghost. Off → attaches any name / pseudonym
  (persisted locally and reused for comments).
* **Image attachment zone:** drag-and-drop, paste (Ctrl/⌘+V) or file picker, with instant preview thumbnail, dimensions,
  before/after compression figures and one-tap removal. Everything is decoded, downscaled to ≤1600px, re-encoded as
  quality-82 JPEG (animated GIFs pass through) and stored as a local base64 payload.
* **Publish** performs an optimistic UI update (card appears instantly), closes the vault, fires a tactile success toast
  with an *Undo* action, and writes through a draft-auto-save/restore system.
* Drafts survive a refresh; `Ctrl/⌘ + Enter` publishes without touching the mouse.

### 3. Engagement engine
* Upvote/heart button with a physical press animation; counts persist per post in browser state and survive reloads.
* Expandable comment drawer beneath every post: per-comment avatars, likes, "You" badges, inline delete for your own
  replies, per-comment Ghost/named toggle, read-more collapsing and `Ctrl/⌘ + Enter` submission.
* Post owners can pin their post to the top of the feed, delete it permanently (with a few seconds of Undo) or hide any
  other post from their own view.

## Technical SEO architecture

**On-page metadata** (`SEOHead.tsx`, per route, with the static copies in `index.html` as the no-JS fallback)

* Title: `WHAATEVER | The Ultimate Anonymous Posting & Confession Platform`
* Description: *"Welcome to WHAATEVER at WHAATEVER.VERCEL.APP — the ultimate anonymous posting platform for unfiltered
  rants, secrets, and thoughts. Post instantly with zero logins required."*
* Keywords: `WHAATEVER, WHAATEVER.VERCEL.APP, anonymous posting, confession platform, unfiltered thoughts, public rants,
  micro-blogging, anonymous text and image sharing`
* Canonical + `hreflang` for every route, robots directives, publisher/author/rating/revisit-after/theme-color meta.
* Full **Open Graph** (`og:title`, `og:description`, `og:image` 1200×630, `og:url` → `https://whaatever.vercel.app`,
  `og:type`, `og:locale`, `og:image:alt`) and **Twitter Card** markup (`summary_large_image`, site, creator, label/data).
* `article:*` tags are emitted for article-type routes.

**Structured data** (`src/lib/schema.ts`, injected as `application/ld+json`)

`Organization` · `WebSite` (+ `SearchAction`) · `WebApplication` · `CollectionPage` + `ItemList` of the live feed ·
`SocialMediaPosting` per confession (author, `datePublished`, `interactionStatistic`, nested `Comment`s) · `FAQPage` ·
`AboutPage` · `HowTo` (how to post anonymously in 30 seconds) · `BreadcrumbList`.

**Crawler files in `/public`**

* `robots.txt` — allow-all default, explicit welcomes for Googlebot/Bingbot/DuckDuckBot/Applebot, AI-crawler rules,
  `Disallow` for query-only permutations, and `Sitemap:` + `Host:` pointing at `https://whaatever.vercel.app`.
* `sitemap.xml` — all five routes with `lastmod`, `changefreq`, `priority`, `image:image` and `xhtml:link` alternates.
* `site.webmanifest`, `favicon.svg`, `apple-touch-icon.png` (512²), `og-image.png` (1200×630), `humans.txt`.

**Semantic HTML** — `<header>`, `<main>`, `<article>`, `<section>`, `<nav>`, `<aside>`, `<footer>`, `<time>`,
`<figure>/<figcaption>`, `<dl>` and `<table>` landmarks/structures, with `<h1>WHAATEVER</h1>` and
`<h2>Live Anonymous Feed & Confessions</h2>` heading hierarchy plus a skip-to-content link.

**Intent coverage** — dedicated FAQ accordions (mirrored as `FAQPage` schema) for *anonymous posting*, *confession
board*, *post anonymously online*, *zero logins*, *unfiltered thoughts and rants* and *anonymous image sharing*, plus an
internal link mesh across routes and categories.

## Project structure

```
WHAATEVER/
├── index.html                  # Static SEO payload, JSON-LD, <noscript> fallback, fonts
├── package.json                # Vite + React + Tailwind + lucide-react + clsx + tailwind-merge + helmet
├── vercel.json                 # SPA rewrites, asset cache + security headers
├── vite.config.ts              # CSR build, path aliases, chunking, dev/preview host config, vitest
├── tailwind.config.js          # Brutalist palette, shadow tokens, keyframes
├── postcss.config.js
├── tsconfig.json
├── public/
│   ├── robots.txt              # Crawler directives → sitemap
│   ├── sitemap.xml             # Route index for WHAATEVER.VERCEL.APP
│   ├── site.webmanifest
│   ├── favicon.svg
│   ├── apple-touch-icon.png    # 512×512
│   ├── og-image.png            # 1200×630 social card
│   └── humans.txt
└── src/
    ├── main.tsx                # Client entry — mounts the CSR app
    ├── App.tsx                 # Providers, router, scroll manager, shell, shortcut, sticky CTA
    ├── index.css               # Tailwind layers, brutalist utilities, palette variables
    ├── types.ts                # Domain types
    ├── components/
    │   ├── SEOHead.tsx         # Dynamic meta/OG/Twitter/JSON-LD manager
    │   ├── Navbar.tsx          # Branding, live stats, SEO badges, nav, Create Post CTA (+ StatsRow)
    │   ├── Feed.tsx            # Masonry stream, filter tabs, search, categories, toolbar
    │   ├── PostCard.tsx        # Brutalist post card, media, share, heat meter, actions
    │   ├── PostModal.tsx       # "The Vault" composer (identity switch + image upload)
    │   ├── CommentSection.tsx  # Expandable comment drawer
    │   ├── Toast.tsx           # Tactile notification + viewport stack
    │   ├── ConfirmDialog.tsx   # Destructive-action gate
    │   ├── Hero.tsx            # Homepage headline, live snapshot, feature grid
    │   ├── FaqSection.tsx      # Accordion consumed by the FAQPage schema
    │   ├── Footer.tsx          # Link mesh, stats, platform SEO copy
    │   ├── Avatar.tsx          # Deterministic ghost/monogram avatars
    │   ├── Ticker.tsx          # Marquee strip
    │   └── ErrorBoundary.tsx   # Brutalist crash card with local recovery
    ├── context/FeedContext.tsx # Reducer, persistence, actions, toasts, stats, filters
    ├── lib/
    │   ├── constants.ts        # SITE, LIMITS, categories, filters, nav, FAQ copy
    │   ├── seed.ts             # 13 keyword-optimised seed posts + generated SVG artwork
    │   ├── storage.ts          # localStorage layer (quota-aware, defensive)
    │   ├── image.ts            # Client-side image compression → base64
    │   ├── schema.ts           # JSON-LD builders
    │   ├── hooks.ts            # Focus trap, scroll lock, escape, copy, now-ticker, click-outside
    │   └── utils.ts            # cn(), time, counts, trending score, clipboard, export
    ├── pages/
    │   ├── Home.tsx            # "/" live feed + categories + FAQ + CTA
    │   ├── Trending.tsx        # "/trending" leaderboard + ranked feed
    │   ├── About.tsx           # "/about" what/how/stack/manifesto
    │   ├── Guidelines.tsx      # "/guidelines" house rules + local moderation
    │   ├── Privacy.tsx         # "/privacy" exact storage table + honest fine print
    │   └── NotFound.tsx        # noindex 404
    └── test/                   # Vitest + Testing Library smoke suite
```

## Getting started

```bash
npm install
npm run dev        # http://localhost:5173  (bound to 0.0.0.0, safe for proxied previews)
npm run build      # tsc --noEmit && vite build  →  dist/
npm run preview    # serve the production build on http://localhost:4173
npm run typecheck  # strict TypeScript only
npm run test       # vitest run
```

Requires Node 18+. The build performs a full type check first, so `npm run build` doubles as the CI gate.

## Deploying to Vercel

1. Import the repository into Vercel (Framework preset: **Vite** — detected automatically).
2. Build command `npm run build`, output directory `dist` (already declared in `vercel.json`).
3. Deploy. `vercel.json` handles the SPA rewrite, immutable long-cache for `/assets/*`, and
   `X-Content-Type-Options` / `X-Frame-Options` / `Referrer-Policy` / `Permissions-Policy` headers.

Nothing else is required — there are no environment variables, no API keys and no database to provision.

## Data model & localStorage keys

| Key | Contents |
| --- | --- |
| `whaatever:posts:v1` | Posts, upvotes, comments, view counts and base64 image payloads |
| `whaatever:identity:v1` | Ghost Mode flag + the optional stored name/pseudonym |
| `whaatever:draft:v1` | The in-progress post left in The Vault |
| `whaatever:visit:v1` | Local visit counter and first-seen timestamp |

Because the feed is local, **Export** (feed toolbar or footer) writes your entire feed to a JSON file and **Import**
merges one back in. Clearing browser data clears your posts — that is the explicit trade-off for having no backend.

## Testing

```bash
npm run test
```

`src/test/whaatever.test.tsx` covers the critical journeys in jsdom:

1. The SPA boots, seeds the feed, and injects the SEO head (title, description, canonical, `og:url`, JSON-LD).
2. A visitor publishes an anonymous post through The Vault — optimistic UI, success toast, persisted record with
   `author: null`.
3. Upvoting toggles `aria-pressed` and persists.
4. Comments are added inside the drawer and stored with their post.
5. The "Anonymous Only" tab filters the stream to ghost posts only.

## Accessibility & performance notes

* Focus trapping, focus restoration, `Escape` handling and body scroll locking on every overlay.
* `aria-pressed`, `aria-expanded`, `aria-selected`, `role="switch"`, `role="status"`, `role="alertdialog"`, visible focus
  rings (3px cobalt) and a skip-to-content link.
* All motion respects `prefers-reduced-motion`; the app is fully usable on mobile (sticky composer button, drawer nav,
  single-column masonry, `safe-area` padding).
* Code-split vendor chunks (react / helmet / icons), `cssCodeSplit: false` for a single stylesheet, lazy-loaded images
  with skeleton placeholders, and an in-browser image pipeline that keeps payloads small.

---

**WHAATEVER** — post it anonymously. [whaatever.vercel.app](https://whaatever.vercel.app)
