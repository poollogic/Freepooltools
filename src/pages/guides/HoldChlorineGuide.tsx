import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Moon,
  Sun,
  Sunrise,
  ShieldCheck,
  FlaskConical,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { GuideLayout } from '@/components/GuideLayout';
import { GUIDES } from '@/data/guides';
import { useInViewAnim, animDelay } from '@/lib/useInViewAnim';

const guide = GUIDES.find((g) => g.slug === 'why-wont-my-pool-hold-chlorine')!;

/** The OCLT in one picture: a healthy pool holds chlorine in the dark; a pool
 *  with algae loses it overnight, because sunlight isn't the one eating it. */
const OcltDiagram = () => {
  const { ref, cls } = useInViewAnim();
  return (
    <figure ref={ref} className={`not-prose my-8 rounded-2xl border border-line bg-card-2 p-4 sm:p-6 ${cls}`}>
      <svg
        viewBox="0 0 520 300"
        className="w-full h-auto"
        role="img"
        aria-label="Chart of free chlorine from dusk to noon. A healthy pool's line stays flat overnight and only dips once the sun comes up. A pool with algae loses chlorine steeply during the night — proof that something living, not sunlight, is consuming it."
      >
        <defs>
          <linearGradient id="dgm-night" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand-blue)" stopOpacity="0.14" />
            <stop offset="100%" stopColor="var(--color-brand-blue)" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* night shading: dusk → dawn */}
        <g className="dgm-fade" style={animDelay(0.15)}>
          <rect x="72" y="30" width="228" height="230" fill="url(#dgm-night)" />
          <g className="text-brand-blue" fill="currentColor" opacity="0.75">
            <text x="186" y="48" textAnchor="middle" fontSize="12" fontWeight="600">night — no sun</text>
            <text x="186" y="64" textAnchor="middle" fontSize="10.5">any loss now is something living</text>
          </g>
        </g>

        {/* axes, ticks, and labels */}
        <g className="dgm-fade">
          <g className="text-line-strong" stroke="currentColor" strokeWidth="2">
            <line x1="60" y1="30" x2="60" y2="260" />
            <line x1="60" y1="260" x2="490" y2="260" />
          </g>
          <g className="text-subtle" stroke="currentColor" strokeWidth="1.5">
            <line x1="300" y1="260" x2="300" y2="266" />
            <line x1="480" y1="260" x2="480" y2="266" />
          </g>
          <g fontSize="12" className="text-subtle" fill="currentColor">
            <text x="20" y="150" transform="rotate(-90 20 150)" textAnchor="middle">free chlorine (ppm)</text>
            <text x="72" y="278" textAnchor="middle">dusk</text>
            <text x="300" y="278" textAnchor="middle">dawn</text>
            <text x="480" y="278" textAnchor="end">noon</text>
          </g>
        </g>

        {/* healthy pool: flat overnight, gentle daytime dip */}
        <path
          className="dgm-line text-brand-blue-light"
          style={animDelay(0.35)}
          pathLength={1}
          d="M72 84 L300 92 C 360 98, 430 116, 488 130"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <text className="dgm-fade text-brand-blue-light" style={animDelay(0.85)} x="480" y="156" textAnchor="end" fontSize="12.5" fill="currentColor" fontWeight="600">
          passes: lost ≤1 ppm overnight
        </text>

        {/* algae pool: plummets in the dark */}
        <path
          className="dgm-fade text-brand-orange"
          style={animDelay(1.05)}
          d="M72 84 C 150 132, 240 196, 300 216 C 360 232, 430 242, 488 246"
          fill="none"
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="8 6"
        />
        <text className="dgm-fade text-brand-orange" style={animDelay(1.3)} x="96" y="238" fontSize="12.5" fill="currentColor" fontWeight="600">
          fails: algae ate it in the dark
        </text>

        {/* dawn marker on the healthy line */}
        <circle className="dgm-pulse text-brand-blue-light" style={animDelay(2.2)} cx="300" cy="92" r="9" fill="none" stroke="currentColor" strokeWidth="2.5" opacity="0" />
        <g className="dgm-fade" style={animDelay(1.85)}>
          <circle cx="300" cy="92" r="6" className="text-brand-blue-light" fill="currentColor" />
          <circle cx="300" cy="92" r="2.2" fill="#fff" />
        </g>
      </svg>
      <figcaption className="mt-3 text-center text-xs text-subtle">
        The overnight chlorine loss test (OCLT): sunlight can’t eat chlorine in the dark — so a pool that
        loses more than <strong>1 ppm overnight</strong> has a <strong>living</strong> chlorine demand, not a sun problem.
      </figcaption>
    </figure>
  );
};

