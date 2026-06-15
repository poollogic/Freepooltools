import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Droplets,
  Gauge,
  FlaskConical,
  Zap,
  Scale,
  Filter,
  Brush,
  Sparkles,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { GuideLayout } from '@/components/GuideLayout';
import { GUIDES } from '@/data/guides';
import { useInViewAnim, animDelay } from '@/lib/useInViewAnim';

const guide = GUIDES.find((g) => g.slug === 'cloudy-pool-water')!;

/** Log-scale particle-size chart: cloudy-water particles vs. what each filter
 *  type can actually catch — the visual case for why clarifier exists.
 *  x = 72 + 138.7 × (log10(µm) + 1), spanning 0.1–100 µm. */
const MicronDiagram = () => {
  const { ref, cls } = useInViewAnim();
  return (
    <figure ref={ref} className={`not-prose my-8 rounded-2xl border border-line bg-card-2 p-4 sm:p-6 ${cls}`}>
      <svg
        viewBox="0 0 520 300"
        className="w-full h-auto"
        role="img"
        aria-label="Particle-size chart from 0.1 to 100 microns. The particles that make water cloudy are 0.5 to 5 microns. A DE filter catches down to about 2 microns, a cartridge filter about 10 to 20, and a sand filter only 20 to 40 — so most cloudy-water particles slip straight through, which is why a clarifier (which clumps them into bigger particles) helps."
      >
        {/* the gap no filter reaches: below ~2 µm */}
        <g className="dgm-fade" style={animDelay(0.15)}>
          <rect x="169" y="58" width="83" height="202" className="text-brand-orange" fill="currentColor" fillOpacity="0.08" />
          <line x1="169" y1="58" x2="169" y2="260" className="text-brand-orange" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.5" />
          <line x1="252" y1="58" x2="252" y2="260" className="text-brand-orange" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.5" />
          <text x="210" y="48" textAnchor="middle" fontSize="10.5" className="text-brand-orange" fill="currentColor" fontWeight="600">
            too fine for any filter
          </text>
        </g>

        {/* axis */}
        <g className="dgm-fade">
          <line x1="60" y1="260" x2="490" y2="260" className="text-line-strong" stroke="currentColor" strokeWidth="2" />
          <g className="text-subtle" stroke="currentColor" strokeWidth="1.5">
            <line x1="72" y1="260" x2="72" y2="266" />
            <line x1="211" y1="260" x2="211" y2="266" />
            <line x1="349" y1="260" x2="349" y2="266" />
            <line x1="488" y1="260" x2="488" y2="266" />
          </g>
          <g fontSize="12" className="text-subtle" fill="currentColor">
            <text x="72" y="278" textAnchor="middle">0.1</text>
            <text x="211" y="278" textAnchor="middle">1</text>
            <text x="349" y="278" textAnchor="middle">10</text>
            <text x="488" y="278" textAnchor="end">100</text>
            <text x="275" y="296" textAnchor="middle">particle size (microns, log scale)</text>
          </g>
        </g>

        {/* cloudy-water particles */}
        <g className="dgm-fade" style={animDelay(0.35)}>
          <text x="169" y="66" fontSize="12" className="text-brand-orange" fill="currentColor" fontWeight="600">cloudy-water particles · 0.5–5 µm</text>
          <rect x="169" y="72" width="139" height="18" rx="9" className="text-brand-orange" fill="currentColor" fillOpacity="0.85" />
        </g>

        {/* DE filter */}
        <g className="dgm-fade" style={animDelay(0.55)}>
          <text x="252" y="116" fontSize="12" className="text-brand-blue-light" fill="currentColor" fontWeight="600">DE filter · ~2–5 µm</text>
          <rect x="252" y="122" width="56" height="18" rx="9" className="text-brand-blue-light" fill="currentColor" fillOpacity="0.85" />
        </g>

        {/* cartridge filter */}
        <g className="dgm-fade" style={animDelay(0.75)}>
          <text x="349" y="166" fontSize="12" className="text-brand-blue" fill="currentColor" fontWeight="600">cartridge · ~10–20 µm</text>
          <rect x="349" y="172" width="42" height="18" rx="9" className="text-brand-blue" fill="currentColor" fillOpacity="0.85" />
        </g>

        {/* sand filter */}
        <g className="dgm-fade" style={animDelay(0.95)}>
          <text x="432" y="216" textAnchor="end" fontSize="12" className="text-muted" fill="currentColor" fontWeight="600">sand · ~20–40 µm</text>
          <rect x="391" y="222" width="41" height="18" rx="9" className="text-muted" fill="currentColor" fillOpacity="0.8" />
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-subtle">
        The mismatch in one picture: most of what makes water cloudy is <strong>smaller than what your
        filter catches</strong> — especially sand filters. Clarifier works by clumping those fines into
        particles big enough to trap.
      </figcaption>
    </figure>
  );
};

