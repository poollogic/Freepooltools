import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Power, Ruler, MapPin, Droplets, Hourglass, CircleStop, FlaskConical, AlertTriangle, type LucideIcon } from 'lucide-react';
import { GuideLayout } from '@/components/GuideLayout';
import { GUIDES } from '@/data/guides';

const guide = GUIDES.find((g) => g.slug === 'how-to-drain-a-pool-with-a-garden-hose')!;

/** Cross-section: how a garden-hose siphon moves water out of the pool. */
const SiphonDiagram = () => (
  <figure className="not-prose my-8 rounded-2xl border border-line bg-card-2 p-4 sm:p-6">
    <svg
      viewBox="0 0 520 300"
      className="w-full h-auto"
      role="img"
      aria-label="A garden hose runs from underwater in the pool, up over the edge, and down to an outlet placed below the pool's water level; gravity pulls water through the full hose and out."
    >
      {/* water-level reference line */}
      <g className="text-subtle">
        <line x1="214" y1="112" x2="506" y2="112" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5 5" />
        <text x="504" y="104" textAnchor="end" fontSize="12" fill="currentColor">same water level →</text>
      </g>

      {/* pool shell + water */}
      <g className="text-brand-blue">
        <rect x="62" y="112" width="150" height="138" rx="3" fill="currentColor" fillOpacity="0.18" />
        <line x1="62" y1="112" x2="212" y2="112" stroke="currentColor" strokeWidth="2.5" />
      </g>
      <g className="text-line-strong">
        <path d="M62 84 L62 250 L212 250 L212 84" fill="none" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
        <rect x="44" y="76" width="34" height="14" rx="3" fill="currentColor" />
        <rect x="196" y="76" width="34" height="14" rx="3" fill="currentColor" />
      </g>

      {/* hose (orange) with water column (blue) inside */}
      <path d="M97 214 L97 100 Q97 62 142 60 Q192 58 208 102 Q236 168 472 206"
        fill="none" className="text-brand-orange" stroke="currentColor" strokeWidth="13" strokeLinecap="round" />
      <path d="M97 214 L97 100 Q97 62 142 60 Q192 58 208 102 Q236 168 472 206"
        fill="none" className="text-brand-blue-light" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeOpacity="0.9" />

      {/* flow arrows */}
      <g className="text-fg" fill="currentColor">
        <path d="M92 150 l5 -9 l5 9 z" />
        <path d="M150 53 l9 5 l-9 5 z" />
        <path d="M352 178 l3 10 l8 -7 z" />
      </g>

      {/* submerged end bubbles */}
      <g className="text-brand-blue-light" fill="currentColor" fillOpacity="0.8">
        <circle cx="108" cy="206" r="3" />
        <circle cx="116" cy="214" r="2.2" />
        <circle cx="104" cy="196" r="2" />
      </g>

      {/* outlet: drain grate + drips, below the dashed water line */}
      <g className="text-subtle">
        <rect x="450" y="214" width="56" height="9" rx="2" fill="currentColor" fillOpacity="0.5" />
        <line x1="462" y1="214" x2="462" y2="223" stroke="currentColor" strokeWidth="1.5" />
        <line x1="478" y1="214" x2="478" y2="223" stroke="currentColor" strokeWidth="1.5" />
        <line x1="494" y1="214" x2="494" y2="223" stroke="currentColor" strokeWidth="1.5" />
      </g>
      <g className="text-brand-blue-light" fill="currentColor">
        <circle cx="474" cy="230" r="2.6" />
        <circle cx="470" cy="240" r="2.2" />
      </g>

      {/* numbered callouts */}
      <g fontSize="12.5">
        <g className="text-brand-blue">
          <circle cx="135" cy="150" r="11" fill="currentColor" />
          <text x="135" y="150" textAnchor="middle" dy=".35em" fill="#fff" fontWeight="700">1</text>
          <text x="152" y="150" dy=".35em" className="text-muted" fill="currentColor">Pool water is higher</text>
        </g>
        <g className="text-brand-orange">
          <circle cx="142" cy="36" r="11" fill="currentColor" />
          <text x="142" y="36" textAnchor="middle" dy=".35em" fill="#fff" fontWeight="700">2</text>
          <text x="160" y="36" dy=".35em" className="text-muted" fill="currentColor">Hose stays full — no air</text>
        </g>
        <g className="text-brand-blue">
          <circle cx="345" cy="252" r="11" fill="currentColor" />
          <text x="345" y="252" textAnchor="middle" dy=".35em" fill="#fff" fontWeight="700">3</text>
          <text x="362" y="252" dy=".35em" className="text-muted" fill="currentColor">Outlet sits below the water line</text>
        </g>
      </g>
    </svg>
    <figcaption className="mt-3 text-center text-xs text-subtle">
      A siphon works on gravity: a completely water-filled hose pulls pool water up over the edge and out — as long as the outlet ends up <strong>lower</strong> than the pool’s surface.
    </figcaption>
  </figure>
);

