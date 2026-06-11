import { useEffect, useMemo, useState } from 'react';
import { FlaskRound, Info, Check, Plus, AlertTriangle, Save } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import {
  ACID_PRODUCTS,
  getAcid,
  acidToLowerPh,
  acidToLowerTa,
  formatAmount,
  toGallons,
  IDEAL,
} from '@/lib/waterBalance';
import { useShareableState, codecs, type ShareSchema } from '@/lib/useShareableState';
import { usePoolProfile, getProfile, saveProfile, clearProfile } from '@/lib/poolProfile';

const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const ACID_IDS = ['muriatic-31', 'muriatic-145', 'dry-acid'] as const;

type State = {
  mode: 'ph' | 'ta';
  acid: (typeof ACID_IDS)[number];
  volume: string;
  volUnit: 'gal' | 'L';
  phNow: string;
  phTarget: string;
  ta: string; // current total alkalinity (buffer in pH mode; current in TA mode)
  taTarget: string;
};

const DEFAULTS: State = {
  mode: 'ph',
  acid: 'muriatic-31',
  volume: '20000',
  volUnit: 'gal',
  phNow: '8.0',
  phTarget: '7.5',
  ta: '100',
  taTarget: '90',
};

const SCHEMA = {
  mode: { param: 'm', ...codecs.oneOf(['ph', 'ta'] as const) },
  acid: { param: 'a', ...codecs.oneOf(ACID_IDS) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  phNow: { param: 'p', ...codecs.numStr() },
  phTarget: { param: 'pt', ...codecs.numStr() },
  ta: { param: 'ta', ...codecs.numStr() },
  taTarget: { param: 'tt', ...codecs.numStr() },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much muriatic acid do I add to lower pH?',
    a: 'It depends on your pool size, how far the pH is above target, and your total alkalinity (which buffers the change). As a benchmark, lowering pH from 8.0 to 7.5 in a 10,000-gallon pool at 100 ppm alkalinity takes about 12 fl oz of full-strength (31.45%) muriatic acid. Enter your own numbers above for an exact dose — and add about three-quarters of it first, since pH is easy to overshoot.',
  },
  {
    q: 'How much muriatic acid to lower alkalinity?',
    a: 'Roughly 25.6 fl oz of 31.45% muriatic acid lowers total alkalinity by 10 ppm per 10,000 gallons. So dropping a 20,000-gallon pool from 120 to 90 ppm (30 ppm) needs about 1.2 gallons of acid. Switch to “Lower alkalinity” mode above and enter your levels for the exact amount.',
  },
  {
    q: 'Does muriatic acid lower both pH and alkalinity?',
    a: 'Yes — acid lowers both at once, because it neutralizes the carbonates that make up alkalinity, and that pulls pH down too. That’s why this tool shows the resulting alkalinity when you lower pH. If only your pH is high but alkalinity is fine, add acid in small doses and let aeration nudge pH back up so alkalinity doesn’t fall too far.',
  },
  {
    q: 'How do I lower alkalinity without lowering pH?',
    a: 'You can’t separate them at the moment of dosing — acid drops both. The trick is the order of operations: add acid to bring alkalinity down (pH drops with it), then aerate the water (run returns pointed up, fountains, or a spillover) to drive pH back up while alkalinity stays low. Repeat until alkalinity is in range. The pH always recovers with aeration; alkalinity does not.',
  },
  {
    q: 'Is it safe to swim after adding muriatic acid?',
    a: 'Wait until the acid is fully circulated and your pH is back in the 7.2–7.8 range — usually about 30 minutes to an hour with the pump running. Swimming in water with a freshly added slug of acid (low, unmixed pH) can irritate skin and eyes, so always re-test before anyone gets in.',
  },
  {
    q: 'Muriatic acid or dry acid — which should I use?',
    a: 'Both lower pH and alkalinity. Liquid muriatic acid is cheapest and works instantly, but it fumes and must be handled carefully. Dry acid (sodium bisulfate) is granular, easier and safer to handle, and good for a single high-fume-sensitive spot — but it costs more and adds sulfates over time, which can build up in pools that don’t get diluted by rain or refills.',
  },
  {
    q: 'What if I added too much acid and the pH is too low?',
    a: 'Low pH is easy to fix: aerate the water (it naturally rises as CO₂ off-gasses), or add a small amount of soda ash (to raise pH) or baking soda (to raise pH and alkalinity) to bring it back into the 7.4–7.6 range. This is exactly why you dose acid in stages and re-test — overshooting just means buying it back with another chemical.',
  },
  {
    q: 'How is the acid dose calculated?',
    a: 'For alkalinity, it’s linear: each 10 ppm drop per 10,000 gallons needs a fixed amount of acid. For pH, the tool models the carbonate buffer system directly — it works out how much acid (in chemical equivalents) it takes to move from your starting pH to your target at your alkalinity, then converts that to fluid ounces of your chosen product. Open “Show the math” under the result to see it.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate how much muriatic acid to add to a pool',
  description:
    'Work out how much muriatic acid (or dry acid) to add to lower pool pH or total alkalinity to your target.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Choose what to lower', text: 'Pick whether you’re lowering pH or total alkalinity.' },
    { '@type': 'HowToStep', position: 2, name: 'Enter your pool and levels', text: 'Enter your pool volume, current level, and target. For pH, also enter your current alkalinity.' },
    { '@type': 'HowToStep', position: 3, name: 'Pick your acid', text: 'Choose full-strength muriatic acid, low-fume muriatic acid, or dry acid.' },
    { '@type': 'HowToStep', position: 4, name: 'Add in stages and re-test', text: 'Add about three-quarters of the dose, run the pump, then re-test before adding the rest.' },
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
    { '@type': 'ListItem', position: 2, name: 'Muriatic Acid Calculator', item: SITE_ORIGIN + '/muriatic-acid-calculator/' },
  ],
};

