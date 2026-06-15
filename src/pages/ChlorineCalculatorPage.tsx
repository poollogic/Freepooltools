import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FlaskConical, Info, Check, Plus, AlertTriangle, Sun, Beaker, Save } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { RelatedGuides } from '@/components/RelatedGuides';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import { usePoolProfile, getProfile, saveProfile, clearProfile } from '@/lib/poolProfile';
import {
  PRODUCTS,
  getProduct,
  toGallons,
  doseOunces,
  recommendedFc,
  algaeShockFc,
  breakpointFc,
  defaultDailyLoss,
  formatAmount,
  type Environment,
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
  mode: 'add' | 'shock';
  env: Environment;
  volume: string;
  volUnit: 'gal' | 'L';
  cya: string;
  currentFc: string;
  targetFc: string; // blank → use the CYA-based recommendation
  productId: (typeof PRODUCT_IDS)[number];
  strength: number;
  dailyLoss: string; // blank → environment default
  shockReason: 'algae' | 'chloramine';
  cc: string; // combined chlorine
};

const DEFAULTS: State = {
  mode: 'add',
  env: 'outdoor',
  volume: '20000',
  volUnit: 'gal',
  cya: '40',
  currentFc: '0',
  targetFc: '',
  productId: 'liquid',
  strength: 12.5,
  dailyLoss: '',
  shockReason: 'algae',
  cc: '0.5',
};

const SCHEMA = {
  mode: { param: 'mode', ...codecs.oneOf(['add', 'shock'] as const) },
  env: { param: 'env', ...codecs.oneOf(['outdoor', 'indoor', 'spa'] as const) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  cya: { param: 'cya', ...codecs.numStr() },
  currentFc: { param: 'fc', ...codecs.numStr() },
  targetFc: { param: 't', ...codecs.numStr() },
  productId: { param: 'p', ...codecs.oneOf(PRODUCT_IDS) },
  strength: { param: 's', ...codecs.num() },
  dailyLoss: { param: 'loss', ...codecs.numStr() },
  shockReason: { param: 'sr', ...codecs.oneOf(['algae', 'chloramine'] as const) },
  cc: { param: 'cc', ...codecs.numStr() },
} satisfies ShareSchema<State>;

// ── FAQ (on-page + JSON-LD) ───────────────────────────────────────
const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much chlorine do I add to my pool?',
    a: 'Enter your pool volume, current free chlorine, and target, then pick your product — the calculator multiplies 1.3 oz per 10,000 gallons per 1 ppm and divides by the product’s available-chlorine strength. As a rough guide, about 10–11 fl oz of 12.5% liquid chlorine raises a 10,000-gallon pool by 1 ppm.',
  },
  {
    q: 'How much liquid chlorine per 10,000 gallons?',
    a: 'Roughly 10.7 fl oz of 12% sodium hypochlorite (liquid chlorine) raises free chlorine by 1 ppm in 10,000 gallons. Stronger 12.5% liquid needs a touch less; weaker 10% needs a bit more. The calculator scales this exactly to your volume and target.',
  },
  {
    q: 'How much bleach do I add instead of pool chlorine?',
    a: 'Household bleach is the same chemical (sodium hypochlorite) but weaker — usually 6–8.25% versus 10–12.5% for pool liquid chlorine — so you need more of it. Select “Household bleach” and its strength and the calculator adjusts the amount. Use plain, unscented bleach only.',
  },
  {
    q: 'Why does my chlorine disappear in the sun?',
    a: 'UV sunlight destroys unprotected free chlorine fast — about half within 17 minutes of direct sun, and 50–90% within a few hours. Cyanuric acid (CYA / stabilizer) shields chlorine from UV so it lasts 3–5× longer. For any outdoor pool, keep CYA around 30–50 ppm; without it you’ll never hold a chlorine level through the afternoon.',
  },
  {
    q: 'How often do I need to add chlorine?',
    a: 'Chlorine is consumed continuously by sunlight, swimmers, and debris — a typical stabilized outdoor pool loses about 2–4 ppm of free chlorine per day. That makes chlorine a recurring task: most pools need topping up every day or two, or a larger dose two to three times a week. The calculator’s “Keeping it there” panel estimates your daily loss and the maintenance dose to hold your target.',
  },
  {
    q: 'Do chlorine tablets (trichlor) raise cyanuric acid?',
    a: 'Yes. Trichlor tablets and dichlor granules are “stabilized” — they dissolve cyanuric acid (CYA) into the water along with chlorine. Trichlor adds about 0.6 ppm CYA for every 1 ppm of free chlorine it delivers (dichlor about 0.9), so steady tablet use can push CYA up 40+ ppm over a summer. Because CYA only leaves by draining and refilling, it builds up — and once it passes roughly 50–80 ppm your chlorine turns sluggish (“over-stabilization”). If you rely on tablets, test CYA regularly and switch to liquid chlorine or cal-hypo (which add no CYA) when it climbs. This calculator shows how much CYA your chosen product adds, per dose and per month.',
  },
  {
    q: 'What’s the difference between adding chlorine and shocking?',
    a: 'Normal dosing keeps free chlorine in its everyday range. Shocking raises it sharply to burn off chloramines (the “chlorine smell,” from combined chlorine) or to kill algae. Breakpoint for chloramines is about 10× the combined chlorine level; algae cleanup runs around 40% of your CYA. Always shock with unstabilized chlorine (liquid or cal-hypo), never tablets.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate how much chlorine to add to a pool',
  description:
    'Work out exactly how much chlorine to add to raise your pool to its target free-chlorine level, based on volume, current chlorine, cyanuric acid, and chlorine product.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter your pool volume', text: 'Enter how many gallons (or liters) your pool holds.' },
    { '@type': 'HowToStep', position: 2, name: 'Enter current chlorine and CYA', text: 'Enter your current free chlorine and, for outdoor pools, your cyanuric acid level.' },
    { '@type': 'HowToStep', position: 3, name: 'Pick a target and product', text: 'Use the recommended target (set by your CYA) and choose your chlorine product and strength.' },
    { '@type': 'HowToStep', position: 4, name: 'Read the dose', text: 'The calculator shows exactly how much chlorine to add, plus the upkeep dose to hold it.' },
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
    { '@type': 'ListItem', position: 2, name: 'Pool Chlorine Calculator', item: SITE_ORIGIN + '/chlorine-calculator/' },
  ],
};

