import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Info, Check, Plus, AlertTriangle, Save } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import {
  CALCIUM_PRODUCTS,
  getCalcium,
  calciumOz,
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
const CALCIUM_IDS = ['dihydrate', 'anhydrous'] as const;

type State = {
  product: (typeof CALCIUM_IDS)[number];
  volume: string;
  volUnit: 'gal' | 'L';
  chNow: string;
  chTarget: string;
};

const DEFAULTS: State = { product: 'dihydrate', volume: '20000', volUnit: 'gal', chNow: '150', chTarget: '300' };

const SCHEMA = {
  product: { param: 'p', ...codecs.oneOf(CALCIUM_IDS) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  chNow: { param: 'c', ...codecs.numStr() },
  chTarget: { param: 't', ...codecs.numStr() },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much calcium chloride do I add to raise hardness?',
    a: 'About 1.25 lb of calcium chloride flake (dihydrate) per 10,000 gallons raises calcium hardness by roughly 10 ppm; the pure anhydrous form takes about 0.9 lb for the same rise. So a 20,000-gallon pool going from 150 to 300 ppm (a 150 ppm bump) needs roughly 37 lb of flake. Enter your levels above for the exact amount.',
  },
  {
    q: 'What should calcium hardness be in a pool?',
    a: 'Most pools run best with calcium hardness between 200 and 400 ppm — plaster and pebble pools usually want 250–350 ppm so the water isn’t hungry for calcium and won’t etch the surface. Vinyl and fiberglass pools can sit at the lower end. Too low and the water leaches calcium from plaster and grout; too high and you get scale and cloudiness.',
  },
  {
    q: 'How do I lower calcium hardness?',
    a: 'No chemical removes calcium — you lower hardness by dilution: drain part of the pool and refill with water that’s lower in calcium (or use a hose filter / soft fill water). If your fill water is itself very hard, partial drains only help so much, and a reverse-osmosis mobile service is the other option. Prevent the climb by keeping pH and alkalinity in check so calcium stays dissolved.',
  },
  {
    q: 'Calcium chloride flake or anhydrous — what’s the difference?',
    a: 'Flake is calcium chloride dihydrate (about 77% calcium chloride by weight) — the common white “calcium hardness increaser.” Anhydrous calcium chloride is the pure 100% form (often sold as ice-melt pellets), so you need less of it for the same result. Both raise hardness identically per unit of calcium; just pick the right product in the calculator so the amount matches what you’re scooping.',
  },
  {
    q: 'Will calcium increaser cloud my water?',
    a: 'It can if you dump it in dry — calcium chloride releases a lot of heat as it dissolves and can cloud the water or even damage a vinyl liner. Pre-dissolve it in a bucket of pool water (add the calcium to the water, not the reverse), then pour the solution slowly around the pool with the pump running. The cloudiness from a proper dose usually clears within a day.',
  },
  {
    q: 'Is calcium chloride the same as calcium hardness increaser?',
    a: 'Yes. “Calcium hardness increaser,” “hardness up,” and “calcium plus” are calcium chloride — usually the dihydrate flake. Plain calcium chloride sold for ice melt or dust control is the same chemical and often much cheaper, as long as it’s pure calcium chloride with no additives or anti-caking agents.',
  },
  {
    q: 'How long after adding calcium chloride can I swim?',
    a: 'Once it’s pre-dissolved and circulated — generally about 30 minutes to an hour with the pump running — it’s fine to swim. If the water clouded from the addition, wait until it clears and your levels test in range before getting in.',
  },
  {
    q: 'How is the calcium chloride amount calculated?',
    a: 'It’s linear in the calcium you’re adding. The tool converts your desired ppm increase and pool volume into the moles of calcium needed, then into pounds of the product you selected (dihydrate flake or anhydrous), since the two have different weights per unit of calcium.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate how much calcium chloride to add to a pool',
  description: 'Work out how much calcium chloride to add to raise pool calcium hardness to your target.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter pool volume and current hardness', text: 'Enter your pool volume and current calcium hardness in ppm.' },
    { '@type': 'HowToStep', position: 2, name: 'Set target and pick your product', text: 'Choose your target hardness and whether you’re using flake (dihydrate) or anhydrous calcium chloride.' },
    { '@type': 'HowToStep', position: 3, name: 'Pre-dissolve and add', text: 'Pre-dissolve the calcium chloride in a bucket, then pour it around the pool with the pump running and re-test.' },
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
    { '@type': 'ListItem', position: 2, name: 'Calcium Hardness Calculator', item: SITE_ORIGIN + '/calcium-hardness-calculator/' },
  ],
};

