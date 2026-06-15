import { useEffect, useMemo, useState } from 'react';
import { Scale, Info, Check, Plus, AlertTriangle, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import { bakingSodaOz, formatAmount, toGallons, IDEAL } from '@/lib/waterBalance';
import { useShareableState, codecs, type ShareSchema } from '@/lib/useShareableState';
import { usePoolProfile, getProfile, saveProfile, clearProfile } from '@/lib/poolProfile';

const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

type State = {
  volume: string;
  volUnit: 'gal' | 'L';
  taNow: string;
  taTarget: string;
};

const DEFAULTS: State = { volume: '20000', volUnit: 'gal', taNow: '70', taTarget: '100' };

const SCHEMA = {
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  taNow: { param: 'c', ...codecs.numStr() },
  taTarget: { param: 't', ...codecs.numStr() },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much baking soda do I add to raise alkalinity?',
    a: 'About 1.4 lb of baking soda per 10,000 gallons raises total alkalinity by roughly 10 ppm. So a 20,000-gallon pool going from 70 to 100 ppm (a 30 ppm bump) needs about 8.4 lb. Enter your pool size and levels above for the exact amount — and add it in stages if it’s a big change.',
  },
  {
    q: 'Is pool alkalinity increaser the same as baking soda?',
    a: 'Yes. “Alkalinity increaser” or “alkalinity up” sold for pools is sodium bicarbonate — the same compound as ordinary baking soda. Plain Arm & Hammer (or any pure sodium bicarbonate) works identically and is usually far cheaper by the pound. Just make sure it’s 100% sodium bicarbonate with no additives.',
  },
  {
    q: 'Will baking soda raise my pH too?',
    a: 'A little. Baking soda mainly raises alkalinity, but it nudges pH upward toward about 8.0–8.3. If your pH is already high, that’s worth watching. To raise alkalinity with minimal pH change, add baking soda; to raise pH with minimal alkalinity change, use soda ash (sodium carbonate) instead.',
  },
  {
    q: 'Baking soda vs soda ash — which do I use?',
    a: 'Use baking soda (sodium bicarbonate) when total alkalinity is low and pH is okay — it raises alkalinity strongly and pH only slightly. Use soda ash (sodium carbonate, “pH up”) when pH is low but alkalinity is fine — it raises pH strongly. They’re different chemicals for different problems, though both push in the “up” direction.',
  },
  {
    q: 'What should pool alkalinity be?',
    a: 'Most pools run best with total alkalinity between 80 and 120 ppm (often 100 ppm is the sweet spot; some salt and plaster pools aim a little lower). Alkalinity is the buffer that keeps pH stable — too low and pH bounces around and water turns corrosive; too high and pH drifts up and you fight scale and cloudiness.',
  },
  {
    q: 'How do I lower alkalinity if it’s too high?',
    a: 'Baking soda only raises alkalinity. To lower it you add acid — muriatic acid or dry acid — which drops alkalinity (and pH) together; then you aerate to bring pH back up while alkalinity stays down. Use the Muriatic Acid Calculator for the exact acid dose.',
  },
  {
    q: 'How long after adding baking soda can I swim?',
    a: 'Broadcast it across the deep end with the pump running, give it about 20–30 minutes to circulate and dissolve, then you’re generally fine to swim once it’s mixed in. Re-test alkalinity (and pH) after a few hours, since baking soda nudges pH up a touch.',
  },
  {
    q: 'How is the baking soda amount calculated?',
    a: 'It’s linear: each 10 ppm rise in alkalinity per 10,000 gallons takes a fixed amount of sodium bicarbonate (about 1.4 lb). The tool scales that by your pool volume and the size of the increase you want, then expresses it in pounds (and ounces for small amounts).',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate how much baking soda to add to a pool',
  description: 'Work out how much baking soda (sodium bicarbonate) to add to raise pool total alkalinity to your target.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter pool volume and current alkalinity', text: 'Enter your pool volume and current total alkalinity in ppm.' },
    { '@type': 'HowToStep', position: 2, name: 'Set your target', text: 'Choose your target alkalinity — most pools aim for 80–120 ppm.' },
    { '@type': 'HowToStep', position: 3, name: 'Add and re-test', text: 'Broadcast the baking soda with the pump running, then re-test alkalinity and pH after a few hours.' },
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
    { '@type': 'ListItem', position: 2, name: 'Pool Alkalinity Calculator', item: SITE_ORIGIN + '/pool-alkalinity-calculator/' },
  ],
};