export const MuriaticAcidCalculatorPage = () => {
  usePageMeta({
    title: 'Muriatic Acid Calculator — Lower Pool pH & Alkalinity',
    description:
      'Free muriatic acid calculator — exactly how much acid to add to lower your pool’s pH or total alkalinity, for any pool size. Full-strength, low-fume, or dry acid. No sign-up.',
    canonicalPath: '/muriatic-acid-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { mode, acid, volume, volUnit, phNow, phTarget, ta, taTarget } = state;

  const profile = usePoolProfile();
  const [usingSavedPool, setUsingSavedPool] = useState(false);
  const [savedPool, setSavedPool] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.search) return;
    const p = getProfile();
    if (p.volumeGal) {
      patch({ volume: String(p.volumeGal), volUnit: 'gal' });
      setUsingSavedPool(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const product = getAcid(acid);
  const gallons = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const isPh = mode === 'ph';

  const result = useMemo(
    () =>
      isPh
        ? acidToLowerPh(gallons, num(phNow), num(phTarget), num(ta), product)
        : acidToLowerTa(gallons, num(ta), num(taTarget), product, num(phNow)),
    [isPh, gallons, phNow, phTarget, ta, taTarget, product],
  );

  const show = result.ounces > 0;
  const taDrop = isPh ? Math.max(0, num(ta) - result.taAfter) : 0;
  // TA mode: acid drags pH down with the alkalinity — flag if it sinks too low.
  const phLands = !isPh ? result.phAfter : 0;
  const phTooLow = !isPh && show && phLands > 0 && phLands < 7.2;

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [];
  warnings.push({ tone: 'warn', text: 'Always add acid TO the water — never water to acid. Pour it slowly over a return jet with the pump running, and keep it off skin and away from your face. Store it away from chlorine.' });
  if (isPh) {
    if (num(phTarget) < 7.2) warnings.push({ tone: 'warn', text: `A target of ${num(phTarget)} is below the safe 7.2–7.8 range — low pH is corrosive and irritating. Aim for about 7.5.` });
    warnings.push({ tone: 'info', text: `This also lowers total alkalinity (here, about ${Math.round(taDrop)} ppm). If your alkalinity is already low, expect to add baking soda afterward — and dose acid in stages, since pH overshoots easily.` });
    warnings.push({ tone: 'info', text: 'If your cyanuric acid (CYA) is high, part of your measured alkalinity is actually from the stabilizer, so the real acid needed is slightly less than shown — another reason to add in stages and re-test.' });
  } else {
    if (phTooLow) {
      warnings.push({ tone: 'warn', text: `Heads up: this much acid would sink pH to about ${phLands.toFixed(1)} — below the safe 7.2–7.8 range. Don’t dump it all in. Lower alkalinity in smaller steps: add part of the acid, then aerate to bring pH back up before the next round, so pH never bottoms out.` });
    } else {
      warnings.push({ tone: 'info', text: `Lowering alkalinity with acid also drops pH — here, to about ${phLands > 0 ? phLands.toFixed(1) : '—'}. The standard method: add the acid, then aerate (returns pointed up, water features, a spillover) to bring pH back up while alkalinity stays down. Repeat until alkalinity is in range.` });
    }
  }
  if (acid === 'dry-acid') warnings.push({ tone: 'info', text: 'Dry acid adds sulfates with every dose. In pools that rarely get diluted by rain or refills, sulfate can build up over a season — switch to liquid acid occasionally if you dose often.' });
  warnings.push({ tone: 'info', text: 'Add about three-quarters of the dose first, run the pump 20–30 minutes, then re-test before adding the rest. Coming back up is more work than sneaking up on the target.' });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <FlaskRound className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Muriatic Acid Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          Exactly how much acid to add to bring your pool’s pH or total alkalinity down — for any pool
          size, with full-strength, low-fume, or dry acid.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="rounded-3xl border border-line bg-card p-5 sm:p-8 shadow-card elevate">
          {usingSavedPool && profile.volumeGal && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-brand-blue/30 bg-brand-blue/10 px-4 py-2.5">
              <span className="text-sm text-fg font-medium inline-flex items-center gap-2">
                <Check className="w-4 h-4 text-brand-blue-light shrink-0" />
                Using your saved pool ({profile.volumeGal.toLocaleString('en-US')} gal)
              </span>
              <button type="button" onClick={() => { clearProfile(); patch({ volume: '' }); setUsingSavedPool(false); }}
                className="text-xs font-semibold text-muted hover:text-fg shrink-0 whitespace-nowrap">
                Not my pool? Clear
              </button>
            </div>
          )}

          {/* Mode */}
          <div className="grid grid-cols-2 gap-2 mb-6 rounded-xl border border-line bg-card-2 p-1">
            {([{ id: 'ph', label: 'Lower pH' }, { id: 'ta', label: 'Lower alkalinity' }] as { id: State['mode']; label: string }[]).map((m) => (
              <button key={m.id} type="button" onClick={() => set('mode', m.id)} aria-pressed={mode === m.id}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === m.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'}`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Volume + acid product */}
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
              <label htmlFor="acid" className={labelClass}>Acid product</label>
              <select id="acid" value={acid} onChange={(e) => set('acid', e.target.value as State['acid'])} className={fieldClass}>
                {ACID_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Levels */}
          {isPh ? (
            <div className="grid sm:grid-cols-3 gap-4 mb-2">
              <div>
                <label htmlFor="phn" className={labelClass}>Current pH</label>
                <input id="phn" type="number" inputMode="decimal" min="0" step="0.1" value={phNow}
                  onChange={(e) => set('phNow', e.target.value)} placeholder="e.g. 8.0" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="pht" className={labelClass}>Target pH</label>
                <input id="pht" type="number" inputMode="decimal" min="0" step="0.1" value={phTarget}
                  onChange={(e) => set('phTarget', e.target.value)} placeholder="e.g. 7.5" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="ta" className={labelClass}>Current alkalinity (ppm)</label>
                <input id="ta" type="number" inputMode="decimal" min="0" value={ta}
                  onChange={(e) => set('ta', e.target.value)} placeholder="e.g. 100" className={fieldClass} />
              </div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-3 gap-4 mb-2">
              <div>
                <label htmlFor="ta" className={labelClass}>Current alkalinity (ppm)</label>
                <input id="ta" type="number" inputMode="decimal" min="0" value={ta}
                  onChange={(e) => set('ta', e.target.value)} placeholder="e.g. 120" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="tat" className={labelClass}>Target alkalinity (ppm)</label>
                <input id="tat" type="number" inputMode="decimal" min="0" value={taTarget}
                  onChange={(e) => set('taTarget', e.target.value)} placeholder="e.g. 90" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="phn" className={labelClass}>Current pH</label>
                <input id="phn" type="number" inputMode="decimal" min="0" step="0.1" value={phNow}
                  onChange={(e) => set('phNow', e.target.value)} placeholder="e.g. 8.0" className={fieldClass} />
              </div>
            </div>
          )}
          <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-3 mb-6">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {isPh
              ? <>Aim for pH {IDEAL.ph.low}–{IDEAL.ph.high}. Alkalinity buffers pH, so higher alkalinity needs more acid for the same pH drop.</>
              : <>Aim for alkalinity {IDEAL.ta.low}–{IDEAL.ta.high} ppm. Acid lowers it predictably; expect pH to drop too.</>}
          </p>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Add this much {product.short}</p>
            <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">{show ? formatAmount(result.ounces, result.phase) : '—'}</p>
            {show ? (
              <p className="text-subtle text-sm mt-2">
                {isPh
                  ? <>to lower pH from {num(phNow)} to {num(phTarget)} in {Math.round(gallons).toLocaleString('en-US')} gal — also drops alkalinity to ≈{Math.round(result.taAfter)} ppm</>
                  : <>to lower alkalinity from {num(ta)} to {num(taTarget)} ppm in {Math.round(gallons).toLocaleString('en-US')} gal — this also pushes pH down to ≈<span className={phTooLow ? 'font-bold text-brand-orange' : ''}>{phLands > 0 ? phLands.toFixed(1) : '—'}</span></>}
              </p>
            ) : (
              <p className="text-subtle text-sm mt-1">
                {isPh
                  ? (num(phTarget) >= num(phNow) && gallons > 0 ? 'Your target pH isn’t below your current pH — no acid needed.' : 'Enter your volume and pH levels above.')
                  : (num(taTarget) >= num(ta) && gallons > 0 ? 'Your target alkalinity isn’t below your current — no acid needed.' : 'Enter your volume and alkalinity levels above.')}
              </p>
            )}
            {show && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Muriatic Acid Calculator — Free Pool Tools" />
                <button type="button"
                  onClick={() => { saveProfile({ volumeGal: Math.round(gallons) }); setSavedPool(true); setTimeout(() => setSavedPool(false), 2000); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm font-semibold text-muted hover:text-fg hover:border-line-strong transition-colors">
                  {savedPool ? <Check className="w-4 h-4 text-brand-orange" /> : <Save className="w-4 h-4" />}
                  {savedPool ? 'Saved to My Pool' : 'Save to My Pool'}
                </button>
              </div>
            )}
          </div>

          {/* Show the math */}
          {show && (
            <details className="group mt-4 rounded-2xl border border-line bg-card-2">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Show the math</span>
                <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange"><Plus className="w-4 h-4" /></span>
              </summary>
              <div className="px-4 pb-4">
                {isPh ? (
                  <>
                    <p className="font-mono text-sm text-muted break-words">
                      carbonate model @ alkalinity {num(ta)} ppm: pH {num(phNow)} → {num(phTarget)} removes the alkalinity that drops it to ≈{Math.round(result.taAfter)} ppm
                    </p>
                    <p className="font-mono text-sm text-muted break-words mt-1.5">
                      that acid demand → {formatAmount(result.ounces, result.phase)} of {product.short}
                    </p>
                    <p className="text-[11px] text-subtle mt-2">pH is buffered and logarithmic, so the dose is solved from the carbonate equilibrium (pK₁ 6.35, pK₂ 10.33), not a flat rule. Acid lowers pH and alkalinity together.</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-sm text-muted break-words">
                      ≈ 25.6 fl oz of 31.45% acid per 10 ppm per 10,000 gal → ({num(ta)} − {num(taTarget)}) ppm × {Math.round(gallons).toLocaleString('en-US')} gal
                    </p>
                    <p className="font-mono text-sm text-muted break-words mt-1.5">
                      = {formatAmount(result.ounces, result.phase)} of {product.short}
                    </p>
                    <p className="font-mono text-sm text-muted break-words mt-1.5">
                      pH {num(phNow)} → ≈{phLands > 0 ? phLands.toFixed(1) : '—'} (carbonate solve — acid drops pH with the alkalinity)
                    </p>
                    <p className="text-[11px] text-subtle mt-2">Alkalinity falls linearly with acid: 1 equivalent of acid neutralizes 1 equivalent of alkalinity. The resulting pH is solved from the carbonate equilibrium — which is why a big drop can sink pH below range.</p>
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
                <span>{w.text}</span>
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Supporting content */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 guide-prose">
        <h2>Acid lowers pH and alkalinity together</h2>
        <p>
          Muriatic acid (hydrochloric acid) is how you bring a high pool pH or high total alkalinity
          back down. There’s a catch worth understanding: <strong>acid lowers both at once</strong>.
          It neutralizes the carbonate buffer that makes up alkalinity, and as that buffer drops, pH
          comes down with it. So a dose aimed at pH will also shave some alkalinity, and a dose aimed
          at alkalinity will also drop pH.
        </p>
        <p>
          That’s why pH dosing isn’t a flat rule — your <strong>alkalinity is the buffer</strong>. The
          higher your alkalinity, the more acid it takes to move pH the same amount. This calculator
          solves the carbonate chemistry for your exact levels rather than guessing, then shows the
          alkalinity you’ll land at so there are no surprises.
        </p>

        <h2>Worked example</h2>
        <p>
          A 20,000-gallon pool at pH 8.0 and 100 ppm alkalinity, targeting pH 7.5:
        </p>
        <p>
          The carbonate math works out to roughly <strong>25 fl oz</strong> of full-strength (31.45%)
          muriatic acid, and it’ll pull alkalinity down to about 95 ppm along the way. Add about
          three-quarters of it over a return with the pump running, wait 20–30 minutes, and re-test —
          pH is easy to overshoot, and bringing it back up means adding soda ash or baking soda.
        </p>
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

      <RelatedTools currentPath="/muriatic-acid-calculator" />
    </PageShell>
  );
};
