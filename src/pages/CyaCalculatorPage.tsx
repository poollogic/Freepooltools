import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Droplet, Info, Check, Plus, AlertTriangle, Save, Waves } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import {
  STABILIZERS,
  getStabilizer,
  recommendedCya,
  doseToRaiseCya,
  waterToDrain,
  toGallons,
  formatAmount,
  type PoolKind,
} from '@/lib/cya';
import { useShareableState, codecs, type ShareSchema } from '@/lib/useShareableState';
import { usePoolProfile, getProfile, saveProfile, clearProfile } from '@/lib/poolProfile';

const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const PRODUCT_IDS = ['granular', 'liquid'] as const;

type State = {
  mode: 'raise' | 'lower';
  kind: PoolKind;
  volume: string;
  volUnit: 'gal' | 'L';
  currentCya: string;
  targetCya: string; // blank → recommended
  productId: (typeof PRODUCT_IDS)[number];
  purity: number;
};

const DEFAULTS: State = {
  mode: 'raise',
  kind: 'chlorine',
  volume: '20000',
  volUnit: 'gal',
  currentCya: '0',
  targetCya: '',
  productId: 'granular',
  purity: 100,
};

const SCHEMA = {
  mode: { param: 'mode', ...codecs.oneOf(['raise', 'lower'] as const) },
  kind: { param: 'kind', ...codecs.oneOf(['chlorine', 'salt'] as const) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  currentCya: { param: 'cya', ...codecs.numStr() },
  targetCya: { param: 't', ...codecs.numStr() },
  productId: { param: 'p', ...codecs.oneOf(PRODUCT_IDS) },
  purity: { param: 's', ...codecs.num() },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much stabilizer do I add to my pool?',
    a: 'Granular cyanuric acid is nearly pure, and about 13 oz raises CYA by 10 ppm in 10,000 gallons (≈1.3 oz per 1 ppm per 10,000 gal). Enter your volume, current CYA, and target, and the calculator scales that exactly. Add it slowly — CYA is hard to remove, so it’s better to under-shoot and top up.',
  },
  {
    q: 'What should my cyanuric acid level be?',
    a: 'For a traditional chlorine or tablet pool, aim for 30–50 ppm. Saltwater pools run higher, around 60–80 ppm, because salt systems produce chlorine at a lower rate. Indoor pools and hot tubs don’t need CYA at all (no sunlight).',
  },
  {
    q: 'How do I lower cyanuric acid in my pool?',
    a: 'The only reliable way is to dilute it: drain part of the water and refill with fresh. To go from your current level to a target, drain a fraction equal to 1 − (target ÷ current) — for example, 100 ppm down to 40 ppm means draining about 60% and refilling. Use the “Lower CYA” mode to get the exact gallons.',
  },
  {
    q: 'Does a cyanuric acid reducer work?',
    a: 'No — despite the marketing, no chemical reliably removes cyanuric acid from pool water. CYA is very stable and only leaves by removing water (dilution) or, in some regions, a reverse-osmosis mobile filtration service. Don’t waste money on “CYA reducer” additives.',
  },
  {
    q: 'How long until stabilizer shows up on a test?',
    a: 'Granular CYA dissolves slowly — 24–48 hours, sometimes longer in cool water. Pre-dissolve it or place it in a sock in the skimmer, keep the pump running, and wait about 48 hours before retesting so you don’t accidentally overdose. Liquid stabilizer registers within hours but costs more.',
  },
  {
    q: 'Why is high cyanuric acid a problem?',
    a: 'CYA protects chlorine from sunlight, but too much over-stabilizes it: the chlorine is present but sluggish, so it sanitizes slowly. Past roughly 80–100 ppm you have to keep free chlorine very high to compensate. If tablets (trichlor/dichlor) have pushed your CYA up, dilution is the fix.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to adjust cyanuric acid (stabilizer) in a pool',
  description:
    'Work out how much stabilizer to add to raise cyanuric acid, or how much water to drain to lower it, based on your pool volume and target CYA.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter pool volume and current CYA', text: 'Enter how many gallons your pool holds and your current cyanuric acid reading.' },
    { '@type': 'HowToStep', position: 2, name: 'Pick your target', text: 'Use the recommended target (30–50 ppm for chlorine pools, 60–80 for saltwater).' },
    { '@type': 'HowToStep', position: 3, name: 'Read the result', text: 'Get the amount of stabilizer to add, or the gallons to drain and refill to lower CYA.' },
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
    { '@type': 'ListItem', position: 2, name: 'Pool Stabilizer / CYA Calculator', item: SITE_ORIGIN + '/cya-calculator/' },
  ],
};

