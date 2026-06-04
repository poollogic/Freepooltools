// Post-build prerender. Runs after `vite build` (client) and
// `vite build --ssr src/entry-server.tsx` (server). For each route in
// PRERENDER_ROUTES it calls render(url) to get the rendered HTML body + per-page
// meta, injects both into the static HTML template Vite produced, and writes
// dist/<route>/index.html. Also emits sitemap.xml + robots.txt.
//
// End state: a real static site — visiting /pool-volume-calculator fetches
// fully-rendered HTML with content already in it. React hydrates after the JS
// loads so interactivity works, but first paint is instant (great for SEO/LCP).

import { promises as fs } from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

// Keep in sync with src/lib/site.ts (this Node script can't import the TS module).
const SITE_NAME = 'Free Pool Tools';
const SITE_ORIGIN = 'https://freepooltools.com';

const ROOT = path.resolve(process.argv[1], '..', '..');
const CLIENT_DIST = path.join(ROOT, 'dist');
const SERVER_DIST = path.join(ROOT, 'dist-ssr');
const SERVER_ENTRY = path.join(SERVER_DIST, 'entry-server.js');
const TEMPLATE = path.join(CLIENT_DIST, 'index.html');

const escapeHtml = (s) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

/** Replace or insert per-page meta tags into the HTML head. */
function injectHead(html, meta) {
  let out = html;
  const replacements = [];

  if (meta.title) {
    out = out.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`);
  }
  if (meta.description) {
    out = out.replace(
      /<meta name="description"[^>]*\/?>/,
      `<meta name="description" content="${escapeHtml(meta.description)}" />`,
    );
  }
  if (meta.canonicalUrl) {
    out = out.replace(
      /<link rel="canonical"[^>]*\/?>/,
      `<link rel="canonical" href="${escapeHtml(meta.canonicalUrl)}" />`,
    );
  }

  // Robots noindex for opt-in pages (utility/404). Indexable pages get no robots
  // tag (default = index,follow).
  if (meta.noindex) {
    out = out.replace('</head>', `  <meta name="robots" content="noindex,follow" />\n  </head>`);
  }

  // Per-page font preload — swap the template's default set for the weights this
  // route actually paints above the fold.
  if (meta.fontPreload && meta.fontPreload.length) {
    out = out.replace(/\s*<link rel="preload" as="font"[^>]*\/?>/g, '');
    const fontPreloads = meta.fontPreload.map((f) => {
      const href = typeof f === 'string' ? f : f.href;
      const media = typeof f === 'string' ? '' : ` media="${escapeHtml(f.media)}"`;
      return `<link rel="preload" as="font" type="font/woff2" href="${escapeHtml(href)}" crossorigin${media} />`;
    });
    out = out.replace('</head>', `  ${fontPreloads.join('\n    ')}\n  </head>`);
  }

  // OG + Twitter tags — appended inside <head> right before </head>.
  if (meta.title) replacements.push(`<meta property="og:title" content="${escapeHtml(meta.title)}" />`);
  if (meta.description) replacements.push(`<meta property="og:description" content="${escapeHtml(meta.description)}" />`);
  if (meta.canonicalUrl) replacements.push(`<meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />`);
  replacements.push(`<meta property="og:type" content="website" />`);
  replacements.push(`<meta property="og:site_name" content="${SITE_NAME}" />`);
  if (meta.ogImage) replacements.push(`<meta property="og:image" content="${escapeHtml(meta.ogImage)}" />`);
  replacements.push(`<meta name="twitter:card" content="summary_large_image" />`);
  if (meta.title) replacements.push(`<meta name="twitter:title" content="${escapeHtml(meta.title)}" />`);
  if (meta.description) replacements.push(`<meta name="twitter:description" content="${escapeHtml(meta.description)}" />`);
  if (meta.ogImage) replacements.push(`<meta name="twitter:image" content="${escapeHtml(meta.ogImage)}" />`);

  out = out.replace('</head>', `  ${replacements.join('\n    ')}\n  </head>`);

  // JSON-LD blocks (HowTo / FAQPage / BreadcrumbList / ItemList). Escape "<" so
  // content can't break out of the <script> tag.
  if (meta.jsonLd && meta.jsonLd.length) {
    const blocks = meta.jsonLd
      .map((j) => `<script type="application/ld+json">${j.replace(/</g, '\\u003c')}</script>`)
      .join('\n    ');
    out = out.replace('</head>', `  ${blocks}\n  </head>`);
  }

  return out;
}

function injectBody(html, body) {
  return html.replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

/**
 * Inline the build CSS into a <style> in <head> and drop the render-blocking
 * <link>, so first paint never waits on a stylesheet request. A <noscript>
 * <link> covers the JS-off case.
 */
function inlineCss(html, cssHref, cssText) {
  const linkRe = new RegExp(
    `<link rel="stylesheet"[^>]*href="${cssHref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^>]*>`,
  );
  if (!linkRe.test(html)) return html;
  const replacement =
    `<style>${cssText}</style>\n    ` +
    `<noscript><link rel="stylesheet" crossorigin href="${cssHref}" /></noscript>`;
  return html.replace(linkRe, replacement);
}

