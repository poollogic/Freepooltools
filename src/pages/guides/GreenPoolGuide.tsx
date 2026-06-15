import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  FlaskConical,
  Calculator,
  Moon,
  RefreshCw,
  Filter,
  CheckCircle2,
  AlertTriangle,
  type LucideIcon,
} from 'lucide-react';
import { GuideLayout } from '@/components/GuideLayout';
import { GUIDES } from '@/data/guides';
import { useInViewAnim, animDelay } from '@/lib/useInViewAnim';

const guide = GUIDES.find((g) => g.slug === 'how-to-fix-a-green-pool')!;

/** Why one big dose fails: a single dump decays to zero and the algae regrows,
 *  while SLAM re-doses to hold free chlorine at shock level until the kill is done. */
const SlamDiagram = () => {
  const { ref, cls } = useInViewAnim();
  return (
    <figure ref={ref} className={`not-prose my-8 rounded-2xl border border-line bg-card-2 p-4 sm:p-6 ${cls}`}>
      <svg
        viewBox="0 0 520 300"
        className="w-full h-auto"
        role="img"
        aria-label="Chart comparing two ways to shock a green pool over four days. A single big dose of chlorine decays to zero within a day and the algae regrows. The SLAM method re-doses two to three times a day to hold free chlorine at shock level until the algae is dead."
      >
        {/* axes, ticks, and labels */}
        <g className="dgm-fade">
          <g className="text-line-strong" stroke="currentColor" strokeWidth="2">
            <line x1="60" y1="30" x2="60" y2="260" />
            <line x1="60" y1="260" x2="490" y2="260" />
          </g>
          <g className="text-subtle" stroke="currentColor" strokeWidth="1.5">
            <line x1="176" y1="260" x2="176" y2="266" />
            <line x1="280" y1="260" x2="280" y2="266" />
            <line x1="384" y1="260" x2="384" y2="266" />
            <line x1="478" y1="260" x2="478" y2="266" />
          </g>
          <g fontSize="12" className="text-subtle" fill="currentColor">
            <text x="20" y="150" transform="rotate(-90 20 150)" textAnchor="middle">free chlorine (ppm)</text>
            <text x="72" y="278" textAnchor="middle">day 0</text>
            <text x="176" y="278" textAnchor="middle">day 1</text>
            <text x="280" y="278" textAnchor="middle">day 2</text>
            <text x="384" y="278" textAnchor="middle">day 3</text>
            <text x="478" y="278" textAnchor="middle">day 4</text>
          </g>
        </g>

        {/* shock level line */}
        <g className="dgm-fade" style={animDelay(0.15)}>
          <line x1="60" y1="120" x2="490" y2="120" className="text-fg" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5" strokeOpacity="0.55" />
          <text x="480" y="140" textAnchor="end" fontSize="12" className="text-muted" fill="currentColor" fontWeight="600">
            shock level (≈40% of CYA)
          </text>
        </g>

        {/* act one — the single dump fails */}
        <path
          className="dgm-fade text-brand-orange"
          style={animDelay(0.35)}
          d="M80 250 L80 84 C 110 130, 140 200, 180 236 C 230 252, 380 252, 488 250"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <text className="dgm-fade text-brand-orange" style={animDelay(0.6)} x="200" y="228" fontSize="12.5" fill="currentColor" fontWeight="600">
          one big dump: gone in a day, algae regrows
        </text>

        {/* act two — the SLAM sawtooth draws in and holds */}
        <path
          className="dgm-line text-brand-blue-light"
          style={animDelay(0.9)}
          pathLength={1}
          d="M72 250 L72 80 C 100 100, 125 125, 148 138 L148 84 C 180 102, 210 124, 234 136 L234 88 C 270 102, 300 118, 326 128 L326 92 C 370 100, 420 106, 488 108"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text className="dgm-fade text-brand-blue-light" style={animDelay(1.1)} x="100" y="58" fontSize="12.5" fill="currentColor" fontWeight="600">
          SLAM: re-dose to hold the level until the kill is done
        </text>

        {/* re-dose arrows pop in as the line reaches each dip */}
        <g className="text-brand-blue-light" fill="currentColor">
          <path className="dgm-fade" style={animDelay(1.3)} d="M143 110 l5 -10 l5 10 z" />
          <path className="dgm-fade" style={animDelay(1.55)} d="M229 112 l5 -10 l5 10 z" />
          <path className="dgm-fade" style={animDelay(1.8)} d="M321 112 l5 -10 l5 10 z" />
        </g>

        {/* endpoint: the level finally holds */}
        <circle className="dgm-pulse text-brand-blue-light" style={animDelay(2.5)} cx="488" cy="108" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0" />
        <g className="dgm-fade" style={animDelay(2.15)}>
          <circle cx="488" cy="108" r="6" className="text-brand-blue-light" fill="currentColor" />
          <circle cx="488" cy="108" r="2.2" fill="#fff" />
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-subtle">
        The #1 reason green pools stay green: algae <strong>consumes</strong> chlorine, so a single shock
        crashes within hours. Holding the level with repeat doses is what finishes the bloom off.
      </figcaption>
    </figure>
  );
};