export const PoolAlkalinityCalculatorPage = () => {
  usePageMeta({
    title: 'Pool Alkalinity Calculator — How Much Baking Soda to Add',
    description:
      'Free pool alkalinity calculator — how much baking soda (sodium bicarbonate) to add to raise total alkalinity to your target, for any pool size. No sign-up.',
    canonicalPath: '/pool-alkalinity-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { volume, volUnit, taNow, taTarget } = state;

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

  const gallons = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const ounces = useMemo(() => bakingSodaOz(gallons, num(taNow), num(taTarget)), [gallons, taNow, taTarget]);
  const show = ounces > 0;
  const tooLow = num(taTarget) >= num(taNow) && gallons > 0;

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [];
  warnings.push({ tone: 'info', text: 'Use 100% sodium bicarbonate — pool “alkalinity increaser” and plain baking soda are the same thing. Broadcast it over the deep end with the pump running.' });
  warnings.push({ tone: 'info', text: 'Baking soda nudges pH up a little as well. Re-test pH after a few hours and adjust if needed.' });
  if (num(taTarget) > IDEAL.ta.high) warnings.push({ tone: 'warn', text: `A target of ${num(taTarget)} ppm is above the usual ${IDEAL.ta.low}–${IDEAL.ta.high} ppm range — high alkalinity makes pH drift up and can cloud water or scale surfaces.` });
  if (show && ounces / 16 > 10) warnings.push({ tone: 'warn', text: 'That’s a large dose — add it in two or three rounds, running the pump and re-testing between, rather than all at once.' });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <Scale className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool Alkalinity Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          How much baking soda to add to raise your pool’s total alkalinity into range — the buffer
          that keeps your pH stable.
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cur" className={labelClass}>Current TA (ppm)</label>
                <input id="cur" type="number" inputMode="decimal" min="0" value={taNow}
                  onChange={(e) => set('taNow', e.target.value)} placeholder="e.g. 70" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="tgt" className={labelClass}>Target TA (ppm)</label>
                <input id="tgt" type="number" inputMode="decimal" min="0" value={taTarget}
                  onChange={(e) => set('taTarget', e.target.value)} placeholder="e.g. 100" className={fieldClass} />
              </div>
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-1 mb-6">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Most pools aim for {IDEAL.ta.low}–{IDEAL.ta.high} ppm total alkalinity. Need to bring it <em>down</em> instead?{' '}
            <Link to="/muriatic-acid-calculator/" className="text-brand-orange font-semibold hover:underline">Use the Muriatic Acid Calculator</Link>.
          </p>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Add this much baking soda</p>
            <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">{show ? formatAmount(ounces, 'solid') : '—'}</p>
            {show ? (
              <p className="text-subtle text-sm mt-2">to raise alkalinity from {num(taNow)} to {num(taTarget)} ppm in {Math.round(gallons).toLocaleString('en-US')} gal</p>
            ) : (
              <p className="text-subtle text-sm mt-1">{tooLow ? 'Your target isn’t above your current alkalinity — no baking soda needed.' : 'Enter your volume and alkalinity levels above.'}</p>
            )}
            {show && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Pool Alkalinity Calculator — Free Pool Tools" />
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
                  ≈ 1.4 lb baking soda per 10 ppm per 10,000 gal → ({num(taTarget)} − {num(taNow)}) ppm × {Math.round(gallons).toLocaleString('en-US')} gal = {formatAmount(ounces, 'solid')}
                </p>
                <p className="text-[11px] text-subtle mt-2">Sodium bicarbonate adds 1 equivalent of alkalinity per mole; the rise is linear in ppm and pool volume.</p>
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
        <h2>Alkalinity is your pH’s shock absorber</h2>
        <p>
          Total alkalinity (TA) is the water’s buffering capacity — its resistance to pH change. When
          alkalinity is in range, pH stays put; when it’s too low, pH bounces around at the smallest
          provocation and the water turns aggressive and corrosive. The fix for low alkalinity is
          <strong> baking soda</strong> (sodium bicarbonate), the same compound sold at a markup as
          “alkalinity increaser.”
        </p>
        <p>
          Baking soda raises alkalinity strongly and pH only slightly, which is exactly what you want
          when TA is low but pH is okay. If your pH is the low one and alkalinity is fine, reach for
          soda ash instead. And if alkalinity is too <em>high</em>, baking soda can’t help — that’s a
          job for acid.
        </p>

        <h2>Worked example</h2>
        <p>
          A 20,000-gallon pool at 70 ppm alkalinity, targeting 100 ppm:
        </p>
        <p>
          At about 1.4 lb per 10 ppm per 10,000 gallons, a 30 ppm rise across 20,000 gallons works out
          to roughly <strong>8.4 lb</strong> of baking soda. Broadcast it over the deep end with the
          pump running, then re-test alkalinity and pH after a few hours — the pH will have crept up a
          little along with the alkalinity.
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

      <RelatedTools currentPath="/pool-alkalinity-calculator" />
    </PageShell>
  );
};