async function writeSitemap(routes) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = routes
    .map((r) => {
      const loc = `${SITE_ORIGIN}${r === '/' ? '/' : `${r}/`}`;
      const priority = r === '/' ? '1.0' : '0.8';
      return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;
    })
    .join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
  await fs.writeFile(path.join(CLIENT_DIST, 'sitemap.xml'), xml);

  const robots = `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`;
  await fs.writeFile(path.join(CLIENT_DIST, 'robots.txt'), robots);
  console.log(`✓ sitemap.xml (${routes.length} urls) + robots.txt`);
}

async function run() {
  const template = await fs.readFile(TEMPLATE, 'utf8');
  const { render, PRERENDER_ROUTES, NOT_FOUND_PATH } = await import(pathToFileURL(SERVER_ENTRY).href);

  const cssHref = (template.match(/<link rel="stylesheet"[^>]*href="([^"]+)"/) || [])[1];
  let cssText = '';
  if (cssHref) {
    cssText = await fs.readFile(path.join(CLIENT_DIST, cssHref.replace(/^\//, '')), 'utf8');
  } else {
    console.warn('⚠ No stylesheet <link> found in template — skipping CSS inline.');
  }

  let count = 0;
  for (const route of PRERENDER_ROUTES) {
    let body, meta;
    try {
      const out = render(route);
      body = out.html;
      meta = out.meta;
    } catch (err) {
      console.error(`✗ ${route} — render failed:`, err.message);
      continue;
    }

    let html = template;
    html = injectHead(html, meta);
    html = injectBody(html, body);
    if (cssText) html = inlineCss(html, cssHref, cssText);

    const outDir = route === '/' ? CLIENT_DIST : path.join(CLIENT_DIST, route.replace(/^\//, ''));
    const outFile = path.join(outDir, 'index.html');
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outFile, html);
    count++;
    console.log(`✓ ${route} → ${path.relative(ROOT, outFile)} (${html.length} bytes)`);
  }

  // 404 page → dist/404.html (Cloudflare Pages serves it for unmatched paths).
  try {
    const nf = render(NOT_FOUND_PATH);
    let nfHtml = template;
    nfHtml = injectHead(nfHtml, nf.meta);
    nfHtml = injectBody(nfHtml, nf.html);
    if (cssText) nfHtml = inlineCss(nfHtml, cssHref, cssText);
    await fs.writeFile(path.join(CLIENT_DIST, '404.html'), nfHtml);
    console.log('✓ 404 → dist/404.html');
  } catch (err) {
    console.error('✗ 404 render failed:', err.message);
  }

  // Embeds are prerendered (so the widget has static HTML) but kept out of the
  // sitemap — they're noindex and would just be duplicate-content noise.
  await writeSitemap(PRERENDER_ROUTES.filter((r) => !r.startsWith('/embed')));
  console.log(`\nPrerendered ${count}/${PRERENDER_ROUTES.length} routes.`);
}

run().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