/** "Concrete boat": why an empty shell can float or crack from groundwater. */
const PopUpDiagram = () => (
  <figure className="not-prose my-8 rounded-2xl border border-brand-orange/40 bg-brand-orange/[0.06] p-4 sm:p-6">
    <svg
      viewBox="0 0 520 300"
      className="w-full h-auto"
      role="img"
      aria-label="An empty in-ground pool shell sitting in saturated soil; groundwater pressure beneath pushes the shell upward, cracking and lifting it like a boat."
    >
      {/* ground */}
      <g className="text-muted">
        <rect x="0" y="96" width="520" height="204" fill="currentColor" fillOpacity="0.12" />
        <line x1="0" y1="96" x2="520" y2="96" stroke="currentColor" strokeWidth="2" strokeOpacity="0.5" />
      </g>

      {/* groundwater table (skips the shell footprint) */}
      <g className="text-brand-blue-light">
        <line x1="8" y1="150" x2="158" y2="150" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5" />
        <line x1="360" y1="150" x2="512" y2="150" stroke="currentColor" strokeWidth="2" strokeDasharray="6 5" />
        <text x="8" y="142" fontSize="12" fill="currentColor" className="text-muted">high groundwater</text>
        <circle cx="120" cy="168" r="2.4" fill="currentColor" />
        <circle cx="392" cy="170" r="2.4" fill="currentColor" />
        <circle cx="430" cy="162" r="2" fill="currentColor" />
      </g>

      {/* empty shell, tilted to suggest it's lifting */}
      <g transform="rotate(-4 260 200)">
        <path d="M171 96 L171 232 Q171 250 191 250 L329 250 Q349 250 349 232 L349 96"
          fill="none" className="text-line-strong" stroke="currentColor" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round" />
        {/* crack */}
        <path d="M232 250 l8 -22 l-10 -16 l9 -20" fill="none" className="text-brand-orange" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
        <text x="260" y="150" textAnchor="middle" fontSize="13" className="text-subtle" fill="currentColor">empty</text>
      </g>

      {/* uplift arrows */}
      <g className="text-brand-orange" fill="currentColor" stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        {[196, 242, 288].map((x) => (
          <g key={x}>
            <line x1={x} y1="288" x2={x} y2="262" />
            <path d={`M${x - 8} 268 L${x} 254 L${x + 8} 268 Z`} stroke="none" />
          </g>
        ))}
      </g>
      <text x="320" y="284" fontSize="12.5" className="text-brand-orange" fill="currentColor" fontWeight="600">groundwater pressure pushes UP</text>
    </svg>
    <figcaption className="mt-3 text-center text-xs text-subtle">
      Empty, an in-ground shell is a boat. With no water weight holding it down, groundwater pressure can crack it, heave it, or float it right out of the ground.
    </figcaption>
  </figure>
);

