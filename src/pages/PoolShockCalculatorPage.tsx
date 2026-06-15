import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Info, Plus, AlertTriangle, Sun, ArrowRight, Check } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { RelatedGuides } from '@/components/RelatedGuides';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import { getProfile } from '@/lib/poolProfile';
import {
  PRODUCTS,
  getProduct,
  toGallons,
  doseOunces,
  algaeShockFc,
  breakpointFc,
  formatAmount,
} from '@/lib/chlorine';
import {
  useShareableState,
  codecs,
  type ShareSchema,
} from '@/lib/useShareableState';

// ── constants / styles ────────────────────────────────────────────
const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const PRODUCT_IDS = ['liquid', 'bleach', 'calhypo', 'dichlor', 'trichlor', 'lithium'] as const;

// ── shareable state ───────────────────────────────────────────────
type State = {
  reason: 'algae' | 'chloramine' | 'custom';
  volume: string;
  volUnit: 'gal' | 'L';
  currentFc: string;
  cya: string; // drives the algae (SLAM) shock level
  cc: string; // combined chlorine — drives the breakpoint level
  targetFc: string; // custom shock target
  productId: (typeof PRODUCT_IDS)[number];
  strength: number;
};

const DEFAULTS: State = {
  reason: 'algae',
  volume: '20000',
  volUnit: 'gal',
  currentFc: '0',
  cya: '40',
  cc: '0.5',
  targetFc: '12',
  productId: 'liquid',
  strength: 12.5,
};

const SCHEMA = {
  reason: { param: 'r', ...codecs.oneOf(['algae', 'chloramine', 'custom'] as const) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  currentFc: { param: 'fc', ...codecs.numStr() },
  cya: { param: 'cya', ...codecs.numStr() },
  cc: { param: 'cc', ...codecs.numStr() },
  targetFc: { param: 't', ...codecs.numStr() },
  productId: { param: 'p', ...codecs.oneOf(PRODUCT_IDS) },
  strength: { param: 's', ...codecs.num() },
} satisfies ShareSchema<State>;

// ── FAQ (on-page + JSON-LD) ───────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much shock do I need for my pool?',
    a: 'It depends on your pool volume, how high you need to raise free chlorine, and the shock product. Raising free chlorine by 1 ppm in 10,000 gallons takes about 1.3 fl oz of liquid chlorine (or 1.3 weight oz of a granular product), divided by the product’s available-chlorine strength. To clear algae you raise to roughly 40% of your CYA and hold it; to clear chloramines (the “chlorine smell”) you raise to about 10× the combined chlorine. Enter your numbers above and the calculator gives the exact amount.',
  },
  {
    q: 'How much shock for a 10,000, 15,000, or 20,000 gallon pool?',
    a: 'Scale the dose with volume. A common algae-clearing target is about 12 ppm of free chlorine. Starting from 0 ppm, reaching 12 ppm takes roughly 1.25 gallons of 12.5% liquid chlorine in 10,000 gallons, about 1.9 gallons in 15,000 gallons, and about 2.5 gallons in 20,000 gallons. Higher CYA needs a higher target (and more shock); the calculator handles the exact math for your pool.',
  },
  {
    q: 'What kind of chlorine should I use to shock?',
    a: 'Use an unstabilized, fast-acting chlorine: liquid chlorine (sodium hypochlorite) or cal-hypo (calcium hypochlorite). They spike free chlorine quickly and add no cyanuric acid. Avoid shocking with stabilized products like dichlor or trichlor — they dump CYA into the water every time, and rising CYA makes your chlorine progressively weaker.',
  },
  {
    q: 'How long after shocking can I swim?',
    a: 'Wait until free chlorine falls back below the safe ceiling for your stabilizer level — about 40% of your CYA (the shock level), or 5 ppm or less in a pool with no CYA — and the water is clear. After a big shock that can take from hours to a day or two, depending on sun and CYA. Always retest before anyone gets in; swimming in over-shocked water can irritate skin and eyes and damage swimwear.',
  },
  {
    q: 'Should I shock during the day or at night?',
    a: 'Shock at dusk or after dark. UV sunlight destroys unprotected free chlorine fast — up to half within about 17 minutes of direct sun — so shocking at midday wastes much of the dose before it can work. Adding it in the evening and running the pump overnight gives the chlorine hours to do its job.',
  },
  {
    q: 'Why isn’t my pool clearing after I shock it?',
    a: 'The two usual causes are not going high enough and not holding the level. Algae keeps consuming chlorine, so a single dose drops quickly — you have to re-test and re-dose to keep free chlorine at the shock level until the water is clear and chlorine stops falling overnight (the SLAM method). Very high CYA also raises the shock level you need; if CYA is above roughly 80–100 ppm, partially draining and refilling first makes shocking far more effective.',
  },
  {
    q: 'Does shocking raise cyanuric acid (CYA)?',
    a: 'Only if you shock with a stabilized product. Liquid chlorine and cal-hypo add no CYA, so they’re the right choice for shocking. Dichlor and trichlor are stabilized — every shock with them raises CYA, which is why repeated tablet-and-shock routines slowly over-stabilize a pool and weaken the chlorine.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate how much shock to add to a pool',
  description:
    'Work out exactly how much pool shock to add to reach your shock chlorine level, based on pool volume, current free chlorine, CYA or combined chlorine, and the shock product.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter your pool volume', text: 'Enter how many gallons (or liters) your pool holds.' },
    { '@type': 'HowToStep', position: 2, name: 'Choose why you’re shocking', text: 'Pick algae (uses your CYA to set the shock level), chloramines (uses combined chlorine), or a custom target.' },
    { '@type': 'HowToStep', position: 3, name: 'Enter current free chlorine', text: 'Enter your current free chlorine so the calculator knows how far it has to raise it.' },
    { '@type': 'HowToStep', position: 4, name: 'Pick your shock product', text: 'Choose liquid chlorine or cal-hypo and its strength.' },
    { '@type': 'HowToStep', position: 5, name: 'Read the dose', text: 'The calculator shows the shock level to reach and exactly how much product to add.' },
  ],
};
const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
};
const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Free Pool Tools', item: SITE_ORIGIN + '/' },
    { '@type': 'ListItem', position: 2, name: 'Pool Shock Calculator', item: SITE_ORIGIN + '/pool-shock-calculator/' },
  ],
};

