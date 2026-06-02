/**
 * Single source of truth for site-wide identity. Used by usePageMeta (canonical
 * + OG), the Navbar/Footer, and JSON-LD. Update the origin here when the final
 * Cloudflare Pages domain is wired up.
 *
 * NOTE: scripts/prerender.mjs is a plain Node script and can't import this TS
 * module, so it hardcodes SITE_NAME for og:site_name — keep them in sync.
 */
export const SITE_NAME = 'Free Pool Tools';
export const SITE_ORIGIN = 'https://freepooltools.com';
export const SITE_TAGLINE =
  'Free pool calculators for homeowners and pool pros — volume, chemistry, and more.';
