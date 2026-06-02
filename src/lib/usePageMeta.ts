import { useEffect, useRef } from 'react';
import { setSsrMeta } from './serverMeta';
import { SITE_ORIGIN } from './site';

const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/og-default.png`;

// `window` is undefined in Node — used to detect server (populate the serverMeta
// singleton) vs. client (useEffect updates the real DOM head).
const IS_SERVER = typeof window === 'undefined';

type PageMeta = {
  title: string;
  description: string;
  /** Path-only (e.g. "/pool-volume-calculator/") or omit for homepage. */
  canonicalPath?: string;
  /** Absolute URL or path. Defaults to the site OG image. */
  ogImage?: string;
  /** Per-page above-the-fold fonts to preload, so each route preloads only the
   *  weights it paints. A string preloads unconditionally; `{ href, media }`
   *  scopes a font to a viewport. */
  fontPreload?: Array<string | { href: string; media: string }>;
  /** Keep this page out of search results (transactional/utility pages). Emits
   *  <meta name="robots" content="noindex,follow"> — still crawlable. */
  noindex?: boolean;
  /** JSON-LD schema objects. Rendered into the PRERENDERED <head> on the server
   *  and injected on the client. Pass a stable (module-level) array. */
  jsonLd?: Record<string, unknown>[];
};

/** The site's single typeface (Inter) at its three self-hosted weights. */
export const FONTS = {
  inter400: '/fonts/inter-400.woff2',
  inter600: '/fonts/inter-600.woff2',
  inter700: '/fonts/inter-700.woff2',
} as const;

/** Above-the-fold fonts shared by every page: body, UI semibold, bold headings. */
export const NAV_FONTS = [FONTS.inter400, FONTS.inter600, FONTS.inter700];

const setTag = (selector: string, attrName: 'name' | 'property', attrValue: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  const created = !el;
  const prev = el?.getAttribute('content') ?? null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
  return { el, created, prev };
};

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  const created = !el;
  const prev = el?.getAttribute('href') ?? null;
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
  return { el, created, prev };
};

/**
 * Sets per-page <title>, description, canonical, and Open Graph / Twitter tags
 * while the route is mounted. On the server it populates the serverMeta
 * singleton (read by the prerender script for the static HTML head); on the
 * client it updates the real DOM head and restores previous values on unmount.
 */
export function usePageMeta(meta: PageMeta): void;
export function usePageMeta(title: string, description: string): void;
export function usePageMeta(metaOrTitle: PageMeta | string, maybeDesc?: string) {
  const meta: PageMeta =
    typeof metaOrTitle === 'string'
      ? { title: metaOrTitle, description: maybeDesc ?? '' }
      : metaOrTitle;

  const { title, description, canonicalPath, ogImage, fontPreload, noindex, jsonLd } = meta;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath ?? '/'}`;
  const image = ogImage
    ? ogImage.startsWith('http')
      ? ogImage
      : `${SITE_ORIGIN}${ogImage}`
    : DEFAULT_OG_IMAGE;

  // Server: populate the SSR meta singleton during render (the prerender script
  // reads it and writes the meta + JSON-LD into the static HTML head).
  if (IS_SERVER) {
    setSsrMeta({
      title,
      description,
      canonicalUrl,
      ogImage: image,
      fontPreload,
      noindex,
      jsonLd: jsonLd?.map((s) => JSON.stringify(s)),
    });
  }

  // Client: inject the same JSON-LD once on mount (covers SPA navigation, where
  // there's no prerendered head to read). Captured by ref so it injects once.
  const jsonLdRef = useRef(jsonLd);
  useEffect(() => {
    const schemas = jsonLdRef.current;
    if (!schemas || schemas.length === 0) return;
    const els = schemas.map((schema) => {
      const el = document.createElement('script');
      el.type = 'application/ld+json';
      el.text = JSON.stringify(schema);
      document.head.appendChild(el);
      return el;
    });
    return () => els.forEach((el) => el.remove());
  }, []);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const desc = setTag('meta[name="description"]', 'name', 'description', description);
    const canon = setLink('canonical', canonicalUrl);
    const ogTitle = setTag('meta[property="og:title"]', 'property', 'og:title', title);
    const ogDesc = setTag('meta[property="og:description"]', 'property', 'og:description', description);
    const ogUrl = setTag('meta[property="og:url"]', 'property', 'og:url', canonicalUrl);
    const ogType = setTag('meta[property="og:type"]', 'property', 'og:type', 'website');
    const ogImg = setTag('meta[property="og:image"]', 'property', 'og:image', image);
    const twCard = setTag('meta[name="twitter:card"]', 'name', 'twitter:card', 'summary_large_image');
    const twTitle = setTag('meta[name="twitter:title"]', 'name', 'twitter:title', title);
    const twDesc = setTag('meta[name="twitter:description"]', 'name', 'twitter:description', description);
    const twImg = setTag('meta[name="twitter:image"]', 'name', 'twitter:image', image);

    const restore = [desc, ogTitle, ogDesc, ogUrl, ogType, ogImg, twCard, twTitle, twDesc, twImg];

    const robots = noindex
      ? setTag('meta[name="robots"]', 'name', 'robots', 'noindex,follow')
      : null;

    return () => {
      document.title = prevTitle;
      for (const r of restore) {
        if (r.created) r.el.remove();
        else if (r.prev !== null) r.el.setAttribute('content', r.prev);
      }
      if (canon.created) canon.el.remove();
      else if (canon.prev !== null) canon.el.setAttribute('href', canon.prev);
      if (robots) {
        if (robots.created) robots.el.remove();
        else if (robots.prev !== null) robots.el.setAttribute('content', robots.prev);
      }
    };
  }, [title, description, canonicalUrl, image, noindex]);
}
