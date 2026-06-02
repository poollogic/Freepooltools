// Server entry for static prerendering. Used only at build time
// (scripts/prerender.mjs) to render each public route to a fully-formed
// dist/<route>/index.html. No React.lazy() here — renderToString is synchronous
// and bails on Suspense, so pages are imported eagerly to render real content.

import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react';
import { resetSsrMeta, readSsrMeta } from '@/lib/serverMeta';

import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { PoolVolumeCalculatorPage } from '@/pages/PoolVolumeCalculatorPage';
import { ChlorineCalculatorPage } from '@/pages/ChlorineCalculatorPage';
import { CyaCalculatorPage } from '@/pages/CyaCalculatorPage';
import { SaltCalculatorPage } from '@/pages/SaltCalculatorPage';
import { GuidesHubPage } from '@/pages/guides/GuidesHubPage';
import { CyaChlorineGuide } from '@/pages/guides/CyaChlorineGuide';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Routes to prerender. Keep in sync with App.tsx's route table. These get their
// own dist/<route>/index.html and go in the sitemap.
export const PRERENDER_ROUTES = [
  '/',
  '/about',
  '/pool-volume-calculator',
  '/chlorine-calculator',
  '/cya-calculator',
  '/salt-calculator',
  '/guides',
  '/guides/cyanuric-acid-and-chlorine',
];

// Rendered separately to dist/404.html — Cloudflare Pages serves it (with a 404
// status) for any path that doesn't match a prerendered file.
export const NOT_FOUND_PATH = '/__404__';

const Routing = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
    <Route path="/chlorine-calculator" element={<ChlorineCalculatorPage />} />
    <Route path="/cya-calculator" element={<CyaCalculatorPage />} />
    <Route path="/salt-calculator" element={<SaltCalculatorPage />} />
    <Route path="/guides" element={<GuidesHubPage />} />
    <Route path="/guides/cyanuric-acid-and-chlorine" element={<CyaChlorineGuide />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

/**
 * Render a single route to an HTML body string + the meta the page declared via
 * usePageMeta (collected synchronously during render through the serverMeta
 * singleton). Caller splices both into the HTML template.
 */
export function render(url: string) {
  resetSsrMeta();
  const html = renderToString(
    <StaticRouter location={url}>
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          <Routing />
        </LazyMotion>
      </MotionConfig>
    </StaticRouter>,
  );
  return { html, meta: readSsrMeta() };
}
