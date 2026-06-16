// Server entry for static prerendering. Used only at build time
// (scripts/prerender.mjs) to render each public route to a fully-formed
// dist/<route>/index.html. No React.lazy() here — renderToString is synchronous
// and bails on Suspense, so pages are imported eagerly to render real content.

import { renderToString } from 'react-dom/server';
import { StaticRouter, Routes, Route } from 'react-router-dom';
import { resetSsrMeta, readSsrMeta } from '@/lib/serverMeta';

import { HomePage } from '@/pages/HomePage';
import { AboutPage } from '@/pages/AboutPage';
import { PoolVolumeCalculatorPage } from '@/pages/PoolVolumeCalculatorPage';
import { ChlorineCalculatorPage } from '@/pages/ChlorineCalculatorPage';
import { PoolShockCalculatorPage } from '@/pages/PoolShockCalculatorPage';
import { CyaCalculatorPage } from '@/pages/CyaCalculatorPage';
import { SaltCalculatorPage } from '@/pages/SaltCalculatorPage';
import { MuriaticAcidCalculatorPage } from '@/pages/MuriaticAcidCalculatorPage';
import { PoolAlkalinityCalculatorPage } from '@/pages/PoolAlkalinityCalculatorPage';
import { CalciumHardnessCalculatorPage } from '@/pages/CalciumHardnessCalculatorPage';
import { LsiCalculatorPage } from '@/pages/LsiCalculatorPage';
import { PoolHeatingCostCalculatorPage } from '@/pages/PoolHeatingCostCalculatorPage';
import { PoolPumpRuntimeCalculatorPage } from '@/pages/PoolPumpRuntimeCalculatorPage';
import { VariableSpeedPumpSavingsCalculatorPage } from '@/pages/VariableSpeedPumpSavingsCalculatorPage';
import { GuidesHubPage } from '@/pages/guides/GuidesHubPage';
import { CyaChlorineGuide } from '@/pages/guides/CyaChlorineGuide';
import { DrainPoolGuide } from '@/pages/guides/DrainPoolGuide';
import { SwimAfterShockGuide } from '@/pages/guides/SwimAfterShockGuide';
import { GreenPoolGuide } from '@/pages/guides/GreenPoolGuide';
import { HoldChlorineGuide } from '@/pages/guides/HoldChlorineGuide';
import { CloudyWaterGuide } from '@/pages/guides/CloudyWaterGuide';
import { ShockFrequencyGuide } from '@/pages/guides/ShockFrequencyGuide';
import { AdminPage } from '@/pages/AdminPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Routes to prerender. Keep in sync with App.tsx's route table. These get their
// own dist/<route>/index.html and go in the sitemap.
export const PRERENDER_ROUTES = [
  '/',
  '/about',
  '/pool-volume-calculator',
  '/embed/pool-volume-calculator',
  '/chlorine-calculator',
  '/pool-shock-calculator',
  '/cya-calculator',
  '/salt-calculator',
  '/muriatic-acid-calculator',
  '/pool-alkalinity-calculator',
  '/calcium-hardness-calculator',
  '/lsi-calculator',
  '/pool-heating-cost-calculator',
  '/pool-pump-runtime-calculator',
  '/variable-speed-pool-pump-savings-calculator',
  '/guides',
  '/guides/cyanuric-acid-and-chlorine',
  '/guides/how-to-drain-a-pool-with-a-garden-hose',
  '/guides/how-long-after-shocking-pool-can-you-swim',
  '/guides/how-to-fix-a-green-pool',
  '/guides/why-wont-my-pool-hold-chlorine',
  '/guides/cloudy-pool-water',
  '/guides/how-often-to-shock-your-pool',
  // Private admin console: prerendered so /admin returns real HTML (200), but
  // noindex + excluded from the sitemap (see scripts/prerender.mjs).
  '/admin',
];

// Rendered separately to dist/404.html — Cloudflare Pages serves it (with a 404
// status) for any path that doesn't match a prerendered file.
export const NOT_FOUND_PATH = '/__404__';

const Routing = () => (
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
    <Route path="/embed/pool-volume-calculator" element={<PoolVolumeCalculatorPage embed />} />
    <Route path="/chlorine-calculator" element={<ChlorineCalculatorPage />} />
    <Route path="/pool-shock-calculator" element={<PoolShockCalculatorPage />} />
    <Route path="/cya-calculator" element={<CyaCalculatorPage />} />
    <Route path="/salt-calculator" element={<SaltCalculatorPage />} />
    <Route path="/muriatic-acid-calculator" element={<MuriaticAcidCalculatorPage />} />
    <Route path="/pool-alkalinity-calculator" element={<PoolAlkalinityCalculatorPage />} />
    <Route path="/calcium-hardness-calculator" element={<CalciumHardnessCalculatorPage />} />
    <Route path="/lsi-calculator" element={<LsiCalculatorPage />} />
    <Route path="/pool-heating-cost-calculator" element={<PoolHeatingCostCalculatorPage />} />
    <Route path="/pool-pump-runtime-calculator" element={<PoolPumpRuntimeCalculatorPage />} />
    <Route path="/variable-speed-pool-pump-savings-calculator" element={<VariableSpeedPumpSavingsCalculatorPage />} />
    <Route path="/guides" element={<GuidesHubPage />} />
    <Route path="/guides/cyanuric-acid-and-chlorine" element={<CyaChlorineGuide />} />
    <Route path="/guides/how-to-drain-a-pool-with-a-garden-hose" element={<DrainPoolGuide />} />
    <Route path="/guides/how-long-after-shocking-pool-can-you-swim" element={<SwimAfterShockGuide />} />
    <Route path="/guides/how-to-fix-a-green-pool" element={<GreenPoolGuide />} />
    <Route path="/guides/why-wont-my-pool-hold-chlorine" element={<HoldChlorineGuide />} />
    <Route path="/guides/cloudy-pool-water" element={<CloudyWaterGuide />} />
    <Route path="/guides/how-often-to-shock-your-pool" element={<ShockFrequencyGuide />} />
    <Route path="/admin" element={<AdminPage />} />
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
      <Routing />
    </StaticRouter>,
  );
  return { html, meta: readSsrMeta() };
}
