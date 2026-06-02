// Mutable singleton populated during server-side render. The prerender script
// reads it after renderToString to know what <title>, description, canonical,
// and OG tags to inject into the HTML head for the current route.
//
// On the client this module exists but is never read — usePageMeta updates the
// real DOM head via useEffect. The synchronous part runs during render too,
// which is the only path that runs on the server.

export type SsrMeta = {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  /** Per-page above-the-fold font files to preload. A string preloads
   *  unconditionally; an `{ href, media }` entry scopes it to a viewport. */
  fontPreload?: Array<string | { href: string; media: string }>;
  /** When true, the page emits <meta name="robots" content="noindex,follow">
   *  so it stays crawlable + prerendered but out of search results. */
  noindex?: boolean;
  /** Pre-stringified JSON-LD blocks to inject into the prerendered <head>. */
  jsonLd?: string[];
};

let current: SsrMeta = {};

export const setSsrMeta = (m: SsrMeta) => {
  // Last writer wins. usePageMeta is called once per page, so this is fine.
  current = { ...current, ...m };
};

export const readSsrMeta = (): SsrMeta => current;

export const resetSsrMeta = () => {
  current = {};
};