type Step = { icon: LucideIcon; title: string; body: ReactNode };
const STEPS: Step[] = [
  {
    icon: FlaskConical,
    title: 'Test everything first',
    body: (
      <>Free chlorine, pH, alkalinity, CYA, calcium. Cloudy water is a symptom with four possible causes —
      two minutes of testing tells you which one is yours instead of guessing with chemicals.</>
    ),
  },
  {
    icon: Zap,
    title: 'Fix chlorine first',
    body: (
      <>If free chlorine is low for your CYA, treat the cloud as <strong>early algae</strong> and shock —
      the <Link to="/pool-shock-calculator/">shock calculator</Link> gives the exact dose. Sanitizer
      problems cause most cloudy water, and nothing else works until this is right.</>
    ),
  },
  {
    icon: Scale,
    title: 'Correct the chemistry',
    body: (
      <>High pH (8.0+) weakens chlorine and pushes calcium out of solution as a fine white haze. Bring pH
      down with <Link to="/muriatic-acid-calculator/">muriatic acid</Link> and check your overall balance
      with the <Link to="/lsi-calculator/">LSI calculator</Link> — a strongly positive index means the
      cloud is scale-forming chemistry, not dirt.</>
    ),
  },
  {
    icon: Filter,
    title: 'Run the filter around the clock',
    body: (
      <>Clearing a cloud is a filtration job: run the pump <strong>24/7</strong> until the water is clear,
      then settle back to a <Link to="/pool-pump-runtime-calculator/">full daily turnover</Link>. Clean or
      backwash whenever the pressure gauge reads ~8–10 psi over its clean baseline — a loaded filter
      moves almost no water.</>
    ),
  },
  {
    icon: Brush,
    title: 'Brush and vacuum',
    body: (
      <>Brush walls and floor daily so settled particles go back into suspension where the filter can get
      them, and vacuum up anything heavy. Skim the surface — organic debris dissolving in the water is a
      steady source of new cloud.</>
    ),
  },
  {
    icon: Sparkles,
    title: 'Help the filter with clarifier (if needed)',
    body: (
      <>If chemistry is right and the water is still hazy after a couple of days, the particles are
      probably too fine to catch. A dose of <strong>clarifier</strong> clumps them into filterable size;
      for a severe milk-white pool, <strong>flocculant</strong> sinks everything to the floor to vacuum
      out (see the comparison below).</>
    ),
  },
  {
    icon: CheckCircle2,
    title: 'Confirm it’s actually fixed',
    body: (
      <>Clear water plus passing numbers — chlorine holding at target for your CYA and LSI near zero —
      means the cause is gone, not just the symptom. If the cloud keeps returning, re-test: chronic
      cloudiness is almost always a chlorine or filtration shortfall.</>
    ),
  },
];

const StepList = () => (
  <div className="not-prose my-8 space-y-3">
    {STEPS.map((step, i) => {
      const Icon = step.icon;
      return (
        <div key={step.title} className="group flex gap-4 sm:gap-5 rounded-2xl border border-line bg-card p-4 sm:p-5 elevate transition-colors hover:border-line-strong">
          <div className="shrink-0 flex flex-col items-center gap-2.5">
            <span className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue-light to-brand-blue text-white font-display font-bold text-[15px] shadow-sm shadow-brand-blue/30 ring-1 ring-white/15">
              {i + 1}
            </span>
            <span aria-hidden className="grid place-items-center w-8 h-8 rounded-lg bg-brand-orange/10 text-brand-orange">
              <Icon className="w-[18px] h-[18px]" />
            </span>
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-fg text-[15px] sm:text-base mb-1">{step.title}</h3>
            <p className="text-muted text-[14px] sm:text-[15px] leading-relaxed">{step.body}</p>
          </div>
        </div>
      );
    })}
  </div>
);