export const PoolShockCalculatorPage = () => {
  usePageMeta({
    title: 'Pool Shock Calculator: How Much Shock to Add',
    description:
      'Free pool shock calculator — how much liquid chlorine or cal-hypo to shock your pool for algae or chloramines. CYA-aware shock levels, any size.',
    canonicalPath: '/pool-shock-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { reason, volume, volUnit, currentFc, cya, cc, targetFc, productId, strength } = state;

  // Prefill volume + CYA from a saved pool on a clean load (no URL params), so a
  // tech who saved their pool elsewhere on the site lands ready to go. Shared
  // links (which carry params) always take precedence.
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.search) return;
    const p = getProfile();
    const next: Partial<State> = {};
    if (p.volumeGal) {
      next.volume = String(p.volumeGal);
      next.volUnit = 'gal';
    }
    if (p.cya != null && Number.isFinite(p.cya)) next.cya = String(p.cya);
    if (Object.keys(next).length) patch(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = getProduct(productId);
  const volumeGal = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const currentFcNum = num(currentFc);

  // Shock target FC depends on why you're shocking.
  const shockTarget = useMemo(() => {
    if (reason === 'algae') return algaeShockFc(num(cya));
    if (reason === 'chloramine') return breakpointFc(num(cc));
    return num(targetFc);
  }, [reason, cya, cc, targetFc]);

  const deltaFc = Math.max(0, shockTarget - currentFcNum);
  const dose = doseOunces(volumeGal, deltaFc, strength);

  // ── warnings ──
  const warnings: { tone: 'warn' | 'info'; text: string; cta?: { to: string; label: string } }[] = [];
  if (!product.goodForShock) {
    warnings.push({
      tone: 'warn',
      text: `${product.label} isn’t ideal for shocking — stabilized products add CYA every time. Use unstabilized liquid chlorine or cal-hypo to shock.`,
    });
  }
  if (reason === 'algae' && num(cya) > 80) {
    warnings.push({
      tone: 'warn',
      text: `Your CYA (${num(cya)} ppm) is high, so the algae shock level is very high and hard to hold. Consider partially draining and refilling to lower CYA before shocking.`,
      cta: { to: `/cya-calculator/?v=${Math.round(volumeGal)}&u=gal&cya=${num(cya)}`, label: 'Lower CYA →' },
    });
  }
  if (deltaFc <= 0 && volumeGal > 0) {
    warnings.push({
      tone: 'info',
      text: 'Your current free chlorine is already at or above the shock level — no shock needed right now. Re-test and hold the level until the water is clear.',
    });
  }
  if (product.addsCalcium) {
    warnings.push({ tone: 'info', text: 'Cal-hypo adds calcium hardness over time and should be pre-dissolved in a bucket of water before adding.' });
  }

  // Small reusable segmented control.
  const Seg = <T extends string>(
    opts: { id: T; label: string }[],
    value: T,
    onPick: (v: T) => void,
  ) => (
    <div className="inline-flex rounded-xl border border-line bg-card-2 p-1 flex-wrap">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          aria-pressed={value === o.id}
          className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors ${
            value === o.id ? 'seg-active text-fg' : 'text-muted hover:text-fg'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageShell>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <Zap className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool Shock Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          Exactly how much shock to add to clear algae or chloramines — for any pool size, using
          unstabilized chlorine and your CYA, the way the pros do it.
        </p>
        <ul className="flex flex-wrap justify-center gap-2 mt-6">
          {['Algae & chloramine modes', 'CYA-aware shock level', 'Any pool size', 'No email required'].map((label) => (
            <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3 py-1.5 text-xs font-semibold text-muted">
              <Check className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Calculator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Inputs */}
          <div className="rounded-2xl border border-line bg-card p-5 sm:p-6 elevate">
            {/* Reason */}
            <p className={labelClass}>Why are you shocking?</p>
            <div className="mb-5">
              {Seg(
                [
                  { id: 'algae' as State['reason'], label: 'Algae / green' },
                  { id: 'chloramine' as State['reason'], label: 'Chloramines / smell' },
                  { id: 'custom' as State['reason'], label: 'Custom target' },
                ],
                reason,
                (v) => set('reason', v),
              )}
            </div>

            {/* Volume */}
            <div className="flex flex-wrap items-end gap-4 mb-5">
              <div className="flex-1 min-w-[180px]">
                <label htmlFor="vol" className={labelClass}>Pool volume</label>
                <input
                  id="vol"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={volume}
                  onChange={(e) => set('volume', e.target.value)}
                  placeholder="e.g. 20000"
                  className={fieldClass}
                />
              </div>
              <div>
                <p className={labelClass}>Unit</p>
                {Seg(
                  [
                    { id: 'gal' as State['volUnit'], label: 'Gallons' },
                    { id: 'L' as State['volUnit'], label: 'Liters' },
                  ],
                  volUnit,
                  (v) => set('volUnit', v),
                )}
              </div>
            </div>
            <p className="text-xs text-subtle -mt-3 mb-5">
              Not sure how many gallons?{' '}
              <Link to="/pool-volume-calculator/" className="text-brand-orange font-semibold hover:underline">
                Use the pool volume calculator →
              </Link>
            </p>

            {/* Current FC + the reason-specific input */}
            <div className="grid sm:grid-cols-2 gap-4 mb-5">
              <div>
                <label htmlFor="cfc" className={labelClass}>Current free chlorine (ppm)</label>
                <input
                  id="cfc"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={currentFc}
                  onChange={(e) => set('currentFc', e.target.value)}
                  placeholder="e.g. 0"
                  className={fieldClass}
                />
              </div>

              {reason === 'algae' && (
                <div>
                  <label htmlFor="cya" className={labelClass}>Cyanuric acid / CYA (ppm)</label>
                  <input
                    id="cya"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={cya}
                    onChange={(e) => set('cya', e.target.value)}
                    placeholder="e.g. 40"
                    className={fieldClass}
                  />
                </div>
              )}
              {reason === 'chloramine' && (
                <div>
                  <label htmlFor="cc" className={labelClass}>Combined chlorine / CC (ppm)</label>
                  <input
                    id="cc"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={cc}
                    onChange={(e) => set('cc', e.target.value)}
                    placeholder="e.g. 0.5"
                    className={fieldClass}
                  />
                </div>
              )}
              {reason === 'custom' && (
                <div>
                  <label htmlFor="t" className={labelClass}>Target free chlorine (ppm)</label>
                  <input
                    id="t"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    value={targetFc}
                    onChange={(e) => set('targetFc', e.target.value)}
                    placeholder="e.g. 12"
                    className={fieldClass}
                  />
                </div>
              )}
            </div>

            {/* Product + strength */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="prod" className={labelClass}>Shock product</label>
                <select
                  id="prod"
                  value={productId}
                  onChange={(e) => {
                    const p = getProduct(e.target.value);
                    patch({ productId: p.id as State['productId'], strength: p.strengths[0] });
                  }}
                  className={fieldClass}
                >
                  {PRODUCTS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                      {p.goodForShock ? ' — good for shock' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="str" className={labelClass}>Strength (% available chlorine)</label>
                <select
                  id="str"
                  value={strength}
                  onChange={(e) => set('strength', parseFloat(e.target.value))}
                  className={fieldClass}
                >
                  {product.strengths.map((s) => (
                    <option key={s} value={s}>{s}%</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-2xl border border-brand-orange/30 bg-brand-orange/[0.06] p-5 sm:p-6 flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-orange mb-1">Add this much</p>
            <p className="font-display font-bold text-fg text-3xl sm:text-4xl leading-tight tabular-nums">
              {formatAmount(dose, product.phase)}
            </p>
            <p className="text-muted text-sm mt-1">of {product.short}</p>

            <div className="mt-5 space-y-2.5 text-sm border-t border-line pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted">Shock level to reach</span>
                <span className="text-fg font-semibold tabular-nums">{shockTarget.toFixed(1)} ppm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">From current</span>
                <span className="text-fg font-semibold tabular-nums">{currentFcNum.toFixed(1)} ppm</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Raise by</span>
                <span className="text-fg font-semibold tabular-nums">{deltaFc.toFixed(1)} ppm</span>
              </div>
            </div>

            <div className="mt-5">
              <ShareButton url={shareUrl} />
            </div>
          </div>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-5 space-y-2.5">
            {warnings.map((w, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  w.tone === 'warn'
                    ? 'border-amber-500/30 bg-amber-500/[0.07] text-amber-200'
                    : 'border-line bg-card text-muted'
                }`}
              >
                {w.tone === 'warn' ? (
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
                ) : (
                  <Info className="w-4 h-4 mt-0.5 shrink-0 text-subtle" />
                )}
                <span className="leading-relaxed">
                  {w.text}{' '}
                  {w.cta && (
                    <Link to={w.cta.to} className="font-semibold underline whitespace-nowrap">
                      {w.cta.label}
                    </Link>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Supporting content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 space-y-10">
        <div>
          <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-3">What “shocking” a pool actually means</h2>
          <p className="text-muted leading-relaxed text-[15px]">
            Shocking is simply raising your pool’s free chlorine sharply — far above its everyday
            level — to do a job normal dosing can’t. The two big jobs are <strong className="text-fg font-semibold">killing
            algae</strong> (green, cloudy, or slimy water) and <strong className="text-fg font-semibold">breaking apart
            chloramines</strong>, the combined-chlorine compounds that cause the harsh “chlorine smell”
            and stinging eyes. A correctly sized shock pushes chlorine past the point where those
            problems break down, then settles back to normal over a day or two.
          </p>
        </div>

        <div>
          <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-3">How much shock to add (the math)</h2>
          <p className="text-muted leading-relaxed text-[15px] mb-3">
            Every shock calculation comes down to one rule of thumb, then scaled to your pool:
          </p>
          <div className="rounded-xl border border-line bg-card-2 px-5 py-4 text-fg font-mono text-sm leading-relaxed">
            amount = 1.3 × (gallons ÷ 10,000) × ppm&nbsp;to&nbsp;raise ÷ (strength ÷ 100)
          </div>
          <p className="text-muted leading-relaxed text-[15px] mt-3">
            The <strong className="text-fg font-semibold">1.3</strong> is fluid ounces for liquids (or
            weight ounces for granular products) needed to move free chlorine 1 ppm in 10,000 gallons.
            Dividing by the product’s available-chlorine strength is why weaker bleach needs more than
            strong liquid chlorine. The only question left is <em>how high to shock</em>, which depends
            on why you’re doing it:
          </p>
          <ul className="mt-3 space-y-2 text-[15px] text-muted">
            <li className="flex gap-2"><span className="text-brand-orange font-bold">•</span><span><strong className="text-fg font-semibold">Algae:</strong> raise free chlorine to about 40% of your CYA (with a sensible floor around 12 ppm) and <em>hold</em> it there until the water clears — the SLAM method. Full walkthrough: <Link to="/guides/how-to-fix-a-green-pool/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">how to fix a green pool</Link>.</span></li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">•</span><span><strong className="text-fg font-semibold">Chloramines:</strong> raise to roughly 10× your combined chlorine to hit “breakpoint,” where the chloramines are destroyed.</span></li>
            <li className="flex gap-2"><span className="text-brand-orange font-bold">•</span><span><strong className="text-fg font-semibold">Routine / opening:</strong> a custom target (often 10–12 ppm) for a general clean-up.</span></li>
          </ul>
        </div>

        <div>
          <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-3">Worked example</h2>
          <p className="text-muted leading-relaxed text-[15px]">
            A 20,000-gallon pool with CYA at 40 and free chlorine at 0 needs an algae shock level of
            about <strong className="text-fg font-semibold">16 ppm</strong> (40% of 40, floored at 12 → 16).
            Raising 0 → 16 ppm is 16 ppm × 1.3 × (20,000 ÷ 10,000) ÷ 0.125 for 12.5% liquid chlorine
            ≈ <strong className="text-fg font-semibold">333 fl oz, about 2.6 gallons</strong> of liquid chlorine.
            Add it at dusk, run the pump overnight, then re-test and re-dose to hold 16 ppm until the
            water is clear.
          </p>
        </div>

        <div className="rounded-xl border border-line bg-card p-5 flex gap-3">
          <Sun className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
          <p className="text-muted leading-relaxed text-[15px]">
            <strong className="text-fg font-semibold">Always shock with unstabilized chlorine</strong> — liquid
            chlorine or cal-hypo — at dusk or after dark, and never let CYA-adding tablets (trichlor/dichlor)
            do your shocking. Wait until free chlorine drops back below the safe level for your CYA —
            about 40% of your stabilizer reading, or 5 ppm if unstabilized —{' '}
            <Link to="/guides/how-long-after-shocking-pool-can-you-swim/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              before swimming
            </Link>
            , and keep pets and people out of over-shocked water.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-5">Common questions</h2>
        <div className="rounded-2xl border border-line bg-card divide-y divide-line elevate">
          {FAQS.map((item) => (
            <details key={item.q} className="group">
              <summary className="list-none cursor-pointer flex items-start justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                <span className="font-display font-normal text-fg text-[15px] sm:text-base leading-snug">{item.q}</span>
                <span className="shrink-0 mt-0.5 text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange">
                  <Plus className="w-5 h-5" />
                </span>
              </summary>
              <p className="px-5 sm:px-6 pb-5 -mt-1 text-muted leading-relaxed text-[15px]">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="text-xs text-subtle mt-4 flex items-center gap-1.5">
          <ArrowRight className="w-3.5 h-3.5" />
          For everyday chlorine top-ups (not shocking), use the{' '}
          <Link to="/chlorine-calculator/" className="text-brand-orange font-semibold hover:underline">chlorine calculator</Link>.
        </p>
      </section>

      <RelatedGuides
        guides={[
          {
            to: '/guides/how-often-to-shock-your-pool/',
            title: 'How often to shock your pool',
            excerpt: 'Six triggers that tell you it’s time to shock — and when shocking does more harm than good.',
          },
          {
            to: '/guides/how-long-after-shocking-pool-can-you-swim/',
            title: 'How long after shocking can you swim?',
            excerpt: 'The honest answer is a test reading, not a clock: when it’s safe to get back in.',
          },
          {
            to: '/guides/how-to-fix-a-green-pool/',
            title: 'How to fix a green pool',
            excerpt: 'Algae bloom? The step-by-step shock-to-clear rescue with exact doses for your pool.',
          },
        ]}
      />
      <RelatedTools currentPath="/pool-shock-calculator" />
    </PageShell>
  );
};
