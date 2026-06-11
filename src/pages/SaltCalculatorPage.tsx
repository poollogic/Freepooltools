import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Waves, Info, Check, Plus, AlertTriangle, Save } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import {
  SALT_SYSTEMS,
  SALT_IDEAL,
  getSaltSystem,
  saltToAddLbs,
  waterToDrainForSalt,
  formatSalt,
  toGallons,
} from '@/lib/salt';
import { useShareableState, codecs, type ShareSchema } from '@/lib/useShareableState';
import { usePoolProfile, getProfile, saveProfile, clearProfile } from '@/lib/poolProfile';

const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const SYSTEM_IDS = ['generic', 'hayward', 'pentair', 'jandy', 'manual'] as const;

type State = {
  mode: 'raise' | 'lower';
  system: (typeof SYSTEM_IDS)[number];
  volume: string;
  volUnit: 'gal' | 'L';
  currentSalt: string;
  targetSalt: string;
};

const DEFAULTS: State = {
  mode: 'raise',
  system: 'generic',
  volume: '20000',
  volUnit: 'gal',
  currentSalt: '0',
  targetSalt: '3200',
};

const SCHEMA = {
  mode: { param: 'mode', ...codecs.oneOf(['raise', 'lower'] as const) },
  system: { param: 'sys', ...codecs.oneOf(SYSTEM_IDS) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  currentSalt: { param: 'cur', ...codecs.numStr() },
  targetSalt: { param: 't', ...codecs.numStr() },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much salt do I add to my pool?',
    a: 'Pounds of salt = (target − current ppm) × gallons × 8.34 ÷ 1,000,000. For example, a 10,000-gallon pool starting at 0 needs about 267 lb (six to seven 40-lb bags) to reach 3,200 ppm. Enter your volume and levels above and the calculator works it out exactly.',
  },
  {
    q: 'What should the salt level be in a saltwater pool?',
    a: 'Most salt-chlorine generators want 2,700–3,400 ppm, with about 3,200 ppm ideal. Brands vary slightly — Hayward AquaRite ~3,200, Pentair IntelliChlor ~3,400, Jandy AquaPure ~4,000 — so check your unit’s manual. Below ~2,700 ppm the generator slows or stops; too high can taste salty and trip a high-salt shutdown.',
  },
  {
    q: 'How do I lower the salt level in my pool?',
    a: 'There’s no chemical that removes salt — you lower it by dilution. Drain a fraction equal to 1 − (target ÷ current) and refill with fresh water. Use the “Lower salt” mode for the exact gallons. Note this also lowers CYA, alkalinity, and calcium, so re-test afterward.',
  },
  {
    q: 'What kind of salt do I use?',
    a: 'Use pool-grade salt — sodium chloride that’s at least 99% pure, non-iodized, with no anti-caking or yellow-prussiate additives. It’s the same idea as water-softener salt but cleaner; avoid rock salt or table salt.',
  },
  {
    q: 'How long does pool salt take to dissolve?',
    a: 'Broadcast it across the deep end (never down the skimmer), brush it around to help it dissolve, and run the pump for about 24 hours before testing. Adding it in stages and re-testing keeps you from overshooting — since the only way down is draining.',
  },
  {
    q: 'Why does my salt system say “low salt” or stop making chlorine?',
    a: 'Salt-chlorine generators need enough salt to run; below roughly 2,700 ppm most reduce output or shut off and flash a low-salt warning. Cold water also lowers readings. Add salt to your target and the cell should resume — but confirm with an independent salt test, as cell readings drift as they age.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate how much salt to add to a pool',
  description:
    'Work out how much pool salt to add to reach your salt-chlorine generator’s target level, or how much water to drain to lower salt.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter volume and current salt', text: 'Enter your pool volume and current salt reading in ppm.' },
    { '@type': 'HowToStep', position: 2, name: 'Pick your target', text: 'Choose your salt system (or set a target) — most want 2,700–3,400 ppm.' },
    { '@type': 'HowToStep', position: 3, name: 'Read the result', text: 'Get the pounds (and 40-lb bags) of salt to add, or the gallons to drain to lower it.' },
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
    { '@type': 'ListItem', position: 2, name: 'Pool Salt Calculator', item: SITE_ORIGIN + '/salt-calculator/' },
  ],
};

