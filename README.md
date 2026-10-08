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
8. [Deploying to Vercel](#deploying-to-vercel) — **see also [DEPLOY.md](./DEPLOY.md)**
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
* **Deep links work — twice over.** `scripts/prerender-routes.mjs` emits a real HTML file per sitemap route
  (`dist/trending.html`, `dist/about.html`, …) served via `cleanUrls`, and a catch-all SPA rewrite in `vercel.json`
  covers everything else. `/trending`, `/about`, `/guidelines`, `/privacy` and `/#post-<id>` all survive a hard refresh.
* **Prerendered route files are also better SEO:** each route is a real, independently indexable URL rather than a
  rewrite into a single document.
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
├── vitest.config.ts            # Test config kept apart from the production build
├── .nvmrc                      # Node 20 — pins the Vercel build image
├── DEPLOY.md                   # Vercel runbook + error troubleshooting table
├── scripts/
│   └── verify-deploy.mjs       # Vercel config validation + dist/routing simulation
├── .github/workflows/ci.yml    # Typecheck → test → build → deploy preflight
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
npm run dev            # http://localhost:5173  (bound to 0.0.0.0, safe for proxied previews)
npm run build          # vite build  →  dist/   (deploy-safe: no test/type tooling required)
npm run preview        # serve the production build on http://localhost:4173
npm run typecheck      # tsc --noEmit
npm run test           # vitest run
npm run verify:deploy  # Vercel config validation + dist/ routing simulation (64 checks)
npm run verify         # typecheck → test → build → verify:deploy   (the full gate)
```

Requires Node 18.18+/20.9+ (pinned to Node 20 by `.nvmrc`).

> **Why `build` is only `vite build`:** so a Vercel build can never fail because a dev-only tool is unavailable.
> Type checking and tests still gate every change — they run in `npm run verify` locally and in
> `.github/workflows/ci.yml` on every push and pull request.

## Deploying to Vercel

> **Read [DEPLOY.md](./DEPLOY.md) for the full runbook and a Vercel error-message troubleshooting table.**

### The one thing that breaks a first deploy

Vercel deploys the repository's **production branch** (`main` by default). This application lives on
`arena/b38874bd-whaatever` and reaches `main` through **[PR #1](https://github.com/vamshicodingmt-gif/WHAATEVER/pull/1)**.
If Vercel was connected while `main` still held only a `README.md`, the build had no `package.json`, no Vite app and no
output directory — which surfaces as:

```
Error: No Output Directory named "public" found after the Build completed.
```

Fix it either way:

| Option | Action |
| --- | --- |
| **A** | **Merge PR #1** into `main`. Vercel redeploys `main` automatically. |
| **B** | Vercel → **Settings → Git → Production Branch** → `arena/b38874bd-whaatever` → **Save** → **Redeploy**. |

### Project settings

| Setting | Value |
| --- | --- |
| Framework Preset | **Vite** (auto-detected; also declared in `vercel.json`) |
| Root Directory | `.` |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Node.js Version | 20.x (via `.nvmrc`) |
| Deployment Protection | **off** for the production domain |

All of the above is committed in `vercel.json`, so a clean import needs no manual configuration:

* **SPA rewrite** — `{"source": "/(.*)", "destination": "/index.html"}`. Vercel checks the filesystem first, so
  `/assets/*`, `/robots.txt`, `/sitemap.xml` and `/og-image.png` are served directly while `/trending`, `/about`,
  `/guidelines`, `/privacy` and `/#post-<id>` fall through to the app shell instead of 404-ing.
* **Caching + MIME headers** — immutable `/assets/*`, correct types for `sitemap.xml` and `site.webmanifest`.
* **Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`.

### Deployment hardening applied

| Risk | Mitigation |
| --- | --- |
| Build failing on a missing dev-only tool | `build` = `vite build`; `vite.config.ts` imports only from `vite`; vitest config lives in `vitest.config.ts` |
| Invalid routing config rejected at deploy time | `vercel.json` uses only canonical patterns and is validated by `npm run verify:deploy` using **Vercel's own** `@vercel/routing-utils` |
| Deep links 404-ing on refresh | Prerendered static route files (`trending.html`, `about.html`, …) **plus** a catch-all rewrite fallback, both verified against the real `dist/` |
| Hosting-level rewrite silently not applied | Removed as a single point of failure: every indexable route is a real file, so the site works even if rewrites are ignored |
| Missing crawler/social assets in production | `verify:deploy` asserts every required file exists in `dist/` and every asset referenced by `index.html` resolves |
| Node version drift on the build image | `.nvmrc` (Node 20) + `engines` in `package.json` |
| Regressions reaching production | `.github/workflows/ci.yml` runs typecheck → tests → build → deploy preflight on every push and PR |

For hosts other than Vercel, drag `dist/` anywhere that serves root-relative files **and** rewrites unknown paths to
`/index.html` (Netlify: `/*  /index.html  200`).

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