export const CalciumHardnessCalculatorPage = () => {
  usePageMeta({
    title: 'Calcium Hardness Calculator — How Much Calcium Chloride',
    description:
      'Free calcium hardness calculator — how much calcium chloride to add to raise your pool’s hardness to target. Flake or anhydrous, any pool size.',
    canonicalPath: '/calcium-hardness-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { product, volume, volUnit, chNow, chTarget } = state;

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

  const prod = getCalcium(product);
  const gallons = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const ounces = useMemo(() => calciumOz(gallons, num(chNow), num(chTarget), prod), [gallons, chNow, chTarget, prod]);
  const show = ounces > 0;
  const noNeed = num(chTarget) <= num(chNow) && gallons > 0;

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [];
  warnings.push({ tone: 'warn', text: 'Pre-dissolve calcium chloride in a bucket of pool water (add the calcium to the water) — it gets hot and can cloud the water or harm a vinyl liner if dumped in dry.' });
  warnings.push({ tone: 'info', text: 'Pour the dissolved solution slowly around the pool with the pump running. Calcium can’t be removed by chemicals — only dilution lowers it — so add in stages and don’t overshoot.' });
  if (num(chTarget) > IDEAL.ch.high) warnings.push({ tone: 'warn', text: `A target of ${num(chTarget)} ppm is above the usual ${IDEAL.ch.low}–${IDEAL.ch.high} ppm range — high calcium scales surfaces and clouds water, and you can only bring it back down by draining.` });
  if (show && ounces / 16 > 25) warnings.push({ tone: 'warn', text: 'That’s a big jump — add it over two or three days, running the pump and re-testing between, to avoid clouding the water.' });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <Gem className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Calcium Hardness Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          How much calcium chloride to add to raise your pool’s calcium hardness into range — so the
          water isn’t hungry enough to etch plaster.
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
              <label htmlFor="prod" className={labelClass}>Calcium chloride type</label>
              <select id="prod" value={product} onChange={(e) => set('product', e.target.value as State['product'])} className={fieldClass}>
                {CALCIUM_PRODUCTS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="cur" className={labelClass}>Current hardness (ppm)</label>
              <input id="cur" type="number" inputMode="decimal" min="0" value={chNow}
                onChange={(e) => set('chNow', e.target.value)} placeholder="e.g. 150" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="tgt" className={labelClass}>Target hardness (ppm)</label>
              <input id="tgt" type="number" inputMode="decimal" min="0" value={chTarget}
                onChange={(e) => set('chTarget', e.target.value)} placeholder="e.g. 300" className={fieldClass} />
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-3 mb-6">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>
              Most pools aim for {IDEAL.ch.low}–{IDEAL.ch.high} ppm (plaster pools 250–350). Calcium only comes down by{' '}
              <Link to="/guides/how-to-drain-a-pool-with-a-garden-hose/" className="text-brand-orange font-semibold hover:underline">draining and refilling</Link>, so sneak up on your target.
            </span>
          </p>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Add this much {prod.short}</p>
            <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">{show ? formatAmount(ounces, 'solid') : '—'}</p>
            {show ? (
              <p className="text-subtle text-sm mt-2">to raise calcium hardness from {num(chNow)} to {num(chTarget)} ppm in {Math.round(gallons).toLocaleString('en-US')} gal</p>
            ) : (
              <p className="text-subtle text-sm mt-1">{noNeed ? 'Your target isn’t above your current hardness — no calcium needed.' : 'Enter your volume and hardness levels above.'}</p>
            )}
            {show && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Calcium Hardness Calculator — Free Pool Tools" />
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
                <p className="font-mono text-sm text-muted break-words">
                  raise CH by ({num(chTarget)} − {num(chNow)}) ppm in {Math.round(gallons).toLocaleString('en-US')} gal → {formatAmount(ounces, 'solid')} of {prod.short}
                </p>
                <p className="text-[11px] text-subtle mt-2">Each 10 ppm of calcium hardness per 10,000 gal needs ≈ 1.25 lb of dihydrate flake (≈ 0.9 lb anhydrous). Linear in ppm and volume.</p>
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
        <h2>Why calcium hardness matters</h2>
        <p>
          Calcium hardness is how much dissolved calcium your water carries. Water that’s too soft is
          <strong> hungry</strong> — it pulls calcium out of plaster, grout, and concrete to satisfy
          itself, etching and pitting the surfaces over time. Water that’s too hard does the opposite,
          dropping calcium out as scale and cloudiness. The fix for low hardness is
          <strong> calcium chloride</strong>, sold as flake (dihydrate) or pure anhydrous pellets.
        </p>
        <p>
          Calcium hardness is also one leg of your water balance (the Langelier index). Raising it sits
          alongside pH and alkalinity in keeping water neither corrosive nor scaling — which is why
          plaster pools in particular want it held in the 250–350 ppm band. Remember it only comes back
          down by draining and diluting, so it’s better to nudge up to target than to blow past it.
        </p>

        <h2>Worked example</h2>
        <p>
          A 20,000-gallon plaster pool at 150 ppm, targeting 300 ppm:
        </p>
        <p>
          With calcium chloride flake (~1.25 lb per 10 ppm per 10,000 gallons), a 150 ppm rise across
          20,000 gallons works out to about <strong>37 lb</strong> — or roughly 28 lb of anhydrous
          calcium chloride for the same result. Pre-dissolve it in buckets and add it over a couple of
          days so the water doesn’t cloud, re-testing as you go.
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

      <RelatedTools currentPath="/calcium-hardness-calculator" />
    </PageShell>
  );
};