export const CyaCalculatorPage = () => {
  usePageMeta({
    title: 'Pool Stabilizer Calculator: How Much CYA to Add',
    description:
      'How much stabilizer to add — or water to drain to lower CYA. Free cyanuric acid calculator with target levels for chlorine & saltwater pools. No sign-up.',
    canonicalPath: '/cya-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { mode, kind, volume, volUnit, currentCya, targetCya, productId, purity } = state;

  const profile = usePoolProfile();
  const [usingSavedPool, setUsingSavedPool] = useState(false);
  const [savedPool, setSavedPool] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.search) return;
    const p = getProfile();
    const next: Partial<State> = {};
    if (p.volumeGal) {
      next.volume = String(p.volumeGal);
      next.volUnit = 'gal';
    }
    if (p.cya != null && Number.isFinite(p.cya)) next.currentCya = String(p.cya);
    if (Object.keys(next).length) {
      patch(next);
      setUsingSavedPool(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = getStabilizer(productId);
  const volumeGal = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const rec = useMemo(() => recommendedCya(kind), [kind]);
  const currentCyaNum = num(currentCya);

  // Raise: target defaults to the mid of the recommended range.
  const raiseTarget = num(targetCya) > 0 ? num(targetCya) : rec.mid;
  const deltaCya = Math.max(0, raiseTarget - currentCyaNum);
  const addDose = doseToRaiseCya(volumeGal, deltaCya, purity);

  // Lower: target defaults to the HIGH end of range (least water drained).
  const lowerTarget = num(targetCya) > 0 ? num(targetCya) : rec.high;
  const drain = waterToDrain(volumeGal, currentCyaNum, lowerTarget);

  const showRaise = mode === 'raise' && volumeGal > 0 && deltaCya > 0;
  const showLower = mode === 'lower' && drain.gallons > 0;

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [];
  if (mode === 'raise') {
    if (raiseTarget > rec.high) {
      warnings.push({ tone: 'warn', text: `${raiseTarget} ppm is above the recommended ${rec.low}–${rec.high} ppm. CYA can only be lowered by draining water, so it’s easy to overshoot — aim for the middle of the range.` });
    }
    warnings.push({ tone: 'info', text: product.note });
    warnings.push({ tone: 'info', text: 'Add stabilizer gradually and re-test after ~48 hours before adding more — you can always top up, but you can’t easily take it back out.' });
  } else {
    warnings.push({ tone: 'info', text: 'Dilution is the only reliable way to lower CYA — no chemical “reducer” actually works.' });
    warnings.push({ tone: 'info', text: 'Draining also lowers alkalinity, calcium hardness, and salt by the same percentage, so re-test and rebalance after refilling.' });
    if (drain.fraction > 0.5) warnings.push({ tone: 'warn', text: 'That’s a large drain — do it in stages, and never drain a pool fully without understanding hydrostatic (pop-up) risk.' });
  }

  const Seg = <T extends string>(opts: { id: T; label: string }[], value: T, onSet: (v: T) => void) => (
    <div className="inline-flex flex-wrap rounded-xl border border-line bg-card-2 p-1">
      {opts.map((o) => (
        <button key={o.id} type="button" onClick={() => onSet(o.id)} aria-pressed={value === o.id}
          className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors ${value === o.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <Droplet className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool Stabilizer (CYA) Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          How much cyanuric acid to add to protect your chlorine — or how much water to drain to
          lower it when it’s too high. Built on standard pool-chemistry dosing.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-3xl border border-line bg-card p-5 sm:p-8 shadow-card elevate">
          {usingSavedPool && profile.volumeGal && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-2.5">
              <span className="text-sm text-fg font-medium inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-blue-light shrink-0" />
                Using your saved pool ({profile.volumeGal.toLocaleString('en-US')} gal
                {profile.cya != null ? `, CYA ${profile.cya}` : ''})
              </span>
              <button type="button" onClick={() => { clearProfile(); patch({ volume: '', currentCya: '' }); setUsingSavedPool(false); }}
                className="text-xs font-semibold text-muted hover:text-fg shrink-0 whitespace-nowrap">
                Not my pool? Clear
              </button>
            </div>
          )}

          {/* Mode */}
          <div className="grid grid-cols-2 gap-2 mb-6 rounded-xl border border-line bg-card-2 p-1">
            {([{ id: 'raise', label: 'Raise CYA' }, { id: 'lower', label: 'Lower CYA' }] as { id: State['mode']; label: string }[]).map((m) => (
              <button key={m.id} type="button" onClick={() => set('mode', m.id)} aria-pressed={mode === m.id}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === m.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'}`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Pool type (drives target) */}
          <div className="mb-5">
            <p className={labelClass}>Pool type</p>
            {Seg(
              [
                { id: 'chlorine' as PoolKind, label: 'Chlorine / tablets' },
                { id: 'salt' as PoolKind, label: 'Saltwater (SWG)' },
              ],
              kind,
              (v) => set('kind', v),
            )}
            <p className="text-[11px] text-subtle mt-1.5">
              Recommended CYA: <strong className="text-muted">{rec.low}–{rec.high} ppm</strong> for {kind === 'salt' ? 'saltwater pools' : 'chlorine / tablet pools'}.
            </p>
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
            </div>
            <div>
              <label htmlFor="curcya" className={labelClass}>Current CYA (ppm)</label>
              <input id="curcya" type="number" inputMode="decimal" min="0" value={currentCya}
                onChange={(e) => set('currentCya', e.target.value)} placeholder="e.g. 0" className={fieldClass} />
            </div>
          </div>

          {/* Target + (raise) product */}
          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="tgt" className={labelClass}>Target CYA (ppm)</label>
              <input id="tgt" type="number" inputMode="decimal" min="0" value={targetCya}
                onChange={(e) => set('targetCya', e.target.value)} placeholder={`${mode === 'raise' ? rec.mid : rec.high}`} className={fieldClass} />
              <button type="button" onClick={() => set('targetCya', String(mode === 'raise' ? rec.mid : rec.high))}
                className="inline-flex items-center gap-1 mt-2 rounded-full border border-line bg-card-2 px-2.5 py-1 text-[11px] font-semibold text-brand-orange hover:text-brand-orange-dark">
                Use {mode === 'raise' ? rec.mid : rec.high} ppm
              </button>
            </div>
            {mode === 'raise' && (
              <div>
                <label htmlFor="prod" className={labelClass}>Stabilizer product</label>
                <select id="prod" value={productId}
                  onChange={(e) => { const p = getStabilizer(e.target.value); patch({ productId: p.id as State['productId'], purity: p.purities[0] }); }}
                  className={fieldClass}>
                  {STABILIZERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
            )}
          </div>

          {mode === 'raise' && (
            <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-3 mb-6">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {product.note}
            </p>
          )}
          {mode === 'lower' && <div className="mb-6" />}

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            {mode === 'raise' ? (
              <>
                <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Add this much {product.short}</p>
                <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">
                  {showRaise ? formatAmount(addDose, product.phase) : '—'}
                </p>
                {showRaise ? (
                  <p className="text-subtle text-sm mt-2">to raise CYA from {currentCyaNum} to {raiseTarget} ppm in {Math.round(volumeGal).toLocaleString('en-US')} gal</p>
                ) : (
                  <p className="text-subtle text-sm mt-1">
                    {currentCyaNum >= raiseTarget && volumeGal > 0 ? 'Already at or above your target — no stabilizer needed.' : 'Enter your volume and current CYA above.'}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Drain &amp; refill this much</p>
                <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">
                  {showLower ? `${Math.round(drain.gallons).toLocaleString('en-US')} gal` : '—'}
                </p>
                {showLower ? (
                  <p className="text-subtle text-sm mt-2">≈ {Math.round(drain.fraction * 100)}% of your pool, to go from {currentCyaNum} to {lowerTarget} ppm</p>
                ) : (
                  <p className="text-subtle text-sm mt-1">
                    {currentCyaNum > 0 && lowerTarget >= currentCyaNum ? 'Your target isn’t below your current CYA — nothing to drain.' : 'Enter your volume and current CYA above.'}
                  </p>
                )}
                {showLower && (
                  <p className="text-sm mt-2">
                    <Link to="/guides/how-to-drain-a-pool-with-a-garden-hose" className="text-brand-orange font-semibold hover:underline">
                      How to drain your pool with a garden hose →
                    </Link>
                  </p>
                )}
              </>
            )}
            {(showRaise || showLower) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Pool Stabilizer (CYA) Calculator — Free Pool Tools" />
                <button type="button"
                  onClick={() => { saveProfile({ volumeGal: Math.round(volumeGal), cya: currentCyaNum > 0 ? currentCyaNum : undefined }); setSavedPool(true); setTimeout(() => setSavedPool(false), 2000); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm font-semibold text-muted hover:text-fg hover:border-line-strong transition-colors">
                  {savedPool ? <Check className="w-4 h-4 text-brand-orange" /> : <Save className="w-4 h-4" />}
                  {savedPool ? 'Saved to My Pool' : 'Save to My Pool'}
                </button>
              </div>
            )}
          </div>

          {/* How we got that */}
          {(showRaise || showLower) && (
            <details className="group mt-4 rounded-2xl border border-line bg-card-2">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Show the math</span>
                <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange"><Plus className="w-4 h-4" /></span>
              </summary>
              <div className="px-4 pb-4">
                {mode === 'raise' ? (
                  <>
                    <p className="font-mono text-sm text-muted break-words">
                      1.3 × (vol ÷ 10,000) × ΔCYA ÷ (purity ÷ 100) → 1.3 × ({Math.round(volumeGal).toLocaleString('en-US')} ÷ 10,000) × {deltaCya} ÷ {(purity / 100).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-subtle mt-1.5">1.3 oz of pure cyanuric acid per 10,000 gal raises CYA 1 ppm (DOH/NSPF).</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-sm text-muted break-words">
                      drain = volume × (1 − target ÷ current) → {Math.round(volumeGal).toLocaleString('en-US')} × (1 − {lowerTarget} ÷ {currentCyaNum})
                    </p>
                    <p className="text-[11px] text-subtle mt-1.5">CYA is only removed by replacing water — dilution lowers it proportionally.</p>
                  </>
                )}
              </div>
            </details>
          )}

          {/* Warnings */}
          <div className="mt-4 space-y-2">
            {warnings.map((w, i) => (
              <p key={i} className={`flex items-start gap-2 text-xs leading-relaxed rounded-lg px-3 py-2 border ${w.tone === 'warn' ? 'border-brand-orange/40 bg-brand-orange/10 text-fg' : 'border-line bg-card-2 text-muted'}`}>
                {w.tone === 'warn' ? <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-brand-orange" /> : <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />}
                {w.text}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Why CYA matters */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-3">Why cyanuric acid matters</h2>
        <div className="space-y-3 text-muted leading-relaxed text-[15px]">
          <p>
            Cyanuric acid (CYA), also called stabilizer or conditioner, shields chlorine from sunlight.
            Without it, UV destroys about half your free chlorine in ~17 minutes and most of it within
            a few hours — so for any outdoor pool, CYA is essential, not optional.
          </p>
          <p>
            But it’s a balance: too little and chlorine burns off; too much and chlorine turns sluggish
            (“over-stabilization”). Aim for <strong className="text-fg">{rec.low}–{rec.high} ppm</strong> for a {kind === 'salt' ? 'saltwater' : 'chlorine'} pool. Because
            CYA only leaves by draining water, it’s far easier to add a little at a time than to fix an overshoot.
          </p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Waves className="w-4 h-4 text-brand-blue-light" />
          <span className="text-muted">CYA sets your chlorine target — see the </span>
          <a href="/chlorine-calculator" className="text-brand-orange font-semibold hover:text-brand-orange-dark">chlorine calculator</a>
          <span className="text-subtle">·</span>
          <a href="/guides/cyanuric-acid-and-chlorine" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
            Full guide: CYA &amp; chlorine →
          </a>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-5">Common questions</h2>
        <div className="rounded-2xl border border-line bg-card divide-y divide-line elevate">
          {FAQS.map((item) => (
            <details key={item.q} className="group">
              <summary className="list-none cursor-pointer flex items-start justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                <span className="font-display font-normal text-fg text-[15px] sm:text-base leading-snug">{item.q}</span>
                <span className="shrink-0 mt-0.5 text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange"><Plus className="w-5 h-5" /></span>
              </summary>
              <p className="px-5 sm:px-6 pb-5 -mt-1 text-muted leading-relaxed text-[15px]">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <RelatedTools currentPath="/cya-calculator" />
    </PageShell>
  );
};
