# WHAATEVER — Complete file manifest

Every file required to build and run WHAATEVER. No placeholders, no `// insert code here`.

## Root / configuration

| File | Purpose |
| --- | --- |
| `index.html` | CSR host document: hardcoded keyword-optimised `<title>`/description/keywords, Open Graph + Twitter Card tags (all `data-rh="true"` so Helmet adopts them), canonical, fonts, `WebSite`/`Organization`/`WebApplication` JSON-LD, and a full semantic `<noscript>` SEO fallback document. |
| `package.json` | Dependencies (`react`, `react-dom`, `react-router-dom`, `react-helmet-async`, `lucide-react`, `clsx`, `tailwind-merge`) plus dev tooling (`vite`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `jsdom`, Testing Library, `@vercel/routing-utils`) and scripts: `dev`, `build` (`vite build`, deploy-safe), `preview`, `typecheck`, `test`, `verify:deploy`, `verify`, `clean`. Declares `engines.node`. |
| `vite.config.ts` | CSR build config, `@/` path alias, vendor chunking, dev/preview host binding for proxied previews. Imports **only** from `vite` so the production build never needs test tooling (critical for Vercel). |
| `vitest.config.ts` | Test-only config (jsdom environment, setup file, `@/` alias) split out of `vite.config.ts` for exactly that reason. |
| `.nvmrc` | Pins Node 20 for the Vercel build image (Vite 5 needs 18.18+/20.9+). |
| `DEPLOY.md` | Vercel runbook: the production-branch gotcha, exact project settings, verification steps, and a symptom → cause → fix troubleshooting table. |
| `scripts/verify-deploy.mjs` | Deployment preflight (`npm run verify:deploy`): validates `vercel.json` with Vercel's own `@vercel/routing-utils`, simulates the filesystem→rewrite routing table against the real `dist/`, asserts every crawler/social asset and referenced bundle file exists, checks the prerendered SEO payload, and cross-checks `sitemap.xml`/`robots.txt` against the canonical domain. |
| `.github/workflows/ci.yml` | CI gate on every push/PR: `npm ci` → typecheck → tests → production build → deploy preflight. |
| `tailwind.config.js` | New Brutalist design tokens: cobalt/lemon/olive/beige/ink palettes, `border-3/4/5/6`, `shadow-brutal*` (including the spec'd `4px 4px 0 0 rgba(0,0,0,1)`), animations and keyframes. |
| `postcss.config.js` | Tailwind + autoprefixer pipeline. |
| `tsconfig.json` | Strict TypeScript (incl. `noUnusedLocals`), `jsx: react-jsx`, bundler resolution, `@/*` paths; includes `src`, `vite.config.ts` and `vitest.config.ts`. |
| `vercel.json` | Vercel deployment config using only canonical patterns: catch-all SPA rewrite to `/index.html` (filesystem is checked first, so assets still resolve), immutable `/assets/*` caching, correct `Content-Type` for `sitemap.xml` and `site.webmanifest`, and security headers. Validated by `npm run verify:deploy` with Vercel's own routing library. |
| `.gitignore` | Standard Node/Vite/Vercel ignores (keeps `dist` and `node_modules` out of Git). |
| `README.md` | Full documentation: architecture, design system, features, SEO, scripts, deploy steps, data model, tests. |
| `PROJECT_FILES.md` | This manifest. |

## `/public` — crawler + social assets

| File | Purpose |
| --- | --- |
| `robots.txt` | Crawler directives: allow-all default, explicit Googlebot/Bingbot/DuckDuckBot/Applebot/AI-crawler groups, query-permutation disallows, `Sitemap:` and `Host:` → `https://whaatever.vercel.app`. |
| `sitemap.xml` | All five routes with `lastmod`, `changefreq`, `priority`, `image:image` and `xhtml:link` alternates for `https://whaatever.vercel.app`. |
| `site.webmanifest` | PWA manifest (name, theme `#FACC15`, icons, shortcuts to the feed and trending). |
| `favicon.svg` | Brutalist ghost app icon. |
| `apple-touch-icon.png` | 512×512 maskable icon. |
| `og-image.png` | 1200×630 social share card. |
| `humans.txt` | Team/stack note. |

## `/src` — application

| File | Purpose |
| --- | --- |
| `main.tsx` | Client entry point; mounts the app into `#root` with `StrictMode`. |
| `App.tsx` | Provider tree (`HelmetProvider` → `BrowserRouter` → `FeedProvider`), `ScrollManager` for hash deep links, `Shell` (Navbar, routed `<main>`, Footer, `PostModal`, mobile sticky CTA, `n` keyboard shortcut, skip link). |
| `index.css` | Tailwind layers, CSS variable palette, brutalist component classes (`.brutal-card`, `.btn-*`, `.badge-*`, `.field`, `.push`, `.masonry`, `.skeleton`, `.hatch`, `.grid-paper`), reduced-motion overrides and chunky scrollbars. |
| `types.ts` | `Post`, `PostComment`, `MediaAttachment`, `Identity`, `FeedFilter`, `FeedStats`, `Category`, `PersistReport`. |
| `vite-env.d.ts` | Vite client types. |
| `components/SEOHead.tsx` | Dynamic head manager: title, description, keywords, canonical, robots, Open Graph, Twitter Card, `article:*` and JSON-LD injection per route. |
| `components/Navbar.tsx` | Bold WHAATEVER.VERCEL.APP branding, SEO badge rail, primary nav, live stats (posts / ghost % / upvotes / comments), Create Post CTA, brutalist mobile drawer, ticker — plus the exported `StatsRow`. |
| `components/Feed.tsx` | The live feed: filter tabs, category chips, debounced search, status rail, storage meter, export/import/reseed/reset/empty toolbar, masonry stream, pagination, empty states, confirm dialogs. |
| `components/PostCard.tsx` | Brutalist post card: category rail, avatars, ghost/named/your-post/pinned/trending badges, timestamps, expandable body, expandable media with skeleton, engagement heat meter, upvote/comment/share/permalink actions, owner pin+delete, hide control, IntersectionObserver view counts. |
| `components/PostModal.tsx` | "The Vault": identity switcher (Ghost Mode ↔ named), rich textarea with counter and prompt starters, drag/paste/file image zone with instant preview and compression readout, draft autosave, optimistic publish + toast with Undo, `Ctrl/⌘+Enter`. |
| `components/CommentSection.tsx` | Expandable comment drawer: threaded list, ghost/named comment toggle, per-comment upvotes, read-more, owner delete, composer. |
| `components/Toast.tsx` | Tactile notification component with variants (success/error/info/like/ghost), inline action button, timer rail, and the stacked `ToastViewport`. |
| `components/ConfirmDialog.tsx` | Focus-trapped destructive-action gate used for reset/empty operations. |
| `components/Hero.tsx` | Homepage `<h1>WHAATEVER</h1>`, positioning copy, CTAs, live trending snapshot aside and the six-card feature grid. |
| `components/FaqSection.tsx` | Accessible FAQ accordion mirroring the `FAQPage` structured data. |
| `components/Footer.tsx` | Semantic footer with route + category link mesh, platform actions, live local stats table and keyword-rich closing copy. |
| `components/Avatar.tsx` | Ghost glyph / deterministic colour-bucketed monogram avatars. |
| `components/Ticker.tsx` | Marquee strip with the platform value props. |
| `components/ErrorBoundary.tsx` | Brutalist crash card offering retry or local-feed reset. |
| `context/FeedContext.tsx` | The engagement engine: reducer for posts/comments/likes/views/pins/hides, debounced persistence with quota handling, notifications, derived stats, identity, visits, export/import, and the `applyFilter` selector. |
| `lib/constants.ts` | `SITE` (url, domain, description, keywords, twitter), `LIMITS`, `CATEGORIES` (7), `FILTERS` (All/Anonymous Only/Trending/Latest), `NAV_LINKS`, `COMPOSER_PROMPTS`, `FAQS`, ticker copy and SEO badges. |
| `lib/seed.ts` | 13 keyword-optimised seed posts with comments, relative timestamps, pinned post and procedurally generated brutalist SVG posters (stored as data URLs → zero network requests). |
| `lib/storage.ts` | Defensive localStorage layer: keys, validation/coercion, quota-aware `savePosts` with progressive image stripping, identity, drafts, visit stats, size estimation. |
| `lib/image.ts` | 100% client-side image pipeline: type/size validation, decode, downscale ≤1600px, JPEG re-encode, GIF passthrough, drag/paste file extraction. |
| `lib/schema.ts` | JSON-LD builders: `organizationNode`, `websiteNode`, `webApplicationNode`, `breadcrumbGraph`, `faqGraph`, `postNode`, `feedGraph`, `pageGraph`, `howToGraph`, `baseGraph`. |
| `lib/hooks.ts` | `useEscapeKey`, `useBodyScrollLock`, `useFocusTrap`, `useCopy`, `useNow`, `useMediaQuery`, `useOnClickOutside`, `useDebouncedValue`. |
| `lib/utils.ts` | `cn()` (clsx + tailwind-merge), `uid`, `timeAgo`, `formatDateTime`, `isoDate`, `formatCount`, `humanBytes`, `truncate`, `pluralize`, `bucketOf`, `initialsOf`, `countWords`, `trendingScore`, `heatPercent`, `copyToClipboard`, `downloadJson`, `slugify`. |
| `pages/Home.tsx` | `/` — hero, live feed, use-case grid, category grid, FAQ, closing CTA, and `WebSite`+`CollectionPage`+`FAQPage` JSON-LD. |
| `pages/Trending.tsx` | `/trending` — leaderboard with heat meters, ranked feed, "how trending works", `ItemList` + breadcrumb schema. |
| `pages/About.tsx` | `/about` — what WHAATEVER is, 5-step how-to-post guide, stack transparency, manifesto, `AboutPage` + `HowTo` + `FAQPage` schema. |
| `pages/Guidelines.tsx` | `/guidelines` — allowed vs removed content, local moderation model, rules FAQ. |
| `pages/Privacy.tsx` | `/privacy` — exact localStorage key table, never-collected list, honest hosting/fonts fine print, user controls. |
| `pages/NotFound.tsx` | noindex brutalist 404 with recovery links. |
| `test/setup.ts` | Vitest setup: jest-dom matchers, jsdom API stubs, cleanup + storage reset. |
| `test/whaatever.test.tsx` | Smoke suite: boot + SEO head + seed, anonymous publish, upvote persistence, comment persistence, Anonymous-Only filter. |

## Deployment

| File | Purpose |
| --- | --- |
| `DEPLOY.md` | Step-by-step Vercel setup. **Key point:** Vercel deploys the production branch (`main`), so PR #1 must be merged — or the Vercel Production Branch must be set to `arena/b38874bd-whaatever` — before the app is live. |
| `npm run verify:deploy` | Reproduces the deployment checks locally: Vercel routing validation, request simulation against `dist/`, crawler/social asset checks, SEO payload checks, sitemap/robots cross-check. Prints `✅ DEPLOY-READY — 64/64 checks passed` when the deployment will work. |

## Build output

`npm run build` → `dist/` containing `index.html`, `assets/*.css`, chunked `assets/*.js`,
and copied `public/` assets (`robots.txt`, `sitemap.xml`, `og-image.png`, icons, manifest) — deployable to Vercel with
zero configuration.