/** "How long will it take" — by starting color. Targets the time-to-clear queries. */
const TIMELINE = [
  {
    stage: 'Teal / light green',
    look: 'Water tinted but you can still see the bottom',
    time: '1–2 days',
  },
  {
    stage: 'Green',
    look: 'Floor hazy or invisible in the deep end',
    time: '2–4 days',
  },
  {
    stage: 'Swamp green-black',
    look: 'Can’t see the first step; debris on the bottom',
    time: '4–7+ days',
  },
];

const TimelineTable = () => (
  <div className="not-prose my-8">
    <div className="overflow-x-auto rounded-2xl border border-line bg-card elevate">
      <table className="w-full text-[15px] text-left border-collapse">
        <caption className="sr-only">Typical time to clear a green pool by how green the water is when you start.</caption>
        <thead>
          <tr className="border-b border-line text-subtle">
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Starting point</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold">What it looks like</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Time to clear</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {TIMELINE.map((row) => (
            <tr key={row.stage}>
              <th scope="row" className="px-4 sm:px-5 py-3.5 font-semibold text-fg whitespace-nowrap align-top">{row.stage}</th>
              <td className="px-4 sm:px-5 py-3.5 align-top text-muted text-[14px] leading-relaxed">{row.look}</td>
              <td className="px-4 sm:px-5 py-3.5 whitespace-nowrap align-top text-muted font-semibold tabular-nums">{row.time}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-[11px] text-subtle mt-3 leading-relaxed">
      Times assume you hold the shock level (re-testing and re-dosing 2–3× a day) with the filter running
      24/7. The kill is usually fast — most of the wait is the <em>filter</em> removing dead algae, so a
      struggling or undersized filter stretches every estimate.
    </p>
  </div>
);