export const SaltCalculatorPage = () => {
  usePageMeta({
    title: 'Pool Salt Calculator: How Much Salt to Add',
    description:
      'Free pool salt calculator — how much salt to add to hit your salt system’s target (2,700–3,400 ppm), or how much to drain to lower it. No sign-up.',
    canonicalPath: '/salt-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { mode, system, volume, volUnit, currentSalt, targetSalt } = state;

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

  const sys = getSaltSystem(system);
  const volumeGal = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const currentNum = num(currentSalt);
  const target = num(targetSalt) > 0 ? num(targetSalt) : SALT_IDEAL.ideal;

  const addLbs = saltToAddLbs(volumeGal, currentNum, target);
  const drain = waterToDrainForSalt(volumeGal, currentNum, target);
  const showRaise = mode === 'raise' && volumeGal > 0 && target > currentNum;
  const showLower = mode === 'lower' && drain.gallons > 0;

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [];
  if (mode === 'raise') {
    if (target > SALT_IDEAL.high) warnings.push({ tone: 'warn', text: `${target.toLocaleString('en-US')} ppm is above the typical ${SALT_IDEAL.low.toLocaleString('en-US')}–${SALT_IDEAL.high.toLocaleString('en-US')} ppm range — high salt can taste salty and some cells shut down. Confirm your unit’s spec.` });
    warnings.push({ tone: 'info', text: 'Use pool-grade salt (≥99% pure NaCl, non-iodized, no additives). Broadcast it over the pool — never down the skimmer.' });
    warnings.push({ tone: 'info', text: 'Brush to dissolve, run the pump ~24h, then re-test. Add in stages — salt only comes down by draining, so don’t overshoot.' });
  } else {
    warnings.push({ tone: 'info', text: 'No chemical removes salt — dilution is the only way. Draining also lowers CYA, alkalinity, and calcium, so re-test and rebalance after refilling.' });
    if (drain.fraction > 0.5) warnings.push({ tone: 'warn', text: 'That’s a large drain — do it in stages and mind hydrostatic (pop-up) risk before draining a lot.' });
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
          <Waves className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool Salt Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          How much salt to add to reach your salt-chlorine generator’s target — or how much water to
          drain to bring a high salt level back down.
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
            {([{ id: 'raise', label: 'Add salt' }, { id: 'lower', label: 'Lower salt' }] as { id: State['mode']; label: string }[]).map((m) => (
              <button key={m.id} type="button" onClick={() => set('mode', m.id)} aria-pressed={mode === m.id}
                className={`py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === m.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'}`}>
                {m.label}
              </button>
            ))}
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
              <label htmlFor="cur" className={labelClass}>Current salt (ppm)</label>
              <input id="cur" type="number" inputMode="decimal" min="0" value={currentSalt}
                onChange={(e) => set('currentSalt', e.target.value)} placeholder="e.g. 0" className={fieldClass} />
            </div>
          </div>

          {/* System + target */}
          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="sys" className={labelClass}>Salt system / target</label>
              <select id="sys" value={system}
                onChange={(e) => { const s = getSaltSystem(e.target.value); patch({ system: s.id as State['system'], ...(s.manual ? {} : { targetSalt: String(s.target) }) }); }}
                className={fieldClass}>
                {SALT_SYSTEMS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="tgt" className={labelClass}>Target salt (ppm)</label>
              <input id="tgt" type="number" inputMode="decimal" min="0" value={targetSalt}
                onChange={(e) => patch({ targetSalt: e.target.value, system: 'manual' })} className={fieldClass} />
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-3 mb-6">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Most generators run best at {SALT_IDEAL.low.toLocaleString('en-US')}–{SALT_IDEAL.high.toLocaleString('en-US')} ppm (≈{SALT_IDEAL.ideal.toLocaleString('en-US')} ideal). Always defer to your unit’s manual.
          </p>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            {mode === 'raise' ? (
              <>
                <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Add this much pool salt</p>
                <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">{showRaise ? formatSalt(addLbs) : '—'}</p>
                {showRaise ? (
                  <p className="text-subtle text-sm mt-2">to raise salt from {currentNum.toLocaleString('en-US')} to {target.toLocaleString('en-US')} ppm in {Math.round(volumeGal).toLocaleString('en-US')} gal</p>
                ) : (
                  <p className="text-subtle text-sm mt-1">{currentNum >= target && volumeGal > 0 ? 'Already at or above your target — no salt needed.' : 'Enter your volume and current salt above.'}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Drain &amp; refill this much</p>
                <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">{showLower ? `${Math.round(drain.gallons).toLocaleString('en-US')} gal` : '—'}</p>
                {showLower ? (
                  <p className="text-subtle text-sm mt-2">≈ {Math.round(drain.fraction * 100)}% of your pool, to go from {currentNum.toLocaleString('en-US')} to {target.toLocaleString('en-US')} ppm</p>
                ) : (
                  <p className="text-subtle text-sm mt-1">{currentNum > 0 && target >= currentNum ? 'Your target isn’t below your current salt — nothing to drain.' : 'Enter your volume and current salt above.'}</p>
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
                <ShareButton url={shareUrl} shareTitle="Pool Salt Calculator — Free Pool Tools" />
                <button type="button"
                  onClick={() => { saveProfile({ volumeGal: Math.round(volumeGal) }); setSavedPool(true); setTimeout(() => setSavedPool(false), 2000); }}
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
                      (target − current) × gal × 8.34 ÷ 1,000,000 → ({target.toLocaleString('en-US')} − {currentNum.toLocaleString('en-US')}) × {Math.round(volumeGal).toLocaleString('en-US')} × 8.34 ÷ 1,000,000
                    </p>
                    <p className="text-[11px] text-subtle mt-1.5">8.34 = weight (lb) of 1 US gallon of water.</p>
                  </>
                ) : (
                  <>
                    <p className="font-mono text-sm text-muted break-words">
                      drain = volume × (1 − target ÷ current) → {Math.round(volumeGal).toLocaleString('en-US')} × (1 − {target.toLocaleString('en-US')} ÷ {currentNum.toLocaleString('en-US')})
                    </p>
                    <p className="text-[11px] text-subtle mt-1.5">Salt is only removed by replacing water — dilution lowers it proportionally.</p>
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

      <RelatedTools currentPath="/salt-calculator" />
    </PageShell>
  );
};