export const ChlorineCalculatorPage = () => {
  usePageMeta({
    title: 'Pool Chlorine Calculator: How Much to Add | Free Pool Tools',
    description:
      'Free pool chlorine calculator — how much liquid chlorine, bleach, or shock your pool needs to hit your target. CYA-aware doses, any pool size. No sign-up.',
    canonicalPath: '/chlorine-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { mode, env, volume, volUnit, cya, currentFc, targetFc, productId, strength, dailyLoss, shockReason, cc } = state;

  const profile = usePoolProfile();
  const [usingSavedPool, setUsingSavedPool] = useState(false);
  const [savedPool, setSavedPool] = useState(false);

  // Prefill from the saved pool ONLY on a clean load (no URL params). Shared
  // links and the volume→chlorine handoff (?v=…) take precedence. Saving is
  // opt-in, so a technician who never saves always gets a clean form.
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.search) return;
    const p = getProfile();
    const next: Partial<State> = {};
    if (p.volumeGal) {
      next.volume = String(p.volumeGal);
      next.volUnit = 'gal';
    }
    if (p.cya != null && Number.isFinite(p.cya)) next.cya = String(p.cya);
    if (Object.keys(next).length) {
      patch(next);
      setUsingSavedPool(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = getProduct(productId);
  const volumeGal = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const cyaNum = num(cya);
  const rec = useMemo(() => recommendedFc(env, cyaNum), [env, cyaNum]);
  const isOutdoor = env === 'outdoor';

  // Effective operating target: the user's override if set, else the CYA-based rec.
  const effectiveTarget = num(targetFc) > 0 ? num(targetFc) : rec.mid;
  const currentFcNum = num(currentFc);

  // ── ADD mode ──
  const deltaFc = Math.max(0, effectiveTarget - currentFcNum);
  const dose = doseOunces(volumeGal, deltaFc, strength);
  const cyaAdded = product.addsCyaPerPpm ? deltaFc * product.addsCyaPerPpm : 0;

  // ── Upkeep (how long will it last) ──
  const loss = num(dailyLoss) > 0 ? num(dailyLoss) : defaultDailyLoss(env, cyaNum);
  const daysUntilMin = loss > 0 ? (effectiveTarget - rec.min) / loss : 0;
  const perDayDose = doseOunces(volumeGal, loss, strength);
  const perWeekDose = doseOunces(volumeGal, loss * 7, strength);
  // If maintaining with a stabilized product (trichlor/dichlor), how much CYA
  // that adds per month at this loss rate — the hidden cost of tablets.
  const monthlyCyaFromTabs = product.addsCyaPerPpm ? Math.round(loss * 30 * product.addsCyaPerPpm) : 0;

  // ── SHOCK mode ──
  const shockTarget = shockReason === 'algae' ? algaeShockFc(cyaNum) : breakpointFc(num(cc));
  const deltaShock = Math.max(0, shockTarget - currentFcNum);
  const shockDose = doseOunces(volumeGal, deltaShock, strength);

  // ── warnings ──
  const warnings: { tone: 'warn' | 'info'; text: string; cta?: { to: string; label: string } }[] = [];
  if (isOutdoor && cyaNum < 20) {
    warnings.push({
      tone: 'warn',
      text: 'Your cyanuric acid (CYA) is low for an outdoor pool. UV can destroy half your chlorine within ~17 minutes, so it will burn off fast — add stabilizer to bring CYA to 30–50 ppm.',
      cta: { to: `/cya-calculator/?mode=raise&v=${Math.round(volumeGal)}&u=gal&cya=${cyaNum}`, label: 'Raise CYA →' },
    });
  }
  if (isOutdoor && num(targetFc) > 0 && num(targetFc) < rec.min) {
    warnings.push({ tone: 'warn', text: `A target of ${num(targetFc)} ppm is below the minimum (${rec.min} ppm) for CYA ${cyaNum}. Chlorine may not sanitize effectively.` });
  }
  if (cyaAdded >= 1) {
    warnings.push({ tone: 'info', text: `${product.label} adds cyanuric acid — about ${cyaAdded.toFixed(1)} ppm CYA from this dose. Repeated use raises CYA; watch your stabilizer level.` });
  }
  if (product.addsCalcium) {
    warnings.push({ tone: 'info', text: 'Cal-hypo adds calcium hardness over time, and should be pre-dissolved in water before adding.' });
  }
  if (mode === 'shock' && !product.goodForShock) {
    warnings.push({ tone: 'warn', text: `${product.label} isn’t ideal for shocking. Use unstabilized chlorine — liquid chlorine or cal-hypo — to reach breakpoint.` });
  }
  warnings.push({
    tone: 'info',
    text: `This product tends to ${product.ph === 'neutral' ? 'have little pH effect' : product.ph + ' pH'}. Re-check pH after dosing and keep it 7.2–7.8 so chlorine works well.`,
  });

  const showResult = volumeGal > 0 && (mode === 'add' ? deltaFc > 0 : deltaShock > 0);

  // ── small UI helpers ──
  const Seg = <T extends string>(opts: { id: T; label: string }[], value: T, onSet: (v: T) => void) => (
    <div className="inline-flex flex-wrap rounded-xl border border-line bg-card-2 p-1">
      {opts.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSet(o.id)}
          aria-pressed={value === o.id}
          className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${
            value === o.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'
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
          <FlaskConical className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool Chlorine Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          Exactly how much chlorine to add to hit your target — liquid, bleach, cal-hypo, dichlor, or
          trichlor. CYA-aware targets, a shock mode, and how often you’ll need to re-dose.
        </p>
        <ul className="flex flex-wrap justify-center gap-2 mt-6">
          {['CYA-aware targets', 'Every chlorine type', 'Upkeep estimate', 'No email required'].map((label) => (
            <li key={label} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3 py-1.5 text-xs font-semibold text-muted">
              <Check className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Calculator */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-3xl border border-line bg-card p-5 sm:p-8 shadow-card elevate">
          {usingSavedPool && profile.volumeGal && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-2.5">
              <span className="text-sm text-fg font-medium inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-blue-light shrink-0" />
                Using your saved pool ({profile.volumeGal.toLocaleString('en-US')} gal
                {profile.cya != null ? `, CYA ${profile.cya}` : ''})
              </span>
              <button
                type="button"
                onClick={() => {
                  clearProfile();
                  patch({ volume: '', cya: '' });
                  setUsingSavedPool(false);
                }}
                className="text-xs font-semibold text-muted hover:text-fg shrink-0 whitespace-nowrap"
              >
                Not my pool? Clear
              </button>
            </div>
          )}

          {/* Mode */}
          <div className="grid grid-cols-2 gap-2 mb-6 rounded-xl border border-line bg-card-2 p-1">
            {([
              { id: 'add', label: 'Add chlorine' },
              { id: 'shock', label: 'Shock' },
            ] as { id: State['mode']; label: string }[]).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => set('mode', m.id)}
                aria-pressed={mode === m.id}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                  mode === m.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Environment + volume */}
          <div className="flex flex-wrap items-end gap-4 mb-5">
            <div>
              <p className={labelClass}>Pool type</p>
              {Seg(
                [
                  { id: 'outdoor' as Environment, label: 'Outdoor' },
                  { id: 'indoor' as Environment, label: 'Indoor' },
                  { id: 'spa' as Environment, label: 'Spa / Hot tub' },
                ],
                env,
                (v) => set('env', v),
              )}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label htmlFor="vol" className={labelClass}>Pool volume</label>
              <div className="flex gap-2">
                <input id="vol" type="number" inputMode="decimal" min="0" value={volume}
                  onChange={(e) => set('volume', e.target.value)} placeholder="e.g. 20000" className={fieldClass} />
                <div className="inline-flex rounded-xl border border-line bg-card-2 p-1 shrink-0">
                  {(['gal', 'L'] as const).map((u) => (
                    <button key={u} type="button" onClick={() => set('volUnit', u)} aria-pressed={volUnit === u}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${volUnit === u ? 'bg-card-3 text-fg' : 'text-muted hover:text-fg'}`}>
                      {u === 'gal' ? 'Gallons' : 'Liters'}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-subtle mt-1">
                Not sure? <Link to="/pool-volume-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">Find your pool volume →</Link>
              </p>
            </div>
            <div>
              <label htmlFor="curfc" className={labelClass}>Current free chlorine (ppm)</label>
              <input id="curfc" type="number" inputMode="decimal" min="0" value={currentFc}
                onChange={(e) => set('currentFc', e.target.value)} placeholder="e.g. 0" className={fieldClass} />
            </div>
          </div>

          {/* CYA (outdoor only) */}
          {isOutdoor && (
            <div className="mb-5 rounded-2xl border border-line bg-card-2 p-4">
              <div className="flex items-start gap-2">
                <Sun className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
                <div className="flex-1">
                  <label htmlFor="cya" className={labelClass}>Cyanuric acid / CYA (ppm)</label>
                  <input id="cya" type="number" inputMode="decimal" min="0" value={cya}
                    onChange={(e) => set('cya', e.target.value)} placeholder="e.g. 40" className={fieldClass} />
                  <p className="text-[11px] text-subtle mt-1.5 leading-relaxed">
                    CYA shields chlorine from sunlight — essential outdoors. It also sets your correct
                    chlorine target: <strong className="text-muted">higher CYA needs more chlorine</strong>. Ideal range 30–50 ppm.{' '}
                    <a href="/guides/cyanuric-acid-and-chlorine/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
                      How CYA affects chlorine →
                    </a>
                  </p>
                </div>
              </div>
            </div>
          )}

          {mode === 'add' ? (
            <>
              {/* Target FC */}
              <div className="mb-5">
                <label htmlFor="tgt" className={labelClass}>Target free chlorine (ppm)</label>
                <input id="tgt" type="number" inputMode="decimal" min="0" value={targetFc}
                  onChange={(e) => set('targetFc', e.target.value)} placeholder={`${rec.mid}`} className={fieldClass} />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[12px] text-subtle">
                    Recommended <strong className="text-muted">{rec.low}–{rec.high} ppm</strong> (min {rec.min})
                    {isOutdoor ? ` for CYA ${cyaNum}` : ''}.
                  </span>
                  <button type="button" onClick={() => set('targetFc', String(rec.mid))}
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-card-2 px-2.5 py-1 text-[11px] font-semibold text-brand-orange hover:text-brand-orange-dark">
                    Use {rec.mid} ppm
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Shock reason */}
              <div className="mb-5">
                <p className={labelClass}>Why are you shocking?</p>
                {Seg(
                  [
                    { id: 'algae' as State['shockReason'], label: 'Algae / green water' },
                    { id: 'chloramine' as State['shockReason'], label: 'Chlorine smell / chloramines' },
                  ],
                  shockReason,
                  (v) => set('shockReason', v),
                )}
                {shockReason === 'chloramine' && (
                  <div className="mt-3">
                    <label htmlFor="cc" className={labelClass}>Combined chlorine (ppm)</label>
                    <input id="cc" type="number" inputMode="decimal" min="0" value={cc}
                      onChange={(e) => set('cc', e.target.value)} placeholder="e.g. 0.5" className={fieldClass} />
                    <p className="text-[11px] text-subtle mt-1">Combined chlorine = total chlorine − free chlorine. Breakpoint target = 10× this.</p>
                  </div>
                )}
                <p className="text-[12px] text-subtle mt-2">
                  Shock target: <strong className="text-muted">{shockTarget} ppm</strong>
                  {shockReason === 'algae' ? ` (≈ 40% of CYA)` : ` (10× combined chlorine)`}.
                </p>
              </div>
            </>
          )}

          {/* Product + strength */}
          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="prod" className={labelClass}>Chlorine product</label>
              <select id="prod" value={productId}
                onChange={(e) => {
                  const p = getProduct(e.target.value);
                  patch({ productId: p.id as State['productId'], strength: p.strengths[0] });
                }}
                className={fieldClass}>
                {PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="str" className={labelClass}>Available chlorine (%)</label>
              <select id="str" value={strength} onChange={(e) => set('strength', parseFloat(e.target.value))} className={fieldClass}>
                {product.strengths.map((s) => <option key={s} value={s}>{s}%</option>)}
              </select>
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-3 mb-6">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {product.note}
          </p>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">
              {mode === 'add' ? 'Add this much' : 'Shock with this much'} {product.short}
            </p>
            <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">
              {showResult ? formatAmount(mode === 'add' ? dose : shockDose, product.phase) : '—'}
            </p>
            {!showResult && (
              <p className="text-subtle text-sm mt-1">
                {mode === 'add'
                  ? currentFcNum >= effectiveTarget && volumeGal > 0
                    ? 'Already at or above your target — no chlorine needed.'
                    : 'Enter your volume and levels above.'
                  : 'Enter your volume and levels above.'}
              </p>
            )}
            {showResult && (
              <p className="text-subtle text-sm mt-2">
                to raise from {currentFcNum} to {mode === 'add' ? effectiveTarget : shockTarget} ppm
                {' '}in {Math.round(volumeGal).toLocaleString('en-US')} gal
              </p>
            )}
            {showResult && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Pool Chlorine Calculator — Free Pool Tools" />
                <button
                  type="button"
                  onClick={() => {
                    saveProfile({ volumeGal: Math.round(volumeGal), cya: cyaNum > 0 ? cyaNum : undefined });
                    setSavedPool(true);
                    setTimeout(() => setSavedPool(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm font-semibold text-muted hover:text-fg hover:border-line-strong transition-colors"
                >
                  {savedPool ? <Check className="w-4 h-4 text-brand-orange" /> : <Save className="w-4 h-4" />}
                  {savedPool ? 'Saved to My Pool' : 'Save to My Pool'}
                </button>
              </div>
            )}
          </div>

          {/* How we got that — collapsed by default so the formula doesn't intimidate */}
          {showResult && (
            <details className="group mt-4 rounded-2xl border border-line bg-card-2">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Show the math</span>
                <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange">
                  <Plus className="w-4 h-4" />
                </span>
              </summary>
              <div className="px-4 pb-4">
                <p className="font-mono text-sm text-muted break-words">
                  1.3 × (vol ÷ 10,000) × ΔFC ÷ (avail% ÷ 100) → 1.3 × ({Math.round(volumeGal).toLocaleString('en-US')} ÷ 10,000) × {mode === 'add' ? deltaFc.toFixed(1) : deltaShock.toFixed(1)} ÷ {(strength / 100).toFixed(3)}
                </p>
                <p className="text-[11px] text-subtle mt-1.5">
                  1.3 oz per 10,000 gal raises free chlorine 1 ppm (Indiana DOH / NSPF). Liquids → fluid ounces, solids → weight ounces.
                </p>
              </div>
            </details>
          )}

          {/* Upkeep — "how long will it last" (add mode) */}
          {mode === 'add' && volumeGal > 0 && (
            <div className="mt-4 rounded-2xl border border-line bg-card-2 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Beaker className="w-4 h-4 text-brand-blue-light" />
                <p className="font-display font-bold text-fg text-base">Keeping it there — chlorine burns off</p>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Chlorine is used up every day by sunlight, swimmers, and debris, so a single dose
                doesn’t last — topping up is a daily-to-weekly job.{' '}
                {isOutdoor
                  ? 'The default burn-off rate is driven by your stabilizer (CYA) — more CYA means chlorine lasts longer.'
                  : 'Indoor pools and spas lose chlorine slowly since there’s no sunlight.'}{' '}
                It’s an estimate — adjust it to match your pool.
              </p>
              <div className="grid sm:grid-cols-[160px_1fr] gap-4 items-start">
                <div>
                  <label htmlFor="loss" className="text-xs text-subtle block mb-1">Daily loss (ppm/day)</label>
                  <input id="loss" type="number" inputMode="decimal" min="0" value={dailyLoss}
                    onChange={(e) => set('dailyLoss', e.target.value)} placeholder={`${loss}`} className={fieldClass} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-line bg-card px-2 py-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-subtle">Lasts about</div>
                    <div className="text-sm sm:text-base font-bold text-fg tabular-nums mt-0.5">
                      {daysUntilMin > 0 ? `${daysUntilMin.toFixed(daysUntilMin < 2 ? 1 : 0)} days` : '—'}
                    </div>
                    <div className="text-[10px] text-subtle">to min ({rec.min} ppm)</div>
                  </div>
                  <div className="rounded-lg border border-line bg-card px-2 py-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-subtle">Add per day</div>
                    <div className="text-sm sm:text-base font-bold text-fg tabular-nums mt-0.5">{formatAmount(perDayDose, product.phase)}</div>
                    <div className="text-[10px] text-subtle">to hold target</div>
                  </div>
                  <div className="rounded-lg border border-line bg-card px-2 py-2 text-center">
                    <div className="text-[10px] uppercase tracking-wide text-subtle">Per week</div>
                    <div className="text-sm sm:text-base font-bold text-fg tabular-nums mt-0.5">{formatAmount(perWeekDose, product.phase)}</div>
                    <div className="text-[10px] text-subtle">split into doses</div>
                  </div>
                </div>
              </div>
              {monthlyCyaFromTabs > 0 && (
                <div className="mt-3 flex items-start gap-2 text-xs leading-relaxed rounded-lg px-3 py-2 border border-brand-orange/40 bg-brand-orange/10 text-fg">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-orange" />
                  <span>
                    Maintaining with {product.short} adds roughly{' '}
                    <strong>{monthlyCyaFromTabs} ppm of cyanuric acid per month</strong> at this rate.
                    CYA only leaves by draining water, so it climbs all season — switch to liquid
                    chlorine or cal-hypo once it passes ~50–60 ppm.{' '}
                    <Link
                      to={`/cya-calculator/?mode=lower&v=${Math.round(volumeGal)}&u=gal&cya=${cyaNum}`}
                      className="font-semibold text-brand-orange hover:text-brand-orange-dark whitespace-nowrap"
                    >
                      Lower CYA →
                    </Link>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Warnings */}
          <div className="mt-4 space-y-2">
            {warnings.map((w, i) => (
              <div key={i} className={`flex items-start gap-2 text-xs leading-relaxed rounded-lg px-3 py-2 border ${
                w.tone === 'warn' ? 'border-brand-orange/40 bg-brand-orange/10 text-fg' : 'border-line bg-card-2 text-muted'
              }`}>
                {w.tone === 'warn' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-orange" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                <span>
                  {w.text}
                  {w.cta && (
                    <>
                      {' '}
                      <Link to={w.cta.to} className="font-semibold text-brand-orange hover:text-brand-orange-dark whitespace-nowrap">
                        {w.cta.label}
                      </Link>
                    </>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target levels reference */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-2">Target free-chlorine levels</h2>
        <p className="text-muted text-sm mb-5">
          CDC recommends at least 1 ppm free chlorine (2 ppm if using CYA), and pH 7.0–7.8. For outdoor
          pools the right target rises with your cyanuric acid:
        </p>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 px-3 font-semibold text-muted">CYA (ppm)</th>
                <th className="py-3 px-3 font-semibold text-muted">Minimum FC</th>
                <th className="py-3 px-3 font-semibold text-muted">Target FC</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['30', '2', '4–6'], ['40', '3', '5–7'], ['50', '4', '6–8'],
                ['60', '5', '7–9'], ['70', '5', '8–10'], ['80', '6', '9–11'],
              ].map((r) => (
                <tr key={r[0]} className="border-b border-line/60">
                  <td className="py-3 px-3 text-muted tabular-nums">{r[0]}</td>
                  <td className="py-3 px-3 text-muted tabular-nums">{r[1]}</td>
                  <td className="py-3 px-3 text-fg font-semibold tabular-nums">{r[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-subtle mt-3">
          Saltwater pools run higher CYA (60–80 ppm). Indoor pools and hot tubs don’t use CYA — keep
          1–4 ppm (pools) or 3 ppm+ (hot tubs).
        </p>
      </section>

      {/* Which chlorine — what each type adds */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-2">Which chlorine should you use?</h2>
        <p className="text-muted text-sm mb-5">
          Liquid chlorine and cal-hypo add no stabilizer, so they’re the safest for everyday dosing
          and shocking. <strong className="text-fg">Trichlor tablets and dichlor are “stabilized” —
          they add cyanuric acid (CYA) every time you use them.</strong> Handy in moderation, but
          they raise CYA all season, and once it climbs too high your chlorine stops working well.
        </p>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line">
                <th className="py-3 px-3 font-semibold text-muted">Product</th>
                <th className="py-3 px-3 font-semibold text-muted">Adds to water</th>
                <th className="py-3 px-3 font-semibold text-muted">pH</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTS.filter((p) => p.id !== 'lithium').map((p) => (
                <tr key={p.id} className="border-b border-line/60">
                  <td className="py-3 px-3 text-fg font-semibold">{p.label}</td>
                  <td className="py-3 px-3 text-muted">
                    {p.addsCyaPerPpm
                      ? `Cyanuric acid (~${p.addsCyaPerPpm} ppm CYA per 1 ppm FC)`
                      : p.addsCalcium
                        ? 'Calcium hardness'
                        : 'Nothing extra'}
                  </td>
                  <td className="py-3 px-3 text-muted">
                    {p.ph === 'raises' ? 'Raises' : p.ph === 'lowers' ? 'Lowers' : 'Neutral'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-subtle mt-3">
          The calculator flags the CYA a stabilized product adds — both per dose and per month if you
          maintain with it — so you can see your stabilizer climbing before it becomes a problem.
        </p>
      </section>

      {/* Safety */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-4">Adding chlorine safely</h2>
        <ul className="grid sm:grid-cols-2 gap-3 text-sm text-muted">
          {[
            'Never mix different pool chemicals — combining chlorine types can react violently.',
            'Add chemicals with the pump running and the pool empty of swimmers; pre-dissolve granules.',
            'Always add acid to water, never water to acid.',
            'Keep pH between 7.2–7.8 — chlorine works poorly outside that range.',
            'Re-test before adding more. CDC suggests testing chlorine and pH at least twice a day.',
            'These results are estimates — follow the product label and confirm with a test kit.',
          ].map((t) => (
            <li key={t} className="flex items-start gap-2 rounded-xl border border-line bg-card p-3">
              <Check className="w-4 h-4 text-brand-orange shrink-0 mt-0.5" />
              {t}
            </li>
          ))}
        </ul>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
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
      </section>

      <RelatedGuides
        guides={[
          {
            to: '/guides/why-wont-my-pool-hold-chlorine/',
            title: 'Why won’t my pool hold chlorine?',
            excerpt: 'Chlorine gone by afternoon? The five causes — algae, low stabilizer, or a lying test kit — and the fix for each.',
          },
          {
            to: '/guides/cyanuric-acid-and-chlorine/',
            title: 'Cyanuric acid & chlorine',
            excerpt: 'How stabilizer makes chlorine last in the sun — and why too much makes it stop working.',
          },
          {
            to: '/guides/how-often-to-shock-your-pool/',
            title: 'How often to shock your pool',
            excerpt: 'When a normal dose isn’t enough and it’s time to shock instead — six triggers to watch for.',
          },
        ]}
      />
      <RelatedTools currentPath="/chlorine-calculator" />
    </PageShell>
  );
};
