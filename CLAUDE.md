# Free Pool Tools — Project Brief & SEO Playbook

> Reference doc for building and auditing a national-ranking free pool-tools website.
> Created 2026-06-01. Source: competitive/SEO research on dominant free-tool sites.

## 1. Project Goal

Build a website that ranks nationally for **pool tools** — free calculators for
homeowners and pool techs (chlorine dosing, CYA, pool volume, water balance, etc.).
Monetize primarily through **display ads driven by organic search traffic**, with
affiliate (chemicals, test kits, equipment) as a secondary layer.

**The opportunity:** The pool niche is dominated by *one* community site
(TroubleFreePool/PoolMath) plus a scatter of thin single-tool sites. No one has built
the "Omni Calculator / Calculator.net of pools" — a fast, comprehensive, well-explained,
mobile-first hub of free pool tools. **That gap is our target.**

## 2. Competitive Landscape

### General-purpose calculator giants (the model to emulate)
| Site | Scale | What makes them win |
|------|-------|---------------------|
| Calculator.net | ~70M visits/mo, DR 84, **1.5M backlinks**, ~30K ref domains | Fast, stripped-down, single-purpose pages |
| OmniCalculator | ~16M visits/mo, 7M+ organic, **3,700+ calculators** | Volume of tools + explanatory content under each |
| InchCalculator | 4.5M organic | Niche (construction/DIY) + iOS app distribution |

### Niche single-tool winners (proof small + focused works)
- **TDEECalculator.net** — ~1M organic from essentially *one page*. A tight, focused tool can dominate a query.
- **TireSize.com** — 100K visits; affiliate to retailers (high purchase intent).
- **SnowDayCalculator / AirFryerCalculator** — seasonal/viral single tools; ad-monetized (Ezoic, Raptive).
- **MortgageCalculator.org** — 12K+ backlinks incl. NYT; affiliate model.

### Direct pool competitors
- **TroubleFreePool.com (PoolMath)** — the gorilla. ~676K indexed pages, huge **forum** + "Pool School" educational hub + free app ($7.99/yr sub). Authority comes from a massive *community* generating content + links, not just calculators.
- **poolcalculator.com, poolchemicalcalculator.com, testyourownpool.com, hasa.com, poolchecker.com** — smaller, tool-focused, some with apps. Thin on content/community = beatable.

## 3. The Ranking Playbook (what all winners do)

1. **Tool above the fold, instant value.** Calculator loads at top; answers the query
   in the first second. Built around *user action*, not word count. Fast load,
   mobile-touch-optimized inputs, lazy-loaded JS.