/** Clarifier vs flocculant — targets that comparison query directly. */
const COMPARISON = [
  { row: 'How it works', clarifier: 'Clumps fine particles so your filter can catch them', floc: 'Binds everything and sinks it to the floor' },
  { row: 'Speed', clarifier: 'Gradual — 2–3 days of normal filtering', floc: 'Overnight' },
  { row: 'Effort', clarifier: 'Pour it in, keep the filter running', floc: 'Pump off overnight, then a careful manual vacuum to waste' },
  { row: 'Filter type', clarifier: 'Any', floc: 'Needs a multiport valve with a “waste” setting — usually not cartridge systems' },
  { row: 'Best for', clarifier: 'Mild to moderate haze', floc: 'Severe milk-white water you can’t see through' },
];

const ComparisonTable = () => (
  <div className="not-prose my-8">
    <div className="overflow-x-auto rounded-2xl border border-line bg-card elevate">
      <table className="w-full text-[15px] text-left border-collapse">
        <caption className="sr-only">Clarifier versus flocculant: how each works, speed, effort, filter compatibility, and best use.</caption>
        <thead>
          <tr className="border-b border-line text-subtle">
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap"><span className="sr-only">Property</span></th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Clarifier</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Flocculant</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {COMPARISON.map((r) => (
            <tr key={r.row} className="transition-colors hover:bg-card-2">
              <th scope="row" className="px-4 sm:px-5 py-3.5 font-semibold text-fg whitespace-nowrap align-top text-[14px]">{r.row}</th>
              <td className="px-4 sm:px-5 py-3.5 align-top text-muted text-[14px] leading-relaxed">{r.clarifier}</td>
              <td className="px-4 sm:px-5 py-3.5 align-top text-muted text-[14px] leading-relaxed">{r.floc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const FAQS = [
  {
    q: 'Can you swim in a cloudy pool?',
    a: 'No — for two reasons. Cloudy water usually means the sanitizer is struggling, so bacteria may be along for the ride. And the bigger risk is visibility: if you can’t clearly see the main drain, a swimmer in trouble below the surface is invisible, which is why public pools close at the first sign of a cloud. Clear it first.',
  },
  {
    q: 'Why is my pool cloudy after shocking?',
    a: 'Usually it’s the shock working: chlorine kills algae and oxidizes contaminants, and the dead, oxidized particles turn the water hazy until the filter removes them — expect 1–3 days of around-the-clock filtering. Cal-hypo shock can also cloud water temporarily on its own, since it adds calcium. If the cloud lasts longer than a few days, check pH and your filter pressure.',
  },
  {
    q: 'How long does it take to clear a cloudy pool?',
    a: 'With the cause fixed and the filter running 24/7, most pools clear in 2–3 days. A clarifier can shave a day off; flocculant plus a vacuum-to-waste session can do it overnight for severe cases. If nothing has improved after 3 days, the cause isn’t fixed — re-test chlorine and pH, and check that the filter isn’t clogged or channeling.',
  },
  {
    q: 'Will baking soda clear a cloudy pool?',
    a: 'No — usually the opposite. Baking soda raises total alkalinity and nudges pH upward, and high pH/alkalinity is itself a cause of cloudy water (it weakens chlorine and pushes calcium toward scale). Only add baking soda if a test shows alkalinity is actually low. Cloudy water is fixed by testing, not by pouring in something white and hoping.',
  },
  {
    q: 'Why is my pool cloudy after rain?',
    a: 'Rain washes dust, pollen, algae spores, and yard runoff into the pool, and a big storm also dilutes your chlorine and CYA slightly. The combination — more contaminants, less sanitizer — is a recipe for haze. After heavy rain: empty the skimmer, test, bring free chlorine back to target, and give the filter some extra hours.',
  },
  {
    q: 'Clarifier or flocculant — which should I use?',
    a: 'Clarifier for mild to moderate haze: it’s pour-and-wait, works with any filter, and clears over 2–3 days. Flocculant for severe, can’t-see-the-bottom water: it sinks everything to the floor overnight, but you must vacuum the sediment to waste (bypassing the filter), which generally requires a sand or DE setup with a multiport valve. Never run flocced water through a cartridge filter.',
  },
];

const SOURCES = [
  { label: 'Trouble Free Pool — community wiki (water clarity)', url: 'https://www.troublefreepool.com/wiki/' },
  { label: 'CDC — Healthy Swimming (water quality & closures)', url: 'https://www.cdc.gov/healthy-swimming/' },
  { label: 'PHTA — Pool & Hot Tub Alliance (filtration standards)', url: 'https://www.phta.org/' },
];

export const CloudyWaterGuide = () => (
  <GuideLayout
    title={guide.title}
    metaTitle="Cloudy Pool Water: 4 Causes & How to Clear It Fast"
    description="Cloudy pool water comes down to four causes: chlorine, chemistry, filtration, or particles. How to tell which one you have — and clear it in 2–3 days."
    path={guide.path}
    updated={guide.updated}
    readMinutes={8}
    faqs={FAQS}
    sources={SOURCES}
    cta={{
      to: '/pool-shock-calculator/',
      label: 'Low chlorine behind your cloud?',
      sub: 'Most cloudy water starts as a sanitizer problem — the shock calculator gives the exact dose to knock it out.',
    }}
  >
    <p>
      Cloudy pool water is millions of particles too small for your filter to catch — and they got there
      one of four ways: <strong>chlorine fell behind</strong> (early algae and bacteria),{' '}
      <strong>chemistry drifted</strong> (high pH pushing calcium out of solution),{' '}
      <strong>filtration fell short</strong> (not enough hours, or a loaded filter), or{' '}
      <strong>fine debris</strong> arrived faster than it could be removed. Test first, fix the cause,
      then filter — most pools are clear again in <strong>2–3 days</strong>.
    </p>

    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-brand-blue/40 bg-gradient-to-br from-brand-blue/15 via-transparent to-brand-orange/10 elevate">
      <div className="p-5 sm:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 mb-3">
          <Clock className="w-3.5 h-3.5 text-brand-blue-light" />
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-brand-blue-light">Quick answer</span>
        </span>
        <p className="text-fg text-[15px] sm:text-base leading-relaxed">
          Test the water before adding anything. <strong className="font-semibold">Low chlorine →
          shock it</strong> (it’s early algae). <strong className="font-semibold">High pH or LSI →
          rebalance</strong> (it’s suspended scale). Then run the filter <strong className="font-semibold">24/7</strong>,
          clean it when pressure climbs, and add clarifier only if fine particles remain.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line border-t border-line bg-card-2">
        {[
          { icon: Droplets, value: '0.5–5 µm', label: 'the particle size that makes water cloudy' },
          { icon: Clock, value: '2–3 days', label: 'typical time to clear with 24/7 filtration' },
          { icon: Gauge, value: '+8–10 psi', label: 'pressure rise that means clean the filter' },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.value} className="flex items-center gap-3 px-5 py-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-brand-orange/10 text-brand-orange shrink-0">
                <Icon className="w-[18px] h-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block font-display font-bold text-fg text-lg leading-tight">{s.value}</span>
                <span className="block text-subtle text-xs mt-0.5 leading-snug">{s.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>

    <h2>Why is my pool cloudy?</h2>
    <p>
      Water looks cloudy when light scatters off suspended particles — dust, pollen, dead (or living)
      algae, oils, and microscopic calcium scale. Your filter removes particles down to a certain size;
      everything smaller just keeps circulating. So every cloudy pool is really two questions:{' '}
      <strong>what’s producing the particles</strong>, and <strong>why isn’t the filter winning</strong>?
      The four causes below cover essentially every case — and the order matters, because the most common
      cause is also the one people skip.
    </p>

    <h2>The 4 causes of cloudy pool water</h2>

    <h3>1. Low or ineffective chlorine — the pre-green warning</h3>
    <p>
      The most common cause. When free chlorine falls below what your CYA level demands, bacteria and
      early-stage algae multiply — and a faint milky haze is the first visible symptom,{' '}
      <em>before</em> any green. Treat it like the early algae it is: shock to the level for your CYA
      with the <Link to="/pool-shock-calculator/">shock calculator</Link>. If chlorine reads fine but
      keeps disappearing, run the overnight test in{' '}
      <Link to="/guides/why-wont-my-pool-hold-chlorine/">why won’t my pool hold chlorine</Link> — cloud
      plus vanishing chlorine is algae until proven otherwise.
    </p>

    <h3>2. Unbalanced chemistry — suspended scale</h3>
    <p>
      When pH climbs past ~8.0, two things happen: chlorine gets dramatically weaker, and dissolved
      calcium starts coming out of solution as microscopic carbonate particles — a white, chemical haze
      that no amount of shock fixes. High alkalinity and high calcium hardness push the same direction.
      The <Link to="/lsi-calculator/">LSI calculator</Link> tells you in one number whether your water is
      scale-forming (strongly positive = cloudy chemistry); the fix is usually{' '}
      <Link to="/muriatic-acid-calculator/">muriatic acid</Link> to bring pH and alkalinity down.
    </p>

    <h3>3. Filtration falling short</h3>
    <p>
      A filter only clears water that moves through it. Too few pump hours (less than a{' '}
      <Link to="/pool-pump-runtime-calculator/">full daily turnover</Link>), a filter loaded to +8–10 psi
      over its clean pressure, worn cartridges, or channeled sand all mean the cloud is winning the race.
      This is the cause when the water chemistry tests perfect but the haze never improves — and it’s the
      multiplier on every other cause.
    </p>

    <h3>4. Fine debris the filter can’t catch</h3>
    <p>
      Pollen season, nearby construction dust, a dust storm, heavy rain runoff, or the aftermath of a
      shock (dead algae) can fill the water with particles in the 0.5–5 micron range — below what most
      filters trap, as the chart below shows. Chemistry won’t fix inert particles; this is the one case
      where <strong>clarifier or flocculant</strong> is the right tool.
    </p>

    <h2>How to clear cloudy pool water, step by step</h2>
    <p>
      Work the steps in order — chemicals before mechanics, cause before symptom:
    </p>

    <StepList />

    <h2>Why your filter can’t catch it</h2>
    <p>
      The dirty secret of cloudy water: most of the particles are simply <strong>smaller than your
      filter’s mesh</strong>. A sand filter — the most common type — catches particles down to roughly
      20–40 microns; the haze you’re staring at is mostly 0.5–5 microns. That’s why a perfectly
      functioning filter can run for days without progress, and why clarifier (which electrostatically
      clumps fines into filterable sizes) feels like magic:
    </p>

    <MicronDiagram />

    <h2>Clarifier vs. flocculant: which to use</h2>
    <p>
      Both attack the same problem — particles too fine to filter — from opposite directions. Clarifier
      makes them <em>bigger</em> so the filter wins; flocculant makes them <em>heavier</em> so gravity
      wins:
    </p>

    <ComparisonTable />

    <h2>Pool cloudy after shocking?</h2>
    <p>
      Counterintuitive but normal: shock often makes water <em>cloudier</em> for a day or two before it
      gets clear. The chlorine is killing algae and oxidizing contaminants, and all those dead particles
      hang in suspension until the filter collects them. Keep the pump running around the clock, brush
      daily, and the haze lifts as the kill completes. Cal-hypo users: part of your cloud is the calcium
      carrier dissolving — same answer, keep filtering. And remember the water has to be both{' '}
      <strong>clear and back at a safe chlorine level</strong> before anyone swims — here’s{' '}
      <Link to="/guides/how-long-after-shocking-pool-can-you-swim/">exactly when it’s safe</Link>.
    </p>
  </GuideLayout>
);
