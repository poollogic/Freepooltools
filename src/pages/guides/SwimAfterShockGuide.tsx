import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Clock, FlaskConical, Eye, RefreshCw, ShieldCheck, Zap, CheckCircle2, type LucideIcon } from 'lucide-react';
import { GuideLayout } from '@/components/GuideLayout';
import { GUIDES } from '@/data/guides';
import { useInViewAnim, animDelay } from '@/lib/useInViewAnim';

const guide = GUIDES.find((g) => g.slug === 'how-long-after-shocking-pool-can-you-swim')!;

/** Free chlorine after a shock: spike, decay, and the CYA-based safe-to-swim zone. */
const DecayDiagram = () => {
  const { ref, cls } = useInViewAnim();
  return (
    <figure ref={ref} className={`not-prose my-8 rounded-2xl border border-line bg-card-2 p-4 sm:p-6 ${cls}`}>
      <svg
        viewBox="0 0 520 300"
        className="w-full h-auto"
        role="img"
        aria-label="Chart of free chlorine over the hours after shocking: it spikes to the shock level, then falls. The pool is safe to swim once the reading crosses back below the safe ceiling for your stabilizer level — for a typical dose, somewhere between 8 and 24 hours."
      >
        <defs>
          <linearGradient id="dgm-fc-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-orange)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--color-brand-orange)" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="dgm-safe-zone" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-blue)" stopOpacity="0.06" />
            <stop offset="100%" stopColor="var(--color-brand-blue)" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* axes, ticks, and labels */}
        <g className="dgm-fade">
          <g className="text-line-strong" stroke="currentColor" strokeWidth="2">
            <line x1="60" y1="30" x2="60" y2="260" />
            <line x1="60" y1="260" x2="490" y2="260" />
          </g>
          <g className="text-subtle" stroke="currentColor" strokeWidth="1.5">
            <line x1="203" y1="260" x2="203" y2="266" />
            <line x1="347" y1="260" x2="347" y2="266" />
            <line x1="488" y1="260" x2="488" y2="266" />
          </g>
          <g fontSize="12" className="text-subtle" fill="currentColor">
            <text x="52" y="67" textAnchor="end">12</text>
            <text x="52" y="264" textAnchor="end">0</text>
            <text x="20" y="150" transform="rotate(-90 20 150)" textAnchor="middle">free chlorine (ppm)</text>
            <text x="72" y="278" textAnchor="middle">0</text>
            <text x="203" y="278" textAnchor="middle">12 h</text>
            <text x="347" y="278" textAnchor="middle">24 h</text>
            <text x="488" y="278" textAnchor="end">36 h</text>
            <text x="275" y="296" textAnchor="middle">hours after shocking</text>
          </g>
        </g>

        {/* safe-to-swim zone (below the CYA-based ceiling) — left half stays
            curve-free, so the label lives there */}
        <g className="dgm-fade" style={animDelay(0.15)}>
          <rect x="60" y="178" width="430" height="82" fill="url(#dgm-safe-zone)" />
          <line x1="60" y1="178" x2="490" y2="178" className="text-brand-blue" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5" />
          <g fontSize="12.5" className="text-brand-blue" fill="currentColor" fontWeight="600">
            <text x="80" y="206">safe to swim below this line —</text>
            <text x="80" y="224">your ceiling, set by your CYA</text>
          </g>
        </g>

        {/* area under the decay curve */}
        <path
          className="dgm-fade"
          style={animDelay(0.9)}
          d="M72 258 L72 63 C 130 92, 200 140, 275 178 C 340 207, 420 221, 488 227 L488 258 Z"
          fill="url(#dgm-fc-area)"
        />

        {/* FC decay curve (draws itself in) */}
        <path
          className="dgm-line text-brand-orange"
          style={animDelay(0.3)}
          pathLength={1}
          d="M72 258 L72 63 C 130 92, 200 140, 275 178 C 340 207, 420 221, 488 227"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text className="dgm-fade text-muted" style={animDelay(0.5)} x="84" y="52" fontSize="12.5" fill="currentColor" fontWeight="600">
          shock level
        </text>

        {/* crossing point: the moment a test says you're clear */}
        <circle className="dgm-pulse text-brand-orange" cx="275" cy="178" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0" />
        <g className="dgm-fade" style={animDelay(1.3)}>
          <circle cx="275" cy="178" r="6.5" className="text-brand-orange" fill="currentColor" />
          <circle cx="275" cy="178" r="2.5" fill="#fff" />
          <line x1="284" y1="169" x2="298" y2="156" className="text-fg" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
          <text x="302" y="152" fontSize="12.5" className="text-fg" fill="currentColor" fontWeight="600">a test confirms it — OK to swim</text>
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-subtle">
        Every pool’s curve is different — sunlight, stabilizer (CYA), and the size of the dose all change how fast
        chlorine falls. That’s why the answer is a <strong>test reading</strong>, not a number of hours.
      </figcaption>
    </figure>
  );
};

