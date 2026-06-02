# Deploying to Cloudflare Pages

This is a prerendered (static) Vite + React site. The build produces a fully
static `dist/` — every route is real HTML — so Cloudflare Pages just serves
files. No Workers/Functions required for v1.

## Cloudflare Pages project settings

| Setting | Value |
| --- | --- |
| Framework preset | None / Vite |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 (set by `.node-version`, or add `NODE_VERSION=20` env var) |

## What `npm run build` does

1. `build:client` — Vite builds the browser bundle into `dist/`.
2. `build:ssr` — Vite bundles `src/entry-server.tsx` into `dist-ssr/`.
3. `prerender` — `scripts/prerender.mjs` renders each route in
   `PRERENDER_ROUTES` to `dist/<route>/index.html`, inlines the CSS, injects
   per-page meta/OG, writes `dist/404.html`, and generates `sitemap.xml` +
   `robots.txt`.

## Routing / 404s

- Clean URLs work natively (Pages serves `/tools/pool-volume-calculator/index.html`).
- Unmatched paths get `dist/404.html` with a real 404 status (no SPA catch-all
  rewrite, so genuine 404s stay 404s — better for SEO).

## Before going live

- Set the real domain in `src/lib/site.ts` (`SITE_ORIGIN`) **and** the matching
  constant in `scripts/prerender.mjs` (they're kept in sync by hand).
- Add a real `public/og-default.png` (1200×630) for social link previews.