type Step = { icon: LucideIcon; title: string; body: ReactNode };
const STEPS: Step[] = [
  {
    icon: Power,
    title: 'Cut the power at the breaker',
    body: (
      <>Flip the <strong>pump breaker off</strong> — not just the timer — before you start. As the water level drops, a running pump can suck air and run dry, which burns up the seal and motor. Killing power also keeps you safe while you’re working around water.</>
    ),
  },
  {
    icon: Ruler,
    title: 'Mark your stop line',
    body: (
      <>Decide how much to remove and mark the target level (a strip of tape on the tile works). Most reasons to drain — high CYA, salt, or calcium — only need a <strong>partial</strong> drain; our <Link to="/cya-calculator">CYA</Link>, <Link to="/salt-calculator">salt</Link>, and <Link to="/calcium-hardness-calculator">calcium</Link> calculators turn your target into exact gallons. Never plan to empty it (see the warning below).</>
    ),
  },
  {
    icon: MapPin,
    title: 'Run the hose downhill to a legal spot',
    body: (
      <>Lead the far end of the hose <strong>downhill</strong> to where it’s legal to discharge — usually a sewer cleanout, not a storm drain, the street, or a neighbor’s yard. Pool water often must be dechlorinated first. The outlet has to end up lower than the pool’s surface for the siphon to pull.</>
    ),
  },
  {
    icon: Droplets,
    title: 'Fill the hose and submerge it to start the siphon',
    body: (
      <>This is the whole trick: get <strong>every bubble of air</strong> out of the hose, then keep one end underwater. Easiest way — sink the entire hose in the pool until it fills completely, cap the outlet end with your thumb, then carry that capped end down below the water line and let go. (Or fill it from a spigot, then move it fast.) <strong>Never start a siphon by mouth</strong> on pool water.</>
    ),
  },
  {
    icon: Hourglass,
    title: 'Let gravity do the work',
    body: (
      <>Once water is flowing it keeps itself going — no pump, no power. A garden hose only moves a few hundred gallons an hour, so a partial drain usually takes a few hours. Check on it; don’t walk away for the day.</>
    ),
  },
  {
    icon: CircleStop,
    title: 'Stop at your mark',
    body: (
      <>When the water reaches your tape line, break the siphon: lift the pool end of the hose up out of the water (or pinch/cap it). Flow stops the moment air gets in or the outlet is no longer below the surface.</>
    ),
  },
  {
    icon: FlaskConical,
    title: 'Power back on, refill, and re-test',
    body: (
      <>Turn the breaker back on, top the pool back up to its normal level, and re-test. A partial drain dilutes <em>everything</em> at once — CYA, salt, calcium, and alkalinity all drop together — so rebalance from a fresh set of readings.</>
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
    q: 'Do I have to turn off the pump to drain my pool?',
    a: 'Yes — switch the pump off at the breaker first. A garden-hose siphon works entirely on gravity and doesn’t use the pump at all, and if the pump keeps running while the water level falls it can suck air and run dry, which damages the seals and motor. Turn it back on once you’ve refilled to the normal level.',
  },
  {
    q: 'How do I start a siphon with a garden hose without sucking on it?',
    a: 'Submerge the whole hose in the pool so it fills completely with water and all the air escapes. Cap the outlet end with your thumb (or a valve), carry that end below the pool’s water level, and let go — gravity takes over. Alternatively, fill the hose from a spigot, then disconnect and drop one end in the pool. Never start a siphon by mouth on pool water; it’s chemically treated.',
  },
  {
    q: 'How long does it take to drain a pool with a garden hose?',
    a: 'A standard garden hose only siphons a few hundred gallons per hour, so it’s best for partial drains. Dropping a 20,000-gallon pool by, say, a third (about 6,500 gallons) can take much of a day. Running two hoses, using a wider hose, or a submersible pump speeds it up — but for the partial drains pool chemistry needs, a single hose overnight is usually fine.',
  },
  {
    q: 'Can I drain my pool all the way to clean it?',
    a: 'Not without serious risk, and not as a DIY siphon job. An empty in-ground pool can be pushed up, cracked, or floated out of the ground by groundwater pressure — the “concrete boat” effect — and vinyl liners shrink and shift when dry. Full drains should be done by a professional who can manage the water table and a hydrostatic relief valve, ideally in dry conditions. For chemistry fixes you only ever need a partial drain.',
  },
  {
    q: 'Where can I drain pool water?',
    a: 'Check your local rules first — many areas require pool water to be dechlorinated and sent to the sanitary sewer (a cleanout), not a storm drain, street, or waterway, because chlorine harms aquatic life. Don’t flood a neighbor’s property. When in doubt, stop chlorinating for a few days first so the water can be discharged safely, and follow your municipality’s guidance.',
  },
  {
    q: 'How much water do I need to drain to lower CYA (or salt/calcium)?',
    a: 'Dilution is proportional: replacing half the water cuts CYA, salt, or calcium roughly in half. To go from 100 ppm CYA to 50, you’d swap about half the pool; to go from 100 to 70, about 30%. Our CYA, salt, and calcium calculators do this exactly — enter your current and target level and they give you the gallons to drain and replace.',
  },
];

const SOURCES = [
  { label: 'U.S. EPA — NPDES (managing pool & non-stormwater discharges)', url: 'https://www.epa.gov/npdes' },
  { label: 'Trouble Free Pool — community wiki', url: 'https://www.troublefreepool.com/wiki/' },
  { label: 'PHTA — Pool & Hot Tub Alliance', url: 'https://www.phta.org/' },
];

export const DrainPoolGuide = () => (
  <GuideLayout
    title={guide.title}
    description="How to drain a pool with a garden-hose siphon, step by step with diagrams — start the siphon, stop at your mark, and never fully drain an in-ground pool."
    path={guide.path}
    updated={guide.updated}
    faqs={FAQS}
    sources={SOURCES}
    cta={{
      to: '/cya-calculator',
      label: 'How much water should you drain?',
      sub: 'Lowering CYA, salt, or calcium? The calculators turn your target into exact gallons to replace.',
    }}
  >
    <p>
      Sometimes the only fix for pool water is to take some out and put fresh water back —
      cyanuric acid that’s climbed too high, salt or calcium you can’t get down any other way. None
      of those need fancy equipment: a <strong>garden-hose siphon</strong> drains water for free,
      using nothing but gravity. Here’s exactly how to do it — and the one rule that keeps a drain
      from turning into a five-figure repair.
    </p>

    <div className="not-prose my-6 flex items-start gap-3 rounded-2xl border border-brand-orange/50 bg-brand-orange/10 p-4 sm:p-5">
      <AlertTriangle className="w-6 h-6 text-brand-orange shrink-0 mt-0.5" />
      <div className="text-[14px] sm:text-[15px] text-fg leading-relaxed">
        <strong>Read this first:</strong> only ever <strong>partially</strong> drain an in-ground pool.
        Emptying it completely and leaving it dry can let groundwater push the shell up, crack it, or
        float it out of the ground — the “concrete boat” effect explained below. Every chemistry fix
        needs only a partial drain.
      </div>
    </div>

    <h2>How a garden-hose siphon works</h2>
    <p>
      A siphon moves water uphill and over the pool wall without any pump. Fill a hose completely
      with water, keep one end submerged in the pool, and run the other end to a spot <em>lower</em>
      than the pool’s surface. Because the long “downhill” side of the hose outweighs the short side
      inside the pool, gravity drags the whole column along and pulls pool water out behind it — and
      it keeps going on its own until you break the chain by letting air in or raising the outlet.
    </p>

    <SiphonDiagram />

    <h2>Step by step</h2>
    <p>The whole job is seven steps. The two that matter most: <strong>kill the pump’s power first</strong>, and get <strong>all the air out of the hose</strong> so the siphon actually catches.</p>

    <StepList />

    <h2>The one rule: never fully drain it (the “concrete boat”)</h2>
    <p>
      An in-ground pool is held in place mostly by the weight of the water in it. Take that water away
      and the empty shell behaves like a <strong>boat</strong> — and the “water” it can float on is
      the groundwater in the soil around and beneath it. After rain, in a high water table, or in
      clay soils that hold moisture, the pressure under an empty shell can be enough to{' '}
      <strong>crack it, heave it, or pop it partway out of the ground</strong>. Plaster pools lift and
      crack; fiberglass shells float; vinyl liners shrink, wrinkle, and tear once they dry out.
    </p>

    <PopUpDiagram />

    <p>
      That’s why every reason covered here uses a <strong>partial</strong> drain — you’re only ever
      swapping a portion of the water, and the pool stays safely weighted the whole time. If you
      genuinely need to empty a pool (a full re-plaster, a liner change), that’s a job for a pro who
      can manage the water table and a hydrostatic relief valve, in dry conditions — not a garden-hose
      weekend project.
    </p>

    <h2>How much should you drain?</h2>
    <p>
      Dilution is proportional: swap half the water and you roughly halve whatever you’re chasing
      down. The exact amount depends on your current level and target, so let the calculators do it —
      the <Link to="/cya-calculator">CYA calculator</Link> (the usual reason to drain), the{' '}
      <Link to="/salt-calculator">salt calculator</Link>, and the{' '}
      <Link to="/calcium-hardness-calculator">calcium hardness calculator</Link> each turn your numbers
      into the gallons to drain and replace. Mark that level on the tile, siphon down to it, refill,
      and re-test.
    </p>
  </GuideLayout>
);
