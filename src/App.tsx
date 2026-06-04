import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

// Routes are lazy-loaded so first paint only parses the page being viewed,
// not every tool on the site. Prerendered HTML covers SEO/LCP; this keeps the
// hydration bundle small as more calculators are added.
const HomePage = lazy(() => import('@/pages/HomePage').then((m) => ({ default: m.HomePage })));
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })));
const PoolVolumeCalculatorPage = lazy(() =>
  import('@/pages/PoolVolumeCalculatorPage').then((m) => ({ default: m.PoolVolumeCalculatorPage })),
);
const ChlorineCalculatorPage = lazy(() =>
  import('@/pages/ChlorineCalculatorPage').then((m) => ({ default: m.ChlorineCalculatorPage })),
);
const PoolShockCalculatorPage = lazy(() =>
  import('@/pages/PoolShockCalculatorPage').then((m) => ({ default: m.PoolShockCalculatorPage })),
);
const CyaCalculatorPage = lazy(() =>
  import('@/pages/CyaCalculatorPage').then((m) => ({ default: m.CyaCalculatorPage })),
);
const SaltCalculatorPage = lazy(() =>
  import('@/pages/SaltCalculatorPage').then((m) => ({ default: m.SaltCalculatorPage })),
);
const LsiCalculatorPage = lazy(() =>
  import('@/pages/LsiCalculatorPage').then((m) => ({ default: m.LsiCalculatorPage })),
);
const PoolHeatingCostCalculatorPage = lazy(() =>
  import('@/pages/PoolHeatingCostCalculatorPage').then((m) => ({ default: m.PoolHeatingCostCalculatorPage })),
);
const PoolPumpRuntimeCalculatorPage = lazy(() =>
  import('@/pages/PoolPumpRuntimeCalculatorPage').then((m) => ({ default: m.PoolPumpRuntimeCalculatorPage })),
);
const VariableSpeedPumpSavingsCalculatorPage = lazy(() =>
  import('@/pages/VariableSpeedPumpSavingsCalculatorPage').then((m) => ({ default: m.VariableSpeedPumpSavingsCalculatorPage })),
);
// Guides are their own lazy chunks — opening a calculator never loads guide code.
const GuidesHubPage = lazy(() =>
  import('@/pages/guides/GuidesHubPage').then((m) => ({ default: m.GuidesHubPage })),
);
const CyaChlorineGuide = lazy(() =>
  import('@/pages/guides/CyaChlorineGuide').then((m) => ({ default: m.CyaChlorineGuide })),
);
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// On route change, jump to top (unless navigating to an in-page #anchor).
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

export default function App() {
  return (
    <>
      <ScrollToTop />
      {/* fallback={null} keeps the current page visible during the brief
          chunk-load gap on slow connections instead of flashing blank. */}
      <Suspense fallback={null}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pool-volume-calculator" element={<PoolVolumeCalculatorPage />} />
          <Route path="/embed/pool-volume-calculator" element={<PoolVolumeCalculatorPage embed />} />
          <Route path="/chlorine-calculator" element={<ChlorineCalculatorPage />} />
          <Route path="/pool-shock-calculator" element={<PoolShockCalculatorPage />} />
          <Route path="/cya-calculator" element={<CyaCalculatorPage />} />
          <Route path="/salt-calculator" element={<SaltCalculatorPage />} />
          <Route path="/lsi-calculator" element={<LsiCalculatorPage />} />
          <Route path="/pool-heating-cost-calculator" element={<PoolHeatingCostCalculatorPage />} />
          <Route path="/pool-pump-runtime-calculator" element={<PoolPumpRuntimeCalculatorPage />} />
          <Route path="/variable-speed-pool-pump-savings-calculator" element={<VariableSpeedPumpSavingsCalculatorPage />} />
          <Route path="/guides" element={<GuidesHubPage />} />
          <Route path="/guides/cyanuric-acid-and-chlorine" element={<CyaChlorineGuide />} />
          {/* Catch-all 404 — must be last. */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </>
  );
}