/** Safe-swim ceiling scales with stabilizer: ≈40% of CYA (the shock/SLAM level).
 *  Targets match the chlorine calculator's FC table — keep the two in sync. */
const CEILINGS = [
  { cya: '0 (no stabilizer)', ceiling: '5 ppm', target: '1–4 ppm', common: false },
  { cya: '30 ppm', ceiling: '12 ppm', target: '4–6 ppm', common: false },
  { cya: '50 ppm', ceiling: '20 ppm', target: '6–8 ppm', common: true },
  { cya: '70 ppm', ceiling: '28 ppm', target: '8–10 ppm', common: false },
];

const CeilingTable = () => (
  <div className="not-prose my-8">
    <div className="overflow-x-auto rounded-2xl border border-line bg-card elevate">
      <table className="w-full text-[15px] text-left border-collapse">
        <caption className="sr-only">Safe-to-swim free chlorine ceiling and normal target range by stabilizer (CYA) level.</caption>
        <thead>
          <tr className="border-b border-line text-subtle">
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Your CYA</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Safe-swim ceiling</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Normal target</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {CEILINGS.map((row) => (
            <tr key={row.cya} className={row.common ? 'bg-brand-blue/10' : 'transition-colors hover:bg-card-2'}>
              <th scope="row" className="px-4 sm:px-5 py-3.5 font-semibold text-fg whitespace-nowrap">
                {row.cya}
                {row.common && (
                  <span className="ml-2 inline-flex rounded-full border border-brand-blue/30 bg-brand-blue/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-blue align-middle">
                    most common
                  </span>
                )}
              </th>
              <td className="px-4 sm:px-5 py-3.5 text-fg font-semibold tabular-nums">{row.ceiling}</td>
              <td className="px-4 sm:px-5 py-3.5 text-muted tabular-nums">{row.target}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-[11px] text-subtle mt-3 leading-relaxed">
      Ceiling ≈ 40% of CYA — the same shock/SLAM level our calculators use. The unstabilized row is the
      classic “5 ppm rule” (health codes cap operating pools at 10 ppm, assuming no CYA). Full target
      table by CYA is on the chlorine calculator.
    </p>
  </div>
);

/** Typical wait by shock product — assumes a routine dose, not an algae SLAM. */
const WAIT_TIMES = [
  {
    product: 'Liquid chlorine / bleach',
    detail: 'sodium hypochlorite',
    wait: '8–24 hours',
    fast: false,
    note: 'Unstabilized — sunlight burns it off fastest, so it often drops back to safe levels overnight.',
  },
  {
    product: 'Cal-hypo shock',
    detail: 'calcium hypochlorite',
    wait: '8–24 hours',
    fast: false,
    note: 'Make sure every granule has dissolved — undissolved cal-hypo on the floor can bleach liners and burn skin.',
  },
  {
    product: 'Dichlor shock',
    detail: 'stabilized granular',
    wait: '8–24 hours, often longer',
    fast: false,
    note: 'Adds CYA with every dose, which shields chlorine from the sun — levels stay elevated longer.',
  },
  {
    product: 'Non-chlorine shock',
    detail: 'potassium monopersulfate (MPS)',
    wait: '~15 minutes',
    fast: true,
    note: 'Oxidizes contaminants without raising free chlorine — most labels clear swimming after 15 minutes of circulation.',
  },
];

const WaitTimeTable = () => (
  <div className="not-prose my-8">
    <div className="overflow-x-auto rounded-2xl border border-line bg-card elevate">
      <table className="w-full text-[15px] text-left border-collapse">
        <caption className="sr-only">Typical wait before swimming after each type of pool shock.</caption>
        <thead>
          <tr className="border-b border-line text-subtle">
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Shock type</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Typical wait</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold">Worth knowing</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {WAIT_TIMES.map((row) => (
            <tr key={row.product} className="transition-colors hover:bg-card-2">
              <th scope="row" className="px-4 sm:px-5 py-3.5 font-semibold text-fg whitespace-nowrap align-top">
                {row.product}
                <span className="block font-normal text-subtle text-xs mt-0.5">{row.detail}</span>
              </th>
              <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap align-top">
                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[13px] font-semibold tabular-nums ${
                    row.fast ? 'bg-brand-blue/10 text-brand-blue' : 'bg-brand-orange/10 text-brand-orange-dark'
                  }`}
                >
                  {row.wait}
                </span>
              </td>
              <td className="px-4 sm:px-5 py-3.5 align-top text-muted text-[14px] leading-relaxed">{row.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-[11px] text-subtle mt-3 leading-relaxed">
      Typical waits assume a routine maintenance shock. A heavy algae treatment (the SLAM method) holds chlorine at
      shock level for days — after one, expect 1–3+ days before readings return to a swimmable range. Always confirm
      with a test.
    </p>
  </div>
);

type Check = { icon: LucideIcon; title: string; body: ReactNode };
const CHECKS: Check[] = [
  {
    icon: FlaskConical,
    title: 'Chlorine below your ceiling',
    body: (
      <>Test the water — strips work, a drop kit is better. Safe means free chlorine at or below{' '}
      <strong>~40% of your CYA</strong> (5 ppm if you run no stabilizer); comfortable means back in your
      normal target range. Still high? Re-test in a few hours.</>
    ),
  },
  {
    icon: Eye,
    title: 'You can see the bottom',
    body: (
      <>Shock is usually a response to cloudy or green water. Water you can’t see through is a{' '}
      <strong>drowning hazard</strong> no matter what the chemistry says — wait until the main drain is clearly
      visible from the deck.</>
    ),
  },
  {
    icon: RefreshCw,
    title: 'The pump has circulated it',
    body: (
      <>Run the pump continuously after shocking — at least one{' '}
      <Link to="/pool-pump-runtime-calculator">full turnover</Link> — so the dose is mixed evenly and your test
      reading reflects the whole pool, not a concentrated pocket near the return.</>
    ),
  },
];

const CheckList = () => {
  const { ref, cls } = useInViewAnim<HTMLDivElement>();
  return (
    <div ref={ref} className={`not-prose my-8 ${cls}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        {CHECKS.map((check, i) => {
          const Icon = check.icon;
          return (
            <div
              key={check.title}
              className="dgm-fade rounded-2xl border border-line bg-card p-4 sm:p-5 elevate transition-colors hover:border-line-strong"
              style={animDelay(i * 0.15)}
            >
              <div className="flex items-center gap-2.5 mb-2.5">
                <span className="grid place-items-center w-9 h-9 rounded-full bg-gradient-to-br from-brand-blue-light to-brand-blue text-white font-display font-bold text-sm shadow-sm shadow-brand-blue/30 ring-1 ring-white/15">
                  {i + 1}
                </span>
                <span aria-hidden className="grid place-items-center w-8 h-8 rounded-lg bg-brand-orange/10 text-brand-orange">
                  <Icon className="w-[18px] h-[18px]" />
                </span>
              </div>
              <h3 className="font-display font-bold text-fg text-[15px] mb-1.5">{check.title}</h3>
              <p className="text-muted text-[14px] leading-relaxed">{check.body}</p>
            </div>
          );
        })}
      </div>
      <p
        className="dgm-fade mt-3 flex items-center justify-center gap-2 rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-3 text-sm font-semibold text-fg"
        style={animDelay(0.5)}
      >
        <CheckCircle2 className="w-4 h-4 text-brand-blue-light shrink-0" />
        All three pass? You’re good to get in.
      </p>
    </div>
  );
};

const FAQS = [
  {
    q: 'Can I swim 12 hours after shocking my pool?',
    a: 'Usually — but verify with a test instead of the clock. After a routine shock dose, free chlorine in an outdoor pool often falls back into normal range within 8–24 hours, but sunlight, stabilizer (CYA), and the size of the dose all change that. If a test shows free chlorine at or below about 40% of your CYA (or 5 ppm or less in a pool with no stabilizer) and the water is clear, swimming at 12 hours is fine; if it still reads above that, stay out and re-test in a few hours.',
  },
  {
    q: 'What happens if you swim in a pool too soon after shocking it?',
    a: 'At typical shock levels the result is irritation, not poisoning: stinging red eyes, itchy or dried-out skin, brittle hair, bleached swimwear, and sometimes coughing or wheezing in sensitive swimmers. Get out, rinse off in fresh water, and wash the swimsuit. The bigger danger is visibility — shock is usually used on cloudy or green water, and water you can’t see through is a drowning risk regardless of the chemistry.',
  },
  {
    q: 'How long after non-chlorine shock can you swim?',
    a: 'About 15 minutes. Non-chlorine shock (potassium monopersulfate, sold as “oxidizing shock” or MPS) doesn’t raise free chlorine — it oxidizes contaminants directly — so most labels clear swimming after roughly 15 minutes of circulation, just long enough for the granules to dissolve and disperse. Check your specific product’s label.',
  },
  {
    q: 'Is it safe to swim with chlorine at 10 ppm?',
    a: 'It depends on your stabilizer. With CYA at 30 ppm or more, 10 ppm of free chlorine is below the safe-swim ceiling (about 40% of CYA) — most of it is buffered by the stabilizer and inactive, so it’s far gentler than the number suggests. In an unstabilized pool (indoor pools, hot tubs), 10 ppm is the absolute maximum — the CDC’s Model Aquatic Health Code caps operating pools there — so stay out until it falls to about 5 ppm or below.',
  },
  {
    q: 'Should the pump run while I wait?',
    a: 'Yes — run it continuously from the moment you add shock until levels are back to normal. Circulation spreads the chlorine evenly so there are no concentrated pockets near the return, helps the filter remove whatever the shock just killed or oxidized, and makes your follow-up test reading represent the whole pool. A full turnover takes most pools 6–8 hours.',
  },
  {
    q: 'If I shock at night, can I swim the next morning?',
    a: 'Often, yes — and dusk is the right time to shock anyway, because sunlight burns off unstabilized chlorine before it can do its work. A routine dose added at night has usually dropped back near normal range by morning. But it’s still test-first: a heavy dose, high CYA, or cool overcast weather can keep free chlorine elevated well past sunrise.',
  },
];

const SOURCES = [
  { label: 'CDC — Healthy Swimming (pool chemical safety)', url: 'https://www.cdc.gov/healthy-swimming/' },
  { label: 'CDC — Model Aquatic Health Code (free chlorine limits)', url: 'https://www.cdc.gov/model-aquatic-health-code/' },
  { label: 'Trouble Free Pool — community wiki (SLAM method)', url: 'https://www.troublefreepool.com/wiki/' },
];

export const SwimAfterShockGuide = () => (
  <GuideLayout
    title={guide.title}
    metaTitle="How Long After Shocking a Pool Can You Swim? (8–24 Hours)"
    description="How long after shocking a pool can you swim? Usually 8–24 hours — but the safe chlorine level depends on your stabilizer (CYA), not a flat 5 ppm."
    path={guide.path}
    updated={guide.updated}
    readMinutes={7}
    faqs={FAQS}
    sources={SOURCES}
    cta={{
      to: '/pool-shock-calculator',
      label: 'Shocking the pool? Dose it exactly.',
      sub: 'The shock calculator gives the precise amount of liquid chlorine or cal-hypo for your pool — no guessing, no overdosing.',
    }}
  >
    <p>
      How long after shocking a pool can you swim? The honest answer is a{' '}
      <strong>test reading, not a number of hours</strong>: it’s safe to swim once free chlorine has
      fallen back below the safe ceiling for your stabilizer level — about <strong>40% of your CYA</strong>,
      or 5 ppm if you run no stabilizer — and the water is clear. For a typical chlorine shock that takes
      about <strong>8–24 hours</strong>; for non-chlorine (MPS) shock, only about{' '}
      <strong>15 minutes</strong>. Here’s why the range is so wide — and how to know for sure instead
      of guessing.
    </p>

    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-brand-blue/40 bg-gradient-to-br from-brand-blue/15 via-transparent to-brand-orange/10 elevate">
      <div className="p-5 sm:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 mb-3">
          <Clock className="w-3.5 h-3.5 text-brand-blue-light" />
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-brand-blue-light">Quick answer</span>
        </span>
        <p className="text-fg text-[15px] sm:text-base leading-relaxed">
          After a chlorine-based shock, swim once a test shows free chlorine back at or below{' '}
          <strong className="font-semibold">~40% of your CYA</strong> (e.g. 20 ppm at CYA 50 — or 5 ppm in
          a pool with no stabilizer) and you can see the pool floor. When in doubt, test — never swim on
          the clock alone.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line border-t border-line bg-card-2">
        {[
          { icon: Clock, value: '8–24 h', label: 'typical wait after a chlorine shock' },
          { icon: ShieldCheck, value: '≈40% of CYA', label: 'your safe-swim chlorine ceiling' },
          { icon: Zap, value: '15 min', label: 'after non-chlorine (MPS) shock' },
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

    <h2>How long should you wait to swim after shocking?</h2>
    <p>
      “Shocking” just means raising free chlorine far above its normal level — high enough to kill algae
      or burn off chloramines. The water becomes safe again once that spike falls back below a safe
      ceiling, and here’s the part almost every “wait 24 hours” article gets wrong:{' '}
      <strong>the ceiling depends on your stabilizer (CYA) level, not a universal number.</strong>
    </p>
    <p>
      CYA buffers chlorine: it holds most of the free chlorine in an inactive reserve, so only a small
      fraction is actually working on swimmers’ skin and eyes at any moment. That’s why 10 ppm in a
      stabilized backyard pool is gentler than 4 ppm in an unstabilized indoor pool. The familiar “wait
      until 5 ppm” rule comes from health codes written for <em>unstabilized</em> commercial pools — the
      CDC’s Model Aquatic Health Code caps operating pools at 10 ppm and assumes no CYA. Applied to a
      stabilized pool it isn’t just conservative, it’s wrong: with CYA at 50, your <em>normal</em>{' '}
      chlorine target is 6–8 ppm, so “wait for 5” would mean waiting until your pool is under-chlorinated.
    </p>
    <p>
      The accurate rule — the same chemistry behind our{' '}
      <Link to="/pool-shock-calculator">shock calculator</Link> — is that water is safe to swim once free
      chlorine is at or below about <strong>40% of your CYA</strong> (the shock ceiling), and back to
      everyday comfort once it’s in the normal target range for your{' '}
      <Link to="/chlorine-calculator">chlorine level</Link>:
    </p>

    <CeilingTable />
    <p>
      The familiar “wait 24 hours” advice isn’t wrong, it’s just a worst-case blanket. Depending on the
      dose, the sun, and your stabilizer level, the same pool might be swimmable in 6 hours — or still
      too hot after two days. The chart below is what’s actually happening:
    </p>

    <DecayDiagram />

    <h2>Swim wait times by shock type</h2>
    <p>
      The product you used sets the starting point. Chlorine-based shocks (liquid chlorine, cal-hypo,
      dichlor) all spike free chlorine and need the full decay wait; non-chlorine shock doesn’t raise
      chlorine at all, which is why its wait is measured in minutes.
    </p>

    <WaitTimeTable />

    <h2>When is it safe to swim again? The three checks</h2>
    <p>
      Pass all three and the pool is genuinely ready — not “probably fine,” but verified:
    </p>

    <CheckList />

    <h2>Why your wait time varies: sun, stabilizer, and dose</h2>
    <p>
      Three things control how fast free chlorine falls back to a swimmable level:
    </p>

    <h3>1. The size of the shock dose</h3>
    <p>
      A routine weekly shock might lift free chlorine to 10–12 ppm; an algae cleanup holds it far
      higher, for days. Bigger spike, longer decay. Dosing right in the first place is half the battle —
      the <Link to="/pool-shock-calculator">shock calculator</Link> gives the exact amount instead of
      “a bag per 10,000 gallons.”
    </p>

    <h3>2. Sunlight vs. stabilizer (CYA)</h3>
    <p>
      UV destroys chlorine fast: an unstabilized outdoor pool in full sun can shed half its free
      chlorine in a few hours. Cyanuric acid (CYA) shields chlorine from UV — great for everyday
      sanitizing, but it also means a shocked pool with high CYA stays elevated much longer. More on
      that trade-off in our <Link to="/guides/cyanuric-acid-and-chlorine">CYA &amp; chlorine guide</Link>.
    </p>

    <h3>3. What the chlorine is fighting</h3>
    <p>
      A clean pool just decays back down. A pool full of algae <em>consumes</em> chlorine — readings can
      crash and then need re-dosing, which restarts the clock. That’s why{' '}
      <Link to="/guides/how-to-fix-a-green-pool">fixing a green pool</Link> takes days, not hours.
    </p>

    <h2>What happens if you swim too soon after shocking?</h2>
    <p>
      Don’t panic. At residential shock levels, brief exposure causes <strong>irritation, not injury</strong>:
      red stinging eyes, itchy skin, a chlorine smell that clings, faded swimwear. Have them get out,
      rinse off thoroughly in fresh water, and rinse swimsuits before the chlorine sets in the fabric.
      Anyone with asthma or breathing discomfort after swimming in heavily chlorinated water should get
      fresh air and medical advice if symptoms persist. Then test the pool — and let the number, not
      impatience, decide round two.
    </p>
  </GuideLayout>
);
