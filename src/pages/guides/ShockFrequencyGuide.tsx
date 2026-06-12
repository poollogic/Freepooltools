import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Moon,
  FlaskConical,
  Users,
  CloudRain,
  Droplets,
  Leaf,
  CalendarCheck,
  type LucideIcon,
} from 'lucide-react';
import { GuideLayout } from '@/components/GuideLayout';
import { GUIDES } from '@/data/guides';
import { useInViewAnim, animDelay } from '@/lib/useInViewAnim';
import { useShareableState, codecs, type ShareSchema } from '@/lib/useShareableState';

const guide = GUIDES.find((g) => g.slug === 'how-often-to-shock-your-pool')!;

/* ---- interactive: personal shock schedule (state shared via URL) ---- */

type PlanState = {
  use: 'light' | 'typical' | 'heavy';
  tests: 'rarely' | 'often';
  kind: 'chlorine' | 'salt';
};

const PLAN_SCHEMA = {
  use: { param: 'use', ...codecs.oneOf(['light', 'typical', 'heavy'] as const) },
  tests: { param: 'test', ...codecs.oneOf(['rarely', 'often'] as const) },
  kind: { param: 'kind', ...codecs.oneOf(['chlorine', 'salt'] as const) },
} satisfies ShareSchema<PlanState>;

const planFor = (s: PlanState): { headline: string; body: string } => {
  if (s.tests === 'often') {
    return s.kind === 'salt'
      ? {
          headline: 'Triggers only',
          body: 'Your testing habit replaces the calendar, and the salt generator handles day-to-day chlorine. Use boost mode after heavy use; shock manually only for combined chlorine at 0.5 ppm or visible algae.',
        }
      : {
          headline: 'Triggers only',
          body: 'Your testing habit replaces the calendar. Keep free chlorine matched to your CYA and shock only on the six triggers below — many owners go a whole season on just an opening shock plus the odd storm.',
        };
  }
  if (s.kind === 'salt') {
    return {
      headline: 'Boost mode + triggers',
      body: 'Run the generator’s boost/super-chlorinate after parties, storms, and heatwaves; shock manually when combined chlorine hits 0.5 ppm or anything looks off. A fixed calendar adds little for SWG pools.',
    };
  }
  if (s.use === 'heavy') {
    return {
      headline: 'Weekly',
      body: 'Daily swimmers plus summer heat consume chlorine fast — a weekly dusk shock keeps chloramines and early algae from gaining ground. Re-test between shocks whenever you can.',
    };
  }
  if (s.use === 'typical') {
    return {
      headline: 'Every 1–2 weeks',
      body: 'The standard in-season rhythm. Shock at dusk, lean toward weekly in the hottest stretch, and jump on any of the six triggers below regardless of the calendar.',
    };
  }
  return {
    headline: 'Every 2–4 weeks',
    body: 'A lightly used pool in mild weather has low chlorine demand — shock monthly-ish, or simply on triggers. Put the savings toward a good drop-based test kit.',
  };
};

const PICKER_QUESTIONS: { key: keyof PlanState; label: string; options: { value: string; label: string }[] }[] = [
  {
    key: 'use',
    label: 'How busy is the pool?',
    options: [
      { value: 'light', label: 'Light use' },
      { value: 'typical', label: 'Typical' },
      { value: 'heavy', label: 'Daily swimmers' },
    ],
  },
  {
    key: 'tests',
    label: 'How often do you test the water?',
    options: [
      { value: 'rarely', label: 'Rarely' },
      { value: 'often', label: '2–3× a week' },
    ],
  },
  {
    key: 'kind',
    label: 'Pool type',
    options: [
      { value: 'chlorine', label: 'Chlorine' },
      { value: 'salt', label: 'Saltwater (SWG)' },
    ],
  },
];