type Step = { icon: LucideIcon; title: string; body: ReactNode };
const STEPS: Step[] = [
  {
    icon: Leaf,
    title: 'Net out debris and brush everything',
    body: (
      <>Scoop leaves and gunk with a leaf rake — organic debris shelters algae and eats chlorine. Then
      brush the walls, steps, and corners hard. Brushing breaks the algae’s protective layer loose into
      open water, where chlorine can actually reach it.</>
    ),
  },
  {
    icon: FlaskConical,
    title: 'Test CYA and free chlorine',
    body: (
      <>Your stabilizer (CYA) level sets the target: the algae shock level is about <strong>40% of your
      CYA</strong>, with a floor around 12 ppm. If CYA tests above ~90–100 ppm, partially drain and refill
      first — otherwise the shock level is impractically high. The <Link to="/cya-calculator/">CYA
      calculator</Link> turns your reading into exact gallons to swap.</>
    ),
  },
  {
    icon: Calculator,
    title: 'Get your exact chlorine dose',
    body: (
      <>No guessing, no “a bag per 10,000 gallons.” Enter your volume, CYA, and current chlorine into the{' '}
      <Link to="/pool-shock-calculator/">pool shock calculator</Link> and it gives the precise amount of{' '}
      <strong>liquid chlorine or cal-hypo</strong> to hit shock level. Never shock with stabilized
      trichlor/dichlor — they push CYA even higher with every dose.</>
    ),
  },
  {
    icon: Moon,
    title: 'Dose at dusk, pump on 24/7',
    body: (
      <>Add the chlorine in the evening so sunlight doesn’t burn it off before it can work, and run the
      pump <strong>around the clock</strong> from now until the water is clear. Circulation carries
      chlorine to the algae and dead algae to the filter.</>
    ),
  },
  {
    icon: RefreshCw,
    title: 'Re-test and re-dose 2–3 times a day',
    body: (
      <>This is the step everyone skips — and why “I shocked it and it’s still green.” Live algae{' '}
      <strong>consumes</strong> chlorine, so the level crashes within hours. Test morning, afternoon, and
      evening, and re-dose back up to shock level every time. Hold it there until the green is gone.</>
    ),
  },
  {
    icon: Filter,
    title: 'Brush daily and keep the filter breathing',
    body: (
      <>Brush the whole pool once a day to re-expose anything settling. Dead algae clogs filters fast:
      backwash sand/DE or rinse cartridges whenever the pressure gauge reads ~8–10 psi over its clean
      starting point. A choked filter is the most common reason a “killed” pool{' '}
      <Link to="/guides/cloudy-pool-water/">stays cloudy</Link>.</>
    ),
  },
  {
    icon: CheckCircle2,
    title: 'Confirm the kill, then let it drift down',
    body: (
      <>You’re done when three things are true: the water is <strong>clear</strong>, free chlorine holds
      overnight (loses ≤1 ppm with the pump running and no sun), and combined chlorine is ≤0.5 ppm. Then
      stop dosing and let chlorine fall naturally — since the shock level was set at ~40% of your CYA,
      you’re already at the safe-swim ceiling, so it’s swimmable as soon as it dips below that (here’s{' '}
      <Link to="/guides/how-long-after-shocking-pool-can-you-swim/">exactly when it’s safe</Link>).</>
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

const FAQS = [
  {
    q: 'How long does it take to clear a green pool?',
    a: 'Most green pools clear in 2–4 days if you hold free chlorine at shock level (re-dosing 2–3 times a day) with the filter running 24/7. A light teal tint can clear in 1–2 days; a black-green swamp can take a week or more. Anyone promising a dark green pool fixed in 24 hours with one product is selling something — the chlorine kill is fast, but filtering out the dead algae takes days.',
  },
  {
    q: 'Can you swim in a green pool?',
    a: 'No. Green water means the sanitizer failed, so along with algae the pool can carry bacteria you can’t see — and cloudy green water is a drowning hazard because a swimmer below the surface is invisible. Wait until the water is clear and free chlorine is back at or below the safe level for your CYA — about 40% of your stabilizer reading, or 5 ppm in an unstabilized pool.',
  },
  {
    q: 'Why is my pool still green after shocking it?',
    a: 'Almost always one of three things: you dosed once and stopped (algae eats through a single shock in hours — you have to re-dose to hold the level), the dose was set without knowing your CYA (high CYA demands a much higher shock level), or you shocked with stabilized dichlor/trichlor, which raises CYA further and makes each round less effective. Test CYA, set the right level, and hold it.',
  },
  {
    q: 'Do I need algaecide to fix a green pool?',
    a: 'No — chlorine at shock level is what kills an active bloom; algaecide is a supplement at best. If you want one as a preventative afterward, use Polyquat 60. Avoid copper-based algaecides: copper stains surfaces, turns blond hair green, and can tint the water itself green.',
  },
  {
    q: 'Should I just drain a green pool and start over?',
    a: 'Almost never — even swamp-green pools clear with the shock-and-hold process, and fresh water still has to be balanced and chlorinated anyway. The exception is high CYA: above roughly 90–100 ppm, partially drain and refill first so the shock level is reachable. Never fully drain an in-ground pool; an empty shell can be cracked or floated by groundwater.',
  },
  {
    q: 'Why did my pool turn green overnight?',
    a: 'Free chlorine hit zero — an empty chlorinator or skipped doses, heavy rain diluting the water, a big bather load, or high CYA quietly disabling the chlorine you did have. In 80°F+ summer water an algae bloom can go from invisible to visibly green in a day. The fix for “never again” is keeping free chlorine matched to your CYA level.',
  },
];

const SOURCES = [
  { label: 'Trouble Free Pool — SLAM method (community wiki)', url: 'https://www.troublefreepool.com/wiki/' },
  { label: 'CDC — Healthy Swimming (recreational water illness)', url: 'https://www.cdc.gov/healthy-swimming/' },
  { label: 'PHTA — Pool & Hot Tub Alliance', url: 'https://www.phta.org/' },
];

export const GreenPoolGuide = () => (
  <GuideLayout
    title={guide.title}
    metaTitle="How to Fix a Green Pool Fast — Clear Green Water in 2–4 Days"
    description="How to fix a green pool fast: kill the algae with chlorine at the right shock level for your CYA, hold it until the water clears. Exact doses, 2–4 days."
    path={guide.path}
    updated={guide.updated}
    faqs={FAQS}
    sources={SOURCES}
    cta={{
      to: '/pool-shock-calculator/',
      label: 'Get your exact shock dose',
      sub: 'Enter your gallons and CYA — the calculator gives the precise amount of liquid chlorine or cal-hypo to hit shock level.',
    }}
  >
    <p>
      A green pool is an algae bloom: free chlorine fell below what your stabilizer (CYA) level demands,
      and algae took over. The fix isn’t a magic potion — it’s <strong>chlorine, raised to the right
      shock level for your CYA and held there until the algae is dead</strong>. Done properly, most pools
      go from green to clear in <strong>2–4 days</strong>. Here’s the exact process, with real doses
      instead of guesswork.
    </p>

    <div className="not-prose my-6 flex items-start gap-3 rounded-2xl border border-brand-blue/40 bg-brand-blue/10 p-4 sm:p-5">
      <AlertTriangle className="w-6 h-6 text-brand-blue-light shrink-0 mt-0.5" />
      <div className="text-[14px] sm:text-[15px] text-fg leading-relaxed">
        <strong>Quick answer:</strong> test your CYA → raise free chlorine to <strong>~40% of CYA</strong>{' '}
        (the shock level) with liquid chlorine or cal-hypo → brush, run the filter 24/7, and{' '}
        <strong>re-dose 2–3× a day to hold that level</strong> until the water is clear and chlorine holds
        overnight. One single dump of shock will not fix a green pool.
      </div>
    </div>

    <h2>Why is my pool green?</h2>
    <p>
      Algae spores land in every pool, every day — wind, rain, fill water. They only bloom when nothing
      kills them, which means one thing: <strong>your free chlorine spent time at or near zero</strong>{' '}
      relative to your CYA. The usual ways that happens: the chlorinator or feeder ran empty, a storm
      diluted and contaminated the water, a heat wave plus heavy swimming burned chlorine off faster than
      it was replaced, or CYA crept so high (from years of trichlor tablets) that a “normal” chlorine
      reading was effectively doing nothing. That last trap is the sneakiest — our{' '}
      <Link to="/guides/cyanuric-acid-and-chlorine/">CYA &amp; chlorine guide</Link> explains why the same
      3 ppm that protects one pool is useless in another.
    </p>

    <h2>What you need before you start</h2>
    <ul>
      <li>
        <strong>Liquid chlorine (or cal-hypo).</strong> Unstabilized, fast, and it adds no CYA. Skip
        “green-to-clean” miracle products and never shock with trichlor/dichlor tablets or granules.
      </li>
      <li>
        <strong>A test kit that reads free chlorine and CYA.</strong> A drop-based (FAS-DPD) kit is worth
        it here — strips max out exactly in the range you’ll be working in.
      </li>
      <li>
        <strong>A pool brush and leaf rake.</strong> The mechanical half of the job matters as much as the
        chemical half.
      </li>
      <li>
        <strong>A working pump and filter.</strong> Chlorine kills the algae; the filter is what actually
        removes it. It will run nonstop for days — make sure it’s up to it.
      </li>
    </ul>

    <h2>How to clear a green pool, step by step</h2>
    <p>
      Seven steps. The two that decide success: setting the shock level from your <strong>actual CYA</strong>{' '}
      (step 2–3) and <strong>holding</strong> that level instead of dosing once (step 5).
    </p>

    <StepList />

    <h2>Why one big shock doesn’t work</h2>
    <p>
      Live algae is a chlorine-consuming machine. Dump in a triple dose tonight and by tomorrow afternoon
      it can read near zero — the algae you didn’t kill keeps eating, recovers, and you’re back where you
      started, minus a bucket of shock. That’s the whole idea behind the SLAM method (<em>shock, level,
      and maintain</em>): the dose matters less than the <strong>holding</strong>.
    </p>

    <SlamDiagram />

    <h2>How long does it take to clear a green pool?</h2>
    <p>
      Honest ranges, assuming you hold the level and filter around the clock:
    </p>

    <TimelineTable />

    <h2>Pool green but chlorine is high?</h2>
    <p>
      The most-asked variant of this problem — a green pool that tests fine. Three causes, in order of
      likelihood:
    </p>

    <h3>1. Your test is maxed out, not your chlorine</h3>
    <p>
      Test strips and basic DPD kits bleach out at high chlorine and can read <em>zero or normal</em> when
      free chlorine is actually sky-high — or vice versa. If a reading doesn’t match what you’ve added,
      dilute the sample 1:1 with distilled water, re-test, and double the result (or use a FAS-DPD kit,
      which handles shock-level readings properly).
    </p>

    <h3>2. The chlorine is there, but CYA has it handcuffed</h3>
    <p>
      5 ppm of free chlorine sounds healthy — but with CYA at 100, almost none of it is active. Stabilizer
      binds chlorine, and only the unbound fraction kills algae. This is why the shock level scales with
      CYA, and why a pool can be green at chlorine readings that look “high.” If your CYA is over ~90–100,
      lower it with a partial <Link to="/guides/how-to-drain-a-pool-with-a-garden-hose/">drain and
      refill</Link> before fighting the algae.
    </p>

    <h3>3. Clear green water? That’s metals, not algae</h3>
    <p>
      If the water is green but <strong>transparent</strong> — you can see the bottom through green-tinted
      water, often right after shocking — the culprit is usually dissolved copper (from well water,
      copper-based algaecide, or a corroded heat exchanger) oxidizing, not algae. More chlorine makes it
      worse, not better. The fix is a metal sequestrant and finding the copper source. Algae-green is
      cloudy or murky; copper-green is clear.
    </p>

    <h2>How to keep your pool from turning green again</h2>
    <p>
      Algae prevention is one sentence: <strong>keep free chlorine matched to your CYA, all the time.</strong>{' '}
      In practice that means testing a couple of times a week in summer, knowing your CYA (re-test it
      monthly — every trichlor tablet raises it), and dosing with the{' '}
      <Link to="/chlorine-calculator/">chlorine calculator</Link> instead of habit. Make sure the pump runs
      long enough for a <Link to="/pool-pump-runtime-calculator/">full daily turnover</Link>, and brush the
      spots circulation misses — steps, corners, behind ladders — weekly. A pool that holds 3–4 ppm against
      a CYA of 40 simply doesn’t turn green. And if chlorine keeps vanishing even though the water looks
      clear, diagnose it before the bloom shows up — see{' '}
      <Link to="/guides/why-wont-my-pool-hold-chlorine/">why your pool won’t hold chlorine</Link>.
    </p>
  </GuideLayout>
);
