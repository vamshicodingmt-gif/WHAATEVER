# Deploying WHAATEVER to Vercel

WHAATEVER is a 100% static, client-side rendered SPA. Deploying it needs **no environment variables, no database and
no build secrets** — but it does need the app code on the branch Vercel deploys.

---

## ⚠️ Read this first: the number one reason a deploy "doesn't work"

**Vercel deploys your repository's _production branch_ — `main` by default.**

The WHAATEVER application lives on the branch `arena/b38874bd-whaatever`, which is **not merged into `main` yet**
(`main` currently contains only a `README.md`). If you connected Vercel to this repository while `main` was still empty,
Vercel built an empty repository, found no `package.json`, no Vite app and no `dist/` output, and the deploy failed or
served nothing — typically with:

```
Error: No Output Directory named "public" found after the Build completed.
```

### Fix it in one step (either option works)

| Option | What to do |
| --- | --- |
| **A — merge the app into `main`** (recommended) | Merge **[PR #1](https://github.com/vamshicodingmt-gif/WHAATEVER/pull/1)** (`arena/b38874bd-whaatever` → `main`). Vercel redeploys `main` automatically. |
| **B — point Vercel at the branch** | Vercel → your project → **Settings → Git → Production Branch** → set it to `arena/b38874bd-whaatever` → **Save**, then **Deployments → ⋯ → Redeploy**. |

Either way the deployment then builds this app: `npm install` → `npm run build` → publish `dist/`.

---

## Project settings (make Vercel match these)

**Settings → General**

| Setting | Value |
| --- | --- |
| Framework Preset | **Vite** (auto-detected; `vercel.json` also declares `"framework": "vite"`) |
| Root Directory | **`.`** (repository root — do **not** point it at `src/`) |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | **20.x** (pinned by `.nvmrc`; Vite 5 supports 18.18+, 20.9+ and 21.1+) |

**Settings → Git**

| Setting | Value |
| --- | --- |
| Production Branch | `main` **after merging PR #1**, or `arena/b38874bd-whaatever` if you prefer not to merge |
| Ignored Build Step | Leave default (do **not** set `exit 0`) |

**Settings → Deployment Protection** — turn **off** "Vercel Authentication" / password protection for the production
domain, otherwise visitors (and Googlebot) get a login wall instead of the anonymous feed.

Everything above is also declared in [`vercel.json`](./vercel.json), so with a clean import you should not have to touch
a single field — Vercel reads the file on every deploy.

---

## What `vercel.json` does

```jsonc
{
  "framework": "vite",
  "installCommand": "npm install",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "trailingSlash": false,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }   // SPA fallback: /trending, /about … never 404
  ],
  "headers": [ /* immutable asset caching, correct MIME types, security headers */ ]
}
```

**Two layers of protection for deep links:**

1. **Prerendered route files (primary).** `scripts/prerender-routes.mjs` runs as part of `npm run build` and writes a real
   HTML file for every route listed in `public/sitemap.xml` — `dist/trending.html`, `dist/about.html`,
   `dist/guidelines.html`, `dist/privacy.html`. With `cleanUrls: true`, Vercel serves `/trending` directly from
   `trending.html` as a plain static file, so deep links work **without depending on any rewrite**. This is also better
   for crawlers: each route is a real, indexable URL.
2. **Catch-all SPA rewrite (fallback).** `{ "source": "/(.*)", "destination": "/index.html" }` covers anything else, so
   unknown paths render the app (which shows the 404 route) instead of a hosting error page.

Vercel checks the filesystem **first**, so real files (`/assets/*.js`, `/robots.txt`, `/sitemap.xml`, `/og-image.png`, …)
are always served directly.

---

## Verify before you deploy (recommended)

```bash
npm ci                 # exact dependency install Vercel performs
npm run verify         # typecheck → tests → build → deploy preflight
```

`npm run verify:deploy` re-runs the deployment checks locally:

* validates `vercel.json` with **Vercel's own routing library** (`@vercel/routing-utils`) — the same code the deploy
  pipeline executes, so an invalid rewrite/header source fails here instead of in production;
* simulates the filesystem → rewrite routing table against the real `dist/` output for `/`, `/trending`, `/about`,
  `/guidelines`, `/privacy` and every emitted asset;
* asserts `dist/` contains `index.html`, `robots.txt`, `sitemap.xml`, `site.webmanifest`, `favicon.svg`,
  `og-image.png`, `apple-touch-icon.png`;
* asserts the prerendered SEO payload inside `index.html` (title, description, keywords, canonical, Open Graph, Twitter
  card, JSON-LD, `<noscript>` fallback) and that every asset it references exists;
* cross-checks `sitemap.xml` and `robots.txt` against the canonical `https://whaatever.vercel.app` origin.

A clean run prints `✅ DEPLOY-READY — 64/64 checks passed`.

---

## Troubleshooting

| Symptom in Vercel | Cause | Fix |
| --- | --- | --- |
| `No Output Directory named "public" found after the Build completed` | Vercel deployed a branch without the app (usually `main` = README only) | Merge PR #1, or set **Production Branch** to `arena/b38874bd-whaatever` |
| `404: NOT_FOUND` on `/` and everything else | No output, or `outputDirectory` not set to `dist` | Confirm Build Command `npm run build`, Output Directory `dist`, Root Directory `.` |
| Site loads at `/` but **404s at `/trending`**, while `/robots.txt` and `/sitemap.xml` still work | The hosting-level SPA rewrite is not being applied to this deployment | Already handled — deep links no longer depend on the rewrite. `scripts/prerender-routes.mjs` ships real `trending.html` / `about.html` / `guidelines.html` / `privacy.html` files, served via `cleanUrls`. Confirm `npm run build` logs `✔ prerender-routes: 4 static route file(s) written` |
| A page 404s that definitely exists | Stale edge cache from an earlier (empty) deployment | Add `?cb=1` to confirm; it clears on the next deployment, or force it via **Deployments → Redeploy** |
| Build log: `Cannot find module 'vitest/config'` | Build-time import of test tooling with dev dependencies unavailable | Already fixed — `vite.config.ts` imports only from `vite`, and `vitest.config.ts` is separate |
| Build log: `sh: tsc: command not found` | Type checking was part of the build command | Already fixed — `build` is just `vite build`; type checking runs in `npm run typecheck` and in CI |
| Build log: `npm ERR! code ERESOLVE` | Peer-dependency conflict | `package-lock.json` is committed and in sync — use `npm ci` locally to confirm |
| Deployment succeeds, page is pure white | A client-side runtime error | Open the browser console. The app ships an error boundary; `npm run test` covers the render path |
| Vercel login wall instead of the feed | Deployment Protection / Vercel Authentication enabled | **Settings → Deployment Protection** → disable for production |
| Preview URL works, production domain does not | Custom domain/DNS not verified | **Settings → Domains** → follow Vercel's DNS instructions |
| `Invalid vercel.json` | Malformed config | Run `npm run verify:deploy` — it validates the file with Vercel's own parser |

---

## Manual deployment (no Git integration)

```bash
npm ci
npm run build
npx vercel deploy --prebuilt --prod      # or: npx vercel --prod
```

Or drag the `dist/` folder into any static host / CDN (Netlify, Cloudflare Pages, GitHub Pages, S3 + CloudFront). Only
two rules matter for a non-Vercel host: **root-relative asset serving** (the default Vite `base: '/'`) and a
**SPA fallback to `/index.html`** for unmatched routes (for Netlify add `public/_redirects` with `/*  /index.html  200`).

---

## After a successful deploy, confirm these URLs

| URL | Expected |
| --- | --- |
| `https://whaatever.vercel.app/` | The live anonymous feed with the WHAATEVER hero |
| `https://whaatever.vercel.app/trending` | The trending leaderboard (proves the SPA rewrite works) |
| `https://whaatever.vercel.app/robots.txt` | Crawler rules ending with `Sitemap: https://whaatever.vercel.app/sitemap.xml` |
| `https://whaatever.vercel.app/sitemap.xml` | Five `<url>` entries on the canonical domain |
| `https://whaatever.vercel.app/og-image.png` | The 1200×630 brutalist social card |

Then submit the sitemap in [Google Search Console](https://search.google.com/search-console) and
[Bing Webmaster Tools](https://www.bing.com/webmasters).