const PlanPicker = () => {
  const { state, set } = useShareableState<PlanState>(
    { use: 'typical', tests: 'rarely', kind: 'chlorine' },
    PLAN_SCHEMA,
  );
  const plan = planFor(state);
  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-card elevate">
      <div className="p-5 sm:p-6 space-y-4">
        {PICKER_QUESTIONS.map((q) => (
          <div key={q.key}>
            <p className="text-xs font-semibold uppercase tracking-wide text-subtle mb-2">{q.label}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={q.label}>
              {q.options.map((opt) => {
                const active = state[q.key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => set(q.key, opt.value as PlanState[typeof q.key])}
                    className={`px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-brand-blue border-brand-blue text-white shadow-sm shadow-brand-blue/25'
                        : 'bg-card-2 border-line text-muted hover:border-line-strong hover:text-fg'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-line bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-subtle mb-1.5">Your schedule</p>
        <p className="font-display font-bold text-fg text-2xl leading-tight mb-2">{plan.headline}</p>
        <p className="text-muted text-[14px] sm:text-[15px] leading-relaxed">
          {plan.body}{' '}
          <Link to="/pool-shock-calculator" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
            Get the exact dose →
          </Link>
        </p>
      </div>
    </div>
  );
};

/* ---- infographic: what combined chlorine is (the 0.5 ppm trigger) ---- */

const CombinedChlorineDiagram = () => {
  const { ref, cls } = useInViewAnim();
  return (
    <figure ref={ref} className={`not-prose my-8 rounded-2xl border border-line bg-card-2 p-4 sm:p-6 ${cls}`}>
      <svg
        viewBox="0 0 520 300"
        className="w-full h-auto"
        role="img"
        aria-label="Two bars comparing pools with the same 3 ppm total chlorine. In a healthy pool, 2.9 ppm is free chlorine and only 0.1 ppm is combined. In a pool that needs shocking, 0.6 ppm is combined chlorine — over the 0.5 limit — which is what smells and stings, and shock is what burns it off."
      >
        {/* healthy pool */}
        <g className="dgm-fade" style={animDelay(0.15)}>
          <text x="80" y="72" fontSize="12.5" className="text-fg" fill="currentColor" fontWeight="600">
            Healthy pool — total chlorine 3.0 ppm
          </text>
          <rect x="80" y="82" width="290" height="30" rx="6" className="text-brand-blue-light" fill="currentColor" fillOpacity="0.85" />
          <rect x="372" y="82" width="8" height="30" rx="3" className="text-brand-orange" fill="currentColor" />
          <text x="92" y="101" fontSize="12" fill="#fff" fontWeight="600">free 2.9 ppm — working</text>
          <text x="480" y="101" textAnchor="end" fontSize="11.5" className="text-muted" fill="currentColor">combined 0.1 ✓</text>
        </g>

        {/* needs-shock pool */}
        <g className="dgm-fade" style={animDelay(0.45)}>
          <text x="80" y="166" fontSize="12.5" className="text-fg" fill="currentColor" fontWeight="600">
            Time to shock — total chlorine 3.0 ppm
          </text>
          <rect x="80" y="176" width="240" height="30" rx="6" className="text-brand-blue-light" fill="currentColor" fillOpacity="0.85" />
          <rect x="322" y="176" width="58" height="30" rx="6" className="text-brand-orange" fill="currentColor" />
          <text x="92" y="195" fontSize="12" fill="#fff" fontWeight="600">free 2.4 ppm</text>
          <text x="480" y="195" textAnchor="end" fontSize="11.5" className="text-brand-orange" fill="currentColor" fontWeight="700">combined 0.6 ✗</text>
        </g>

        {/* the takeaway */}
        <g className="dgm-fade" style={animDelay(0.8)}>
          <line x1="351" y1="210" x2="351" y2="228" className="text-brand-orange" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.6" />
          <text x="351" y="244" textAnchor="middle" fontSize="12" className="text-brand-orange" fill="currentColor" fontWeight="600">
            over the 0.5 ppm limit — this is what smells
          </text>
          <text x="351" y="260" textAnchor="middle" fontSize="11" className="text-muted" fill="currentColor">
            shock burns it off (“breakpoint chlorination”)
          </text>
        </g>

        {/* axis */}
        <g className="dgm-fade">
          <line x1="80" y1="282" x2="480" y2="282" className="text-line-strong" stroke="currentColor" strokeWidth="1.5" />
          <g fontSize="10.5" className="text-subtle" fill="currentColor">
            {[0, 1, 2, 3, 4].map((p) => (
              <text key={p} x={80 + p * 100} y="296" textAnchor="middle">{p} ppm</text>
            ))}
          </g>
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-subtle">
        Combined chlorine = <strong>total − free</strong> (test both, subtract). Identical totals, very
        different water: it’s the <strong>combined</strong> portion that smells, stings, and means it’s
        time to shock.
      </figcaption>
    </figure>
  );
};

/* ---- infographic: how shock needs move across the season ---- */

const SeasonDiagram = () => {
  const { ref, cls } = useInViewAnim();
  return (
    <figure ref={ref} className={`not-prose my-8 rounded-2xl border border-line bg-card-2 p-4 sm:p-6 ${cls}`}>
      <svg
        viewBox="0 0 520 300"
        className="w-full h-auto"
        role="img"
        aria-label="Curve of chlorine demand from April to October. Demand rises with water temperature, peaks in July and August — the weekly-to-biweekly shock zone — then tapers into fall. Markers show the opening shock in spring and the closing shock in autumn."
      >
        {/* peak-season band */}
        <g className="dgm-fade" style={animDelay(0.15)}>
          <rect x="210" y="30" width="139" height="230" className="text-brand-orange" fill="currentColor" fillOpacity="0.08" />
          <text x="280" y="48" textAnchor="middle" fontSize="11.5" className="text-brand-orange" fill="currentColor" fontWeight="600">
            peak season: weekly–biweekly
          </text>
        </g>

        {/* axes */}
        <g className="dgm-fade">
          <line x1="60" y1="30" x2="60" y2="260" className="text-line-strong" stroke="currentColor" strokeWidth="2" />
          <line x1="60" y1="260" x2="490" y2="260" className="text-line-strong" stroke="currentColor" strokeWidth="2" />
          <g fontSize="12" className="text-subtle" fill="currentColor">
            <text x="20" y="150" transform="rotate(-90 20 150)" textAnchor="middle">chlorine demand</text>
            <text x="72" y="278" textAnchor="middle">Apr</text>
            <text x="141" y="278" textAnchor="middle">May</text>
            <text x="210" y="278" textAnchor="middle">Jun</text>
            <text x="280" y="278" textAnchor="middle">Jul</text>
            <text x="349" y="278" textAnchor="middle">Aug</text>
            <text x="418" y="278" textAnchor="middle">Sep</text>
            <text x="481" y="278" textAnchor="middle">Oct</text>
          </g>
        </g>

        {/* demand curve */}
        <path
          className="dgm-line text-brand-blue-light"
          style={animDelay(0.35)}
          pathLength={1}
          d="M72 232 C 130 220, 170 165, 210 132 C 248 102, 315 88, 349 94 C 400 104, 450 180, 484 224"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />

        {/* opening + closing markers */}
        <g className="dgm-fade" style={animDelay(1.2)}>
          <circle cx="100" cy="219" r="6" className="text-brand-orange" fill="currentColor" />
          <circle cx="100" cy="219" r="2.2" fill="#fff" />
          <text x="112" y="210" fontSize="11.5" className="text-muted" fill="currentColor" fontWeight="600">opening shock</text>
        </g>
        <g className="dgm-fade" style={animDelay(1.4)}>
          <circle cx="452" cy="186" r="6" className="text-brand-orange" fill="currentColor" />
          <circle cx="452" cy="186" r="2.2" fill="#fff" />
          <text x="444" y="166" textAnchor="end" fontSize="11.5" className="text-muted" fill="currentColor" fontWeight="600">closing shock</text>
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-subtle">
        Demand tracks <strong>water temperature</strong> — warm water grows trouble faster and burns
        chlorine quicker. Calendar advice is really a proxy for this curve.
      </figcaption>
    </figure>
  );
};

/** Default cadence by usage — for owners who don't test often. */
const SCHEDULE = [
  {
    situation: 'Daily swimmers, hot weather',
    frequency: 'Weekly',
    why: 'Heavy bather load plus fast UV burn-through adds contaminants quickest',
    common: false,
  },
  {
    situation: 'Typical family use in season',
    frequency: 'Every 1–2 weeks',
    why: 'The standard summer rhythm if you aren’t testing often',
    common: true,
  },
  {
    situation: 'Light use, mild weather',
    frequency: 'Every 2–4 weeks, or on triggers',
    why: 'Low demand — let the water tell you',
    common: false,
  },
  {
    situation: 'Saltwater (SWG) pool',
    frequency: 'Rarely on a schedule',
    why: 'Boost mode handles small corrections; shock manually for algae or chloramines',
    common: false,
  },
  {
    situation: 'Tested 2–3× a week, FC matched to CYA',
    frequency: 'Triggers only',
    why: 'Consistent chlorine prevents the problems shock exists to correct',
    common: false,
  },
];

const ScheduleTable = () => (
  <div className="not-prose my-8">
    <div className="overflow-x-auto rounded-2xl border border-line bg-card elevate">
      <table className="w-full text-[15px] text-left border-collapse">
        <caption className="sr-only">How often to shock a pool depending on usage, weather, and testing habits.</caption>
        <thead>
          <tr className="border-b border-line text-subtle">
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold">Your situation</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Shock how often</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold">Why</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {SCHEDULE.map((row) => (
            <tr key={row.situation} className={row.common ? 'bg-brand-blue/10' : 'transition-colors hover:bg-card-2'}>
              <th scope="row" className="px-4 sm:px-5 py-3.5 font-semibold text-fg align-top text-[14px] leading-snug">
                {row.situation}
                {row.common && (
                  <span className="ml-2 inline-flex rounded-full border border-brand-blue/30 bg-brand-blue/10 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide text-brand-blue align-middle">
                    most pools
                  </span>
                )}
              </th>
              <td className="px-4 sm:px-5 py-3.5 align-top whitespace-nowrap">
                <span className="inline-flex rounded-full bg-brand-orange/10 text-brand-orange-dark px-2.5 py-1 text-[13px] font-semibold">
                  {row.frequency}
                </span>
              </td>
              <td className="px-4 sm:px-5 py-3.5 align-top text-muted text-[14px] leading-relaxed">{row.why}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <p className="text-[11px] text-subtle mt-3 leading-relaxed">
      “In season” means swim-temperature water (above ~70 °F) — warm water grows trouble fast. In the
      off-season, triggers replace the calendar entirely.
    </p>
  </div>
);

type Trigger = { icon: LucideIcon; title: string; body: ReactNode };
const TRIGGERS: Trigger[] = [
  {
    icon: FlaskConical,
    title: 'Combined chlorine hits 0.5 ppm',
    body: (
      <>That “strong chlorine smell” and stinging eyes aren’t too much chlorine — they’re{' '}
      <strong>chloramines</strong>, used-up chlorine bound to sweat and oils. When combined chlorine
      (total minus free) reaches 0.5 ppm, shock to burn them off.</>
    ),
  },
  {
    icon: Users,
    title: 'After a pool party',
    body: (
      <>Every swimmer adds sweat, sunscreen, and body oils that consume free chlorine for hours
      afterward. A heavy-use day is the classic time for a same-evening shock — it resets the water
      before anything gains a foothold.</>
    ),
  },
  {
    icon: CloudRain,
    title: 'After a storm or heatwave',
    body: (
      <>Storms wash in dust, debris, and runoff while diluting your chemicals; a heatwave burns chlorine
      faster than feeders replace it. Test afterward — if free chlorine crashed, shock that evening.</>
    ),
  },
  {
    icon: Droplets,
    title: 'The water dulls or walls feel slick',
    body: (
      <>Lost sparkle, a faint haze, or slippery walls are <strong>early algae and biofilm</strong> — the
      stage where one shock still wins. Wait for green and you’re into a multi-day fight; see{' '}
      <Link to="/guides/cloudy-pool-water">cloudy pool water</Link> for the full diagnosis.</>
    ),
  },
  {
    icon: Leaf,
    title: 'You can see algae',
    body: (
      <>Visible green means a single shock won’t cut it — algae eats through one dose in hours. You need
      to raise chlorine to the level for your CYA and <em>hold</em> it: the{' '}
      <Link to="/guides/how-to-fix-a-green-pool">green pool rescue</Link> walks through it.</>
    ),
  },
  {
    icon: CalendarCheck,
    title: 'Opening (and closing) the pool',
    body: (
      <>Open with a shock to reset whatever winter brewed — spring demand can be enormous if CYA
      degraded into ammonia. A closing shock buffers the water heading into the off-season.</>
    ),
  },
];

const TriggerCards = () => {
  const { ref, cls } = useInViewAnim<HTMLDivElement>();
  return (
    <div ref={ref} className={`not-prose my-8 grid gap-3 sm:grid-cols-2 ${cls}`}>
      {TRIGGERS.map((t, i) => {
        const Icon = t.icon;
        return (
          <div
            key={t.title}
            className="dgm-fade flex gap-4 rounded-2xl border border-line bg-card p-4 sm:p-5 elevate transition-colors hover:border-line-strong"
            style={animDelay(i * 0.1)}
          >
            <div className="shrink-0 flex flex-col items-center gap-2.5">
              <span className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue-light to-brand-blue text-white font-display font-bold text-[15px] shadow-sm shadow-brand-blue/30 ring-1 ring-white/15">
                {i + 1}
              </span>
              <span aria-hidden className="grid place-items-center w-8 h-8 rounded-lg bg-brand-orange/10 text-brand-orange">
                <Icon className="w-[18px] h-[18px]" />
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-bold text-fg text-[15px] sm:text-base mb-1">{t.title}</h3>
              <p className="text-muted text-[14px] sm:text-[15px] leading-relaxed">{t.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FAQS = [
  {
    q: 'Should I shock my pool every week?',
    a: 'Only if the pool works hard — daily swimmers, hot weather, or you don’t test the water often. Weekly shocking is a substitute for information: if you test free and combined chlorine two or three times a week and keep free chlorine matched to your CYA, you can shock far less often, on triggers instead of a calendar — and the water will be better for it.',
  },
  {
    q: 'Can you shock a pool too often?',
    a: 'Yes, in two ways. Shocking with stabilized products (dichlor) every week steadily raises CYA until your everyday chlorine stops working; frequent cal-hypo shocks raise calcium hardness the same way. And needing to shock constantly is itself a symptom — usually low CYA letting the sun strip your chlorine, or an algae demand that one-off shocks never fully kill. Fix the underlying problem and the “need” to shock mostly disappears.',
  },
  {
    q: 'What time of day should you shock a pool?',
    a: 'Dusk or after dark. Shock is unstabilized chlorine, and direct sunlight destroys it within hours — a morning shock can lose most of its punch before it finishes working. Dosing at dusk gives it the whole night, with the pump running, to circulate and sanitize.',
  },
  {
    q: 'Do saltwater pools need to be shocked?',
    a: 'Rarely on a schedule. A salt chlorine generator makes chlorine continuously, and most systems have a boost/super-chlorinate mode that covers parties and storms. Shock a salt pool manually the same way as any other when there’s a real trigger: combined chlorine at 0.5 ppm or visible algae — liquid chlorine works fine alongside an SWG.',
  },
  {
    q: 'Should I shock my pool after it rains?',
    a: 'After a heavy storm with runoff, debris, or standing-water overflow — yes, that evening. After ordinary light rain, just test: a brief shower barely changes the chemistry. The rule is the same as always — shock in response to what the test shows, not the weather report alone.',
  },
  {
    q: 'How long after shocking can I swim?',
    a: 'Once free chlorine falls back below the safe ceiling for your stabilizer level — about 40% of your CYA, or 5 ppm or less in a pool with no CYA — and the water is clear. After a routine evening shock that’s typically the next morning to the next day. Always confirm with a test rather than the clock.',
  },
];

const SOURCES = [
  { label: 'CDC — Healthy Swimming (chloramines & water quality)', url: 'https://www.cdc.gov/healthy-swimming/' },
  { label: 'Trouble Free Pool — community wiki', url: 'https://www.troublefreepool.com/wiki/' },
  { label: 'PHTA — Pool & Hot Tub Alliance', url: 'https://www.phta.org/' },
];

export const ShockFrequencyGuide = () => (
  <GuideLayout
    title={guide.title}
    metaTitle="How Often Should You Shock Your Pool? (Schedule + Signs)"
    description="How often should you shock your pool? Every 1–2 weeks in season is the easy default — but the smarter schedule is six triggers. Plus when not to shock."
    path={guide.path}
    updated={guide.updated}
    readMinutes={6}
    faqs={FAQS}
    sources={SOURCES}
    cta={{
      to: '/pool-shock-calculator',
      label: 'Time to shock? Dose it exactly.',
      sub: 'Enter your gallons and CYA — the calculator gives the precise amount of liquid chlorine or cal-hypo.',
    }}
  >
    <p>
      How often should you shock your pool? The standard answer is <strong>every one to two weeks during
      swim season</strong>, weekly when it’s hot or busy — and that’s a fine default if you don’t test
      often. But the smarter schedule isn’t a calendar at all: it’s six specific{' '}
      <strong>triggers</strong> the water gives you, and a well-tested pool can skip most “scheduled”
      shocks entirely. Here’s both answers, honestly.
    </p>

    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-brand-blue/40 bg-gradient-to-br from-brand-blue/15 via-transparent to-brand-orange/10 elevate">
      <div className="p-5 sm:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 mb-3">
          <Clock className="w-3.5 h-3.5 text-brand-blue-light" />
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-brand-blue-light">Quick answer</span>
        </span>
        <p className="text-fg text-[15px] sm:text-base leading-relaxed">
          Not testing much? <strong className="font-semibold">Every 1–2 weeks in season, weekly with
          heavy use — always at dusk.</strong> Testing regularly? Shock on triggers instead: combined
          chlorine at 0.5 ppm, after parties and storms, dull or slick water, visible algae, and at
          opening. You’ll shock less and the water will be better.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line border-t border-line bg-card-2">
        {[
          { icon: CalendarCheck, value: '1–2 weeks', label: 'the default rhythm in swim season' },
          { icon: FlaskConical, value: '0.5 ppm', label: 'combined chlorine that means shock now' },
          { icon: Moon, value: 'Dusk', label: 'when shock works best (no sun to burn it off)' },
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

    <h2>Find your shock schedule in 10 seconds</h2>
    <p>
      Three questions, instant answer — and the result updates the URL, so you can share it:
    </p>

    <PlanPicker />

    <h2>The default shock schedule, by how you use the pool</h2>
    <p>
      If you’d rather have a calendar than a test kit, match your row — then steal the bottom row’s
      approach when you’re ready:
    </p>

    <ScheduleTable />

    <p>
      Whatever your row says, it bends with the thermometer. “How often” is really a curve that follows
      water temperature across the season — high summer is the weekly zone, the shoulders barely need it:
    </p>

    <SeasonDiagram />

    <h2>The 6 signs your pool needs shocking now</h2>
    <p>
      Calendars guess; the water tells you. Any one of these is a real reason to shock — tonight, not
      Saturday:
    </p>

    <TriggerCards />

    <h3>Trigger #1, visualized: what “combined chlorine” means</h3>
    <p>
      The single most useful trigger is the one most owners never test. Total chlorine is two different
      things added together — <strong>free</strong> chlorine (still working) and <strong>combined</strong>{' '}
      chlorine (already spent, bound to sweat and oils — the part that smells like “too much chlorine”).
      Two pools can test identical on total and be in opposite shape:
    </p>

    <CombinedChlorineDiagram />

    <h2>The smarter answer: test, don’t calendar</h2>
    <p>
      Here’s the part the bag of shock doesn’t mention: <strong>shocking is a correction, not
      maintenance</strong>. Chlorine that’s kept matched to your stabilizer level — tested a couple of
      times a week, topped up with the <Link to="/chlorine-calculator">chlorine calculator</Link> —
      prevents the very problems shock exists to fix. Owners who run that routine often go an entire
      season shocking only at opening and after the odd storm or party. If your pool seems to{' '}
      <em>need</em> constant shocking, something upstream is broken — usually CYA too low (sun strips
      your chlorine daily) or an algae demand that one-off shocks never finish; our{' '}
      <Link to="/guides/why-wont-my-pool-hold-chlorine">won’t-hold-chlorine guide</Link> finds which.
    </p>

    <h2>How to shock it right</h2>
    <p>
      Quick recap of the rules that make a shock actually work: dose at <strong>dusk</strong> (sunlight
      destroys unstabilized chlorine), use <strong>liquid chlorine or cal-hypo</strong> — never
      stabilized trichlor/dichlor, which quietly ratchet up your CYA — size the dose with the{' '}
      <Link to="/pool-shock-calculator">shock calculator</Link> (it scales the target to your CYA), and
      run the pump overnight. Then wait for the water to come back below the safe-swim ceiling before
      anyone gets in — here’s{' '}
      <Link to="/guides/how-long-after-shocking-pool-can-you-swim">exactly how long that takes</Link>.
    </p>

    <h2>When NOT to shock</h2>
    <ul>
      <li>
        <strong>When CYA is sky-high.</strong> The shock level scales with stabilizer — at CYA 100+ the
        target is impractically high and the dose mostly wasted. Lower CYA first with a{' '}
        <Link to="/guides/how-to-drain-a-pool-with-a-garden-hose">partial drain and refill</Link>.
      </li>
      <li>
        <strong>On a calendar with stabilized shock.</strong> Weekly dichlor “maintenance shocks” are how
        pools end up over-stabilized by August. If a routine has you adding CYA every week, the routine
        is the problem.
      </li>
      <li>
        <strong>For a chemistry haze.</strong> Cloudiness from high pH pushing calcium out of solution
        isn’t alive — no amount of chlorine kills it. Check your{' '}
        <Link to="/lsi-calculator">LSI</Link> before assuming the cloud needs shock.
      </li>
      <li>
        <strong>Right before swimmers arrive.</strong> A fresh shock means hours of waiting. If guests
        are coming Saturday afternoon, shock Friday night.
      </li>
    </ul>
  </GuideLayout>
);