/** Symptom → cause → fix. The scannable version of the whole article. */
const DIAGNOSIS = [
  {
    symptom: 'Drops more than 1 ppm overnight',
    cause: 'Algae or other organic demand',
    fix: 'SLAM: raise FC to ~40% of CYA and hold it',
  },
  {
    symptom: 'Holds overnight, gone by late afternoon',
    cause: 'Little or no stabilizer (CYA)',
    fix: 'Add CYA to 30–50 ppm',
  },
  {
    symptom: 'Reads zero right after a big dose',
    cause: 'Test bleached out by high chlorine',
    fix: 'Dilute the sample 1:1 with distilled water, re-test, double it',
  },
  {
    symptom: 'FC looks normal but algae keeps coming',
    cause: 'CYA too high for your chlorine level',
    fix: 'Partial drain & refill, then match FC to your CYA',
  },
  {
    symptom: 'Spring opening eats chlorine endlessly',
    cause: 'CYA degraded into ammonia over winter',
    fix: 'Keep dosing — a heavy SLAM burns through it',
  },
];

const DiagnosisTable = () => (
  <div className="not-prose my-8">
    <div className="overflow-x-auto rounded-2xl border border-line bg-card elevate">
      <table className="w-full text-[15px] text-left border-collapse">
        <caption className="sr-only">Chlorine-loss symptom, the likely cause, and the fix for each.</caption>
        <thead>
          <tr className="border-b border-line text-subtle">
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold">Symptom</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold whitespace-nowrap">Likely cause</th>
            <th scope="col" className="px-4 sm:px-5 py-3 font-semibold">The fix</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {DIAGNOSIS.map((row) => (
            <tr key={row.symptom} className="transition-colors hover:bg-card-2">
              <th scope="row" className="px-4 sm:px-5 py-3.5 font-semibold text-fg align-top text-[14px] leading-snug">{row.symptom}</th>
              <td className="px-4 sm:px-5 py-3.5 align-top text-muted text-[14px] leading-relaxed">{row.cause}</td>
              <td className="px-4 sm:px-5 py-3.5 align-top text-muted text-[14px] leading-relaxed">{row.fix}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

type Step = { icon: LucideIcon; title: string; body: ReactNode };
const OCLT_STEPS: Step[] = [
  {
    icon: Moon,
    title: 'Dose after sunset',
    body: (
      <>Once the sun is off the water, bring free chlorine up to your normal target (the{' '}
      <Link to="/chlorine-calculator">chlorine calculator</Link> gives the exact amount) and let the pump
      run 30–60 minutes to mix it fully.</>
    ),
  },
  {
    icon: FlaskConical,
    title: 'Test and write it down',
    body: (
      <>Test free chlorine with a drop-based kit and note the number. Strips are too coarse here — the
      whole test hinges on reading a 1 ppm difference reliably.</>
    ),
  },
  {
    icon: Sunrise,
    title: 'Re-test at dawn',
    body: (
      <>Test again first thing in the morning, <strong>before sunlight hits the pool</strong>. No sun has
      touched the water in between — UV is off the suspect list by design.</>
    ),
  },
  {
    icon: CheckCircle2,
    title: 'Compare the two numbers',
    body: (
      <>Lost <strong>1 ppm or less</strong>? You pass — nothing is living in the water, and any daytime
      loss is a sunlight/CYA problem. Lost more? Something organic is eating chlorine in the dark:
      time to <Link to="/pool-shock-calculator">SLAM</Link>.</>
    ),
  },
];

const OcltSteps = () => {
  const { ref, cls } = useInViewAnim<HTMLDivElement>();
  return (
    <div ref={ref} className={`not-prose my-8 grid gap-3 sm:grid-cols-2 ${cls}`}>
      {OCLT_STEPS.map((step, i) => {
        const Icon = step.icon;
        return (
          <div
            key={step.title}
            className="dgm-fade flex gap-4 rounded-2xl border border-line bg-card p-4 sm:p-5 elevate transition-colors hover:border-line-strong"
            style={animDelay(i * 0.12)}
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
              <h3 className="font-display font-bold text-fg text-[15px] sm:text-base mb-1">{step.title}</h3>
              <p className="text-muted text-[14px] sm:text-[15px] leading-relaxed">{step.body}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FAQS = [
  {
    q: 'Why is my chlorine zero even after shocking?',
    a: 'Two possibilities. Either your test bleached out — very high chlorine can overwhelm strips and basic DPD kits into reading zero, so dilute the sample 1:1 with distilled water, re-test, and double the result — or the pool genuinely consumed the whole dose, which means a large organic demand (usually algae, sometimes ammonia after winter). If a diluted test still reads zero, keep dosing: the demand has to be fed until it breaks.',
  },
  {
    q: 'What is chlorine lock and how do I break it?',
    a: '“Chlorine lock” is a pool-store term, not real chemistry — chlorine never gets locked up in a form that some additive can release. The two real problems behind the phrase are: very high CYA (chlorine is present but too buffered to work, fixed by a partial drain and refill) and unmet chlorine demand (something organic is consuming it, fixed by SLAM-level shocking). No “shock treatment” product breaks a lock that doesn’t exist — diagnose which real problem you have instead.',
  },
  {
    q: 'How much chlorine loss per day is normal?',
    a: 'With CYA in the 30–50 ppm range, expect to lose roughly 1–4 ppm of free chlorine over a sunny summer day — that’s normal UV and bather consumption. Overnight, a clean pool should lose 1 ppm or less. Losing most of your chlorine in a few daylight hours points to low CYA; losing it overnight points to algae or another organic demand.',
  },
  {
    q: 'Does rain make my pool lose chlorine?',
    a: 'Rain itself contains almost no chlorine-destroying chemistry and the dilution from a typical storm is small. The real hit is what rain brings with it: runoff, dust, pollen, and organic debris washed into the water — all of it consumes chlorine. Heavy storms also raise the water level, so you drain a little and dilute everything slightly. Test and re-dose after any major storm.',
  },
  {
    q: 'Why does my pool eat chlorine when I open it in spring?',
    a: 'Over a winter with no chlorine, bacteria can convert your cyanuric acid into ammonia — and ammonia creates an enormous chlorine demand: each 1 ppm of ammonia consumes roughly 10 ppm of free chlorine. The signature is a spring opening where chlorine vanishes as fast as you add it and CYA tests far lower than you left it. The cure is persistence: repeated heavy dosing (a SLAM) until the ammonia is fully oxidized, after which the pool holds chlorine normally again.',
  },
  {
    q: 'Will adding more stabilizer help my pool hold chlorine?',
    a: 'Only if your CYA is genuinely low (under about 30 ppm) — then yes, stabilizer is exactly the fix, because unprotected chlorine burns off in a couple of hours of direct sun. But past roughly 50 ppm, more CYA makes things worse, not better: it weakens the chlorine you have, so algae gains ground and your apparent “chlorine loss” accelerates. Test CYA before adding any.',
  },
];

const SOURCES = [
  { label: 'Trouble Free Pool — overnight chlorine loss test (community wiki)', url: 'https://www.troublefreepool.com/wiki/' },
  { label: 'Orenda Technologies — chlorine demand explained', url: 'https://ask.orendatech.com/knowledge/no-free-chlorine-in-pool-after-shocking' },
  { label: 'CDC — Healthy Swimming', url: 'https://www.cdc.gov/healthy-swimming/' },
];

export const HoldChlorineGuide = () => (
  <GuideLayout
    title={guide.title}
    metaTitle="Why Won’t My Pool Hold Chlorine? The 5 Causes (& Fixes)"
    description="Pool won’t hold chlorine? Find the cause with one overnight test — algae demand, low stabilizer, a lying test kit — and the exact fix for each."
    path={guide.path}
    updated={guide.updated}
    readMinutes={8}
    faqs={FAQS}
    sources={SOURCES}
    cta={{
      to: '/pool-shock-calculator',
      label: 'Failed the overnight test? SLAM it.',
      sub: 'The shock calculator gives the exact dose to hit and hold the shock level for your CYA.',
    }}
  >
    <p>
      Why won’t my pool hold chlorine? Because something is <strong>consuming</strong> it (usually algae
      you can’t see yet), something is <strong>destroying</strong> it (sunlight, when stabilizer is low),
      or your <strong>test is lying</strong> to you. It is almost never “chlorine lock.” One simple
      overnight test separates the causes — and once you know which one you have, the fix is
      straightforward. Here’s the whole diagnosis.
    </p>

    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-brand-blue/40 bg-gradient-to-br from-brand-blue/15 via-transparent to-brand-orange/10 elevate">
      <div className="p-5 sm:p-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-blue/30 bg-brand-blue/10 px-3 py-1 mb-3">
          <Clock className="w-3.5 h-3.5 text-brand-blue-light" />
          <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-brand-blue-light">Quick answer</span>
        </span>
        <p className="text-fg text-[15px] sm:text-base leading-relaxed">
          Run the <strong className="font-semibold">overnight chlorine loss test</strong>: dose at dusk,
          test, re-test at dawn. Losing more than 1 ppm in the dark means something <em>living</em> is
          eating your chlorine (shock it); losing it only during the day means sunlight is destroying it
          (add stabilizer). Zero readings right after dosing usually mean the test maxed out.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-line border-t border-line bg-card-2">
        {[
          { icon: Moon, value: '≤1 ppm', label: 'overnight loss in a healthy pool' },
          { icon: Sun, value: '2–3 h', label: 'for full sun to wipe out unstabilized chlorine' },
          { icon: ShieldCheck, value: '30–50 ppm', label: 'the CYA that lets chlorine last all day' },
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

    <h2>The 5 reasons a pool won’t hold chlorine</h2>

    <h3>1. Algae is eating it — even if you can’t see any</h3>
    <p>
      The most common cause by far. An algae bloom consumes chlorine <em>before</em> it turns the water
      visibly green — for days, the only symptom is chlorine that vanishes faster than it should. Clues:
      the loss happens overnight too (sunlight can’t be blamed in the dark), combined chlorine creeps
      above 0.5 ppm, walls feel slippery, and the water has a faint haze. The fix is the same as for a
      fully green pool: raise free chlorine to the <strong>shock level for your CYA (≈40%)</strong> and
      hold it there until the demand breaks — the full process is in our{' '}
      <Link to="/guides/how-to-fix-a-green-pool">green pool guide</Link>, and the{' '}
      <Link to="/pool-shock-calculator">shock calculator</Link> gives the exact dose.
    </p>

    <h3>2. Little or no stabilizer — the sun is destroying it</h3>
    <p>
      Unprotected chlorine is shockingly fragile in sunlight: direct summer sun can destroy most of it in{' '}
      <strong>2–3 hours</strong>. Cyanuric acid (CYA) is the sunscreen — at 30–50 ppm, chlorine survives
      the day. The signature here is the mirror image of algae: the pool <em>passes</em> the overnight
      test but chlorine is gone by late afternoon. Common after a fresh fill, a lot of rain/backwashing,
      or if you only use liquid chlorine (which adds no CYA). Check your level and dose with the{' '}
      <Link to="/cya-calculator">CYA calculator</Link> — and read{' '}
      <Link to="/guides/cyanuric-acid-and-chlorine">how CYA and chlorine work together</Link> if the
      relationship is new to you.
    </p>

    <h3>3. Your test is lying</h3>
    <p>
      Very high chlorine <strong>bleaches out</strong> test strips and basic DPD kits — the reading
      crashes to zero exactly when chlorine is highest, right after a big dose. Expired strips and
      reagents do the same. Before treating a “zero,” dilute the sample 1:1 with distilled water, re-test,
      and double the result. If you maintain your own pool, a drop-based FAS-DPD kit is the single best
      upgrade you can make — it reads accurately straight through shock levels.
    </p>

    <h3>4. CYA is too high — chlorine is there but handcuffed</h3>
    <p>
      The indirect version of the problem. Years of trichlor tablets push CYA past 80–100 ppm, where it
      buffers chlorine so heavily that a “fine” reading like 3 ppm does almost nothing. Algae gains
      ground, demand rises, and chlorine seems to disappear faster and faster. No additive removes CYA —
      the fix is a <Link to="/guides/how-to-drain-a-pool-with-a-garden-hose">partial drain and refill</Link>,
      then keeping free chlorine matched to the new CYA level.
    </p>

    <h3>5. Spring ammonia — the post-winter chlorine pit</h3>
    <p>
      The strangest one: over a winter with no chlorine, bacteria can convert your CYA into{' '}
      <strong>ammonia</strong>. Each 1 ppm of ammonia consumes roughly <strong>10 ppm</strong> of free
      chlorine, so the pool swallows shock after shock at opening with nothing to show for it — and CYA
      mysteriously tests far lower than you left it in fall. There’s no shortcut: dose heavily and
      repeatedly (a sustained SLAM) until the ammonia is oxidized. It always ends — usually within a few
      days — and then the pool holds chlorine normally.
    </p>

    <h2>Symptom checker: match yours to the fix</h2>
    <p>
      The same five causes, as a cheat sheet — find the row that sounds like your pool:
    </p>

    <DiagnosisTable />

    <h2>The overnight chlorine loss test (OCLT)</h2>
    <p>
      The cleanest diagnostic in pool care, and it costs nothing: <strong>sunlight can’t destroy chlorine
      in the dark</strong>. So if chlorine drops overnight, the cause is living — algae, bacteria,
      biofilm. If it holds overnight but dies during the day, the cause is UV and your CYA is too low.
      One test, and the suspect list collapses:
    </p>

    <OcltDiagram />

    <h2>How to run the test</h2>
    <p>Four steps, one evening to one morning. Use a drop-based kit — the verdict rides on a 1 ppm difference.</p>

    <OcltSteps />

    <h2>Is “chlorine lock” real?</h2>
    <p>
      No — at least not the way it’s sold. There is no chemical state where chlorine sits “locked” in your
      water waiting for a magic additive to free it. What pool stores call chlorine lock is almost always
      one of two real, testable problems: <strong>over-stabilization</strong> (CYA so high the chlorine
      you have barely works — cause #4 above) or <strong>unmet chlorine demand</strong> (something organic
      consuming chlorine as fast as you add it — causes #1 and #5). Neither is fixed by a “lock-breaking”
      product; one is fixed with a partial drain, the other by dosing past the demand. Diagnose first,
      then spend money.
    </p>
  </GuideLayout>
);