2. **One page = one keyword intent.** Each tool targets a specific query ("pool volume
   calculator", "how much chlorine to add", "CYA calculator"). One strong page per
   intent, interlinked. (How TDEE got 1M visits from one page; how Omni ranks for tens
   of thousands of keywords.)
3. **Substantial supporting content under the tool.** The #1 mistake losers make is
   tool-only pages. Winners add: what the tool does & why, step-by-step "how to use,"
   real examples with sample numbers, and an **FAQ**. Google needs this to understand
   the page.
4. **Structured data (schema).** `WebApplication` on the tool, `HowTo` for instructions,
   `FAQPage` for the Q&A. Earns rich results and clarifies purpose.
5. **E-E-A-T + uniqueness at scale.** If pages are generated programmatically, the 2026
   bar is **25–30% unique content per page** (unique examples, data, expert input) plus
   a visible human/expertise signal. Pool chemistry is **YMYL-adjacent** (people dose
   chemicals from our output) → Google demands demonstrated expertise + accuracy.
6. **Backlinks are the moat.** The gap between Calculator.net (1.5M links) and a new
   site is mostly link authority. Earn links via genuinely useful, embeddable,
   shareable tools + citations from publications/forums. TFP's moat = its community.
7. **Distribution beyond the web.** Nearly all leaders pair the site with a **free
   mobile app** + active communities (subreddit, FB group) for repeat traffic and brand
   searches (direct traffic ~29% for Omni).
8. **Monetization = ad networks at scale.** Rank → volume → ad networks, tiered by
   traffic: **Ezoic** (low entry) → **Mediavine/Raptive** (~10K–50K sessions, much
   higher RPM). Affiliate (chemicals, test kits, equipment) layers on high-intent pages.

## 4. Implications for Our Build

**Winning formula:**
- A **suite of distinct tool pages**, one per intent: volume, chlorine dose, CYA,
  FC/CYA ratio, salt, LSI/water balance, acid demand, CYA reduction, heater run-time, etc.
- **Per-page template:** tool on top → how-to → worked examples → FAQ → schema.
- **Establish expertise/accuracy:** cite chemistry sources, show formulas, an "about our
  methodology" page (critical because dosing advice is health-adjacent).
- **Plan from day one** for link-earning + a community/app angle — that's the moat TFP
  has and the thin sites lack.

### Build/audit checklist (use when reviewing any page)
- [ ] Tool renders above the fold, usable in <1s
- [ ] Page targets exactly one search intent (title, H1, URL, meta all aligned)
- [ ] Supporting content present: intro, how-to, examples, FAQ
- [ ] Schema: WebApplication + HowTo + FAQPage
- [ ] Core Web Vitals pass; mobile-touch inputs optimized
- [ ] Formula/source cited (accuracy + E-E-A-T)
- [ ] Internal links to related pool tools
- [ ] Unique content if templated (≥25–30%)

## 5. Tech Considerations (TBD)

For programmatic-SEO tool sites, the build matters for ranking: favor static/SSG or
Next.js for speed + Core Web Vitals, server-rendered HTML for crawlability, JSON-LD
schema, and an embeddable widget version of tools (link-earning). **Stack not yet
chosen** — decide before scaffolding. (Repo is currently a blank slate.)

## 6. Open Next Steps

1. **Keyword/tool universe map** — research actual pool-tool search terms + volumes to
   prioritize which pages to build first.
2. **Competitor teardown** — reverse-engineer page structure of poolcalculator.com / TFP.
3. **Tech stack decision** — pick framework, then scaffold.

## 7. Key Sources
- [Wisp CMS — Ranking Calculator Tools](https://www.wisp.blog/blog/the-ultimate-guide-to-ranking-calculator-tools-seo-strategies-that-actually-work)
- [Creative Widgets — 10 Calculator Sites Dominating SEO](https://creativewidgets.io/blog/calculator-websites-seo)
- [Backlinko — Programmatic SEO](https://backlinko.com/programmatic-seo)
- [Memorable.design — Programmatic SEO 2026](https://memorable.design/programmatic-seo-2026/)
- Traffic/backlink data: SEMrush & Ahrefs profiles for calculator.net, omnicalculator.com
- Pool competitors: troublefreepool.com, poolcalculator.com, swimuniversity.com tool roundups

---

# Codebase (the actual build)

## Stack & why
Vite 6 + React 19 + TypeScript + react-router-dom 7 + Tailwind v4, with a
**static prerender** pipeline. Stack + the SSR/prerender infra and the first
calculator were adapted from the proven Suncoast Pool Pros site (see memory
[[suncoast-folder-readonly]] — that folder is **read-only; copy from it, never
modify it**). Chosen because the project's whole point is SEO: prerendering
gives every route real HTML (instant LCP, fully crawlable) while React still
hydrates for interactivity. Targets **Cloudflare Pages** (static `dist/`, no
Workers needed for v1). See `DEPLOY.md`.

## Build pipeline (`npm run build`)
1. `build:client` → Vite browser bundle into `dist/`.
2. `build:ssr` → bundles `src/entry-server.tsx` into `dist-ssr/`.
3. `prerender` (`scripts/prerender.mjs`) → renders each route in
   `PRERENDER_ROUTES` to `dist/<route>/index.html`, **inlines CSS**, injects
   per-page `<title>`/description/canonical/OG, writes `dist/404.html`, and
   generates `sitemap.xml` + `robots.txt`.

`npm run dev` = Vite dev server. `npm run lint` = `tsc --noEmit`.

## Project map
- `src/lib/site.ts` — site identity (`SITE_NAME`, `SITE_ORIGIN`). **Update the
  origin here AND in `scripts/prerender.mjs`** (the Node script can't import TS).
- `src/lib/usePageMeta.ts` + `src/lib/serverMeta.ts` — per-page SEO meta. Sets
  title/description/canonical/OG into the **prerendered HTML** (runs during SSR)
  and updates the live DOM head on client nav. Call it once per page.
- `src/data/tools.ts` — **central tool registry**. Source of truth for the
  homepage grid, footer, related-tool cross-links, and which tools are `live`.
  Add a tool here → build its page + route → flip `status` to `'live'`.
- `src/components/PageShell.tsx` — standard page frame (mesh bg + Navbar +
  Footer). New pages wrap in this.
- `src/components/RelatedTools.tsx` — internal-linking cross-link grid for the
  bottom of each tool page (replaces lead-gen CTAs; the site monetizes
  pageviews via ads, not leads).
- `src/pages/` — `HomePage` (tools hub), `AboutPage` (methodology/E-E-A-T),
  `PoolVolumeCalculatorPage` (ported), `NotFoundPage`.
- Routes live in **both** `src/App.tsx` (client, lazy) and
  `src/entry-server.tsx` (SSR, eager + `PRERENDER_ROUTES`). Keep them in sync.

## ⭐ The shareable-URL pattern (site-wide standard)
Every tool's inputs serialize to the URL so results are shareable — this is a
first-class pattern, not a one-off. Files: `src/lib/useShareableState.ts` +
`src/components/ShareButton.tsx`.

**How to use it in a new tool:**
```ts
type State = { shape: 'rect' | 'round'; length: string; metric: boolean };
const SCHEMA = {                       // define at MODULE level (stable identity)
  shape:  { param: 'shape', ...codecs.oneOf(['rect','round'] as const) },
  length: { param: 'l',     ...codecs.numStr() },   // numeric value held as string
  metric: { param: 'm',     ...codecs.bool() },
} satisfies ShareSchema<State>;

const { state, set, shareUrl } = useShareableState<State>(
  { shape: 'rect', length: '', metric: false }, SCHEMA,
);
// ...inputs call set('length', e.target.value)...
<ShareButton url={shareUrl} />         // copies link / opens native share sheet
```
The hook hydrates state from the URL on mount (shared links restore exactly),
builds `shareUrl` reactively, and mirrors state into the address bar via
`history.replaceState` (so reload + copy-from-bar work). SSR-safe. Codecs:
`str` / `num` / `numStr` / `bool` / `oneOf` / `json`.

> Note: the **Pool Volume Calculator keeps its original hand-rolled
> serialization** (it predates the hook and works); its copy button was swapped
> to the shared `<ShareButton>` so the UX is consistent. **All NEW tools must
> use `useShareableState`.**

## Per-tool page checklist (matches the SEO playbook above)
- [ ] Calculator above the fold; usable instantly
- [ ] One page = one search intent (title/H1/URL/meta aligned)
- [ ] Supporting content: intro, how-to/measure tips, worked examples, **FAQ**
- [ ] `useShareableState` + `<ShareButton>` for shareable results
- [ ] HowTo + FAQPage JSON-LD (FAQ array is the single source for both)
- [ ] `<RelatedTools>` cross-links at the bottom
- [ ] Add to `src/data/tools.ts`, `App.tsx`, `entry-server.tsx` (`PRERENDER_ROUTES`)
- [ ] Cite formula/sources (accuracy + E-E-A-T — chemistry is health-adjacent)

## Known follow-ups / tech debt
- **JSON-LD is injected client-side** (HowTo/FAQPage via `useEffect`), so it's
  not in the static HTML (Google executes JS, so it still counts, but
  server-rendering it would be stronger). Carried over from the source site.
- `og-default.png` (1200×630) referenced by default OG but **not yet created**.
- `SITE_ORIGIN` is a placeholder (`https://freepooltools.com`) in two places.
- The 5 `status:'soon'` tools in the registry are stubs — no pages yet.
