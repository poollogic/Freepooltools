import { useEffect, useMemo, useState } from 'react';
import { PiggyBank, Info, Plus, AlertTriangle, Check, Save, Gauge, TrendingDown } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import {
  pumpEnergy,
  compareVsReplacement,
  toGallons,
  formatUSD,
  formatHoursMinutes,
  US_LB_CO2_PER_KWH,
} from '@/lib/pump';
import {
  PUMP_GROUPS,
  MODERN_VS_PUMPS,
  getPump,
  getVsPump,
  DEFAULT_PUMP_ID,
  DEFAULT_VS_ID,
  CUSTOM_PUMP_ID,
} from '@/data/pumps';
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
  pumpId: string;
  /** Override for the selected pump's flow ('' = use the model's figure). */
  gpm: string;
  /** Override for the selected pump's watts ('' = use the model's figure). */
  watts: string;
  hours: string;
  vsId: string;
  vsHours: string;
  rate: string;
  volume: string;
  volUnit: 'gal' | 'L';
};

const DEFAULTS: State = {
  pumpId: DEFAULT_PUMP_ID,
  gpm: '',
  watts: '',
  hours: '8',
  vsId: DEFAULT_VS_ID,
  vsHours: '12',
  rate: '0.17',
  volume: '',
  volUnit: 'gal',
};

const SCHEMA = {
  pumpId: { param: 'p', ...codecs.str() },
  gpm: { param: 'g', ...codecs.numStr() },
  watts: { param: 'w', ...codecs.numStr() },
  hours: { param: 'h', ...codecs.numStr() },
  vsId: { param: 'vs', ...codecs.str() },
  vsHours: { param: 'vh', ...codecs.numStr() },
  rate: { param: 'r', ...codecs.numStr() },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much can a variable-speed pool pump really save?',
    a: 'For most pools, 50–80% off the pump’s share of the electric bill — often $300–$800 a year. A single-speed pump runs flat-out at one speed; a variable-speed pump moves the same water at a much lower RPM, and because power rises with the cube of speed, running at half speed uses roughly an eighth of the power. You run longer to move the same gallons, but the energy still drops dramatically. Enter your current pump and run time above for your own number.',
  },
  {
    q: 'Are variable-speed pool pumps worth it?',
    a: 'In almost every case, yes — and in many states they’re now required for new and replacement pumps. The energy savings typically pay back the higher purchase price within one to three years, and the pump then keeps saving for the rest of its life. They’re also quieter and easier on your plumbing and filter. The main exceptions are very small above-ground pools or pumps you barely run, where the dollar savings are smaller.',
  },
  {
    q: 'How much electricity does a pool pump use?',
    a: 'A typical single-speed pump draws 1,500–2,500 watts. Run 8 hours a day, that’s roughly 12–20 kWh daily — about $60–$100 a month at $0.17/kWh, and often a home’s single largest electricity user after heating and cooling. A variable-speed pump doing the same circulation at low speed can cut that to a fraction. The calculator above shows your pump’s daily, monthly, and yearly use.',
  },
  {
    q: 'How is the savings calculated?',
    a: 'First we work out how much water your current pump moves in a day: flow (GPM) × 60 × hours. Then we model a modern variable-speed pump moving that same volume at a lower speed. Flow scales with speed and power with the cube of speed, so the energy to move a fixed amount of water scales with speed squared — that’s the saving. We compare the two pumps’ yearly electricity cost at your local rate. Open “Show the math” under the result to see every step.',
  },
  {
    q: 'How many hours should a variable-speed pump run?',
    a: 'Longer than a single-speed pump, but at far lower power — many owners run 10–14 hours a day, or even continuously at very low RPM. The goal is the same: turn the water over at least once a day. Because low-speed running is so cheap, spreading the same turnover across more hours actually costs less, not more. The calculator lets you set the new pump’s run window so you can see the trade-off.',
  },
  {
    q: 'Will a variable-speed pump pay for itself?',
    a: 'Usually within one to three swim seasons. A quality VS pump runs about $700–$1,200 installed, and saving $400 or more a year on electricity covers that quickly — sometimes faster if your utility offers a rebate (many do, often $200–$400). After payback, the savings are money in your pocket every month for the 8–10+ year life of the pump.',
  },
  {
    q: 'What size variable-speed pump do I need?',
    a: 'For a straight replacement, match or modestly exceed your current pump’s horsepower — a 1.5–2 HP variable-speed pump suits most residential pools. Bigger isn’t worse with a VS pump: a larger pump run at low speed is often more efficient and gives you headroom for a heater, salt cell, or water features. What matters is running it slowly day-to-day, which the speed control lets you do.',
  },
  {
    q: 'Do these numbers assume year-round running?',
    a: 'The yearly figures assume you run the pump every day. If you close the pool or only run it part of the year, scale the yearly cost and savings down to the months you actually run — the percentage saved stays the same. Flow and watts are typical figures at average plumbing resistance; use the adjust fields to enter your pump’s exact specs from its label or the reading on a variable-speed pump’s display.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to estimate variable-speed pool pump savings',
  description:
    'Estimate how much a variable-speed pool pump would save by comparing your current pump’s energy use to a modern VS pump moving the same water.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Pick your current pump', text: 'Choose your current single- or two-speed pump from the list, or enter its flow and watts manually.' },
    { '@type': 'HowToStep', position: 2, name: 'Set your run time', text: 'Set how many hours a day you currently run the pump. The tool shows the water moved per day and the energy used.' },
    { '@type': 'HowToStep', position: 3, name: 'Choose a variable-speed pump', text: 'Pick a modern variable-speed pump and the hours you’d run it. It moves the same water at a lower speed.' },
    { '@type': 'HowToStep', position: 4, name: 'Read the savings', text: 'See the yearly electricity cost of each pump and how much the variable-speed pump would save you.' },
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
    { '@type': 'ListItem', position: 2, name: 'Variable-Speed Pool Pump Savings Calculator', item: SITE_ORIGIN + '/variable-speed-pool-pump-savings-calculator/' },
  ],
};

const formatCo2 = (lb: number) =>
  lb >= 2000 ? `${(lb / 2000).toFixed(1)} tons` : `${Math.round(lb).toLocaleString('en-US')} lb`;

export const VariableSpeedPumpSavingsCalculatorPage = () => {
  usePageMeta({
    title: 'Variable-Speed Pool Pump Savings Calculator — Energy & Cost',
    description:
      'Free variable-speed pool pump savings calculator — pick your current single-speed pump and run time, then see the yearly energy savings of a modern VS pump.',
    canonicalPath: '/variable-speed-pool-pump-savings-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { pumpId, gpm, watts, hours, vsId, vsHours, rate, volume, volUnit } = state;

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

  const isCustom = pumpId === CUSTOM_PUMP_ID;
  const model = getPump(pumpId);
  // Effective specs: a non-empty override wins, otherwise the model's figures.
  const effGpm = gpm.trim() !== '' ? num(gpm) : model?.gpm ?? 0;
  const effWatts = watts.trim() !== '' ? num(watts) : model?.watts ?? 0;

  const hoursN = num(hours);
  const rateN = num(rate);

  const current = useMemo(
    () => pumpEnergy(effGpm, effWatts, hoursN, rateN),
    [effGpm, effWatts, hoursN, rateN],
  );
  const dailyGallons = current.gallonsPerDay;

  const vs = getVsPump(vsId);
  const replacement = useMemo(
    () => compareVsReplacement(dailyGallons, num(vsHours), vs, rateN),
    [dailyGallons, vsHours, vs, rateN],
  );
  const vsEnergy = replacement.energy;

  const ready = effGpm > 0 && effWatts > 0 && hoursN > 0 && rateN > 0;

  const savingsYear = Math.max(0, current.costYear - vsEnergy.costYear);
  const savingsMonth = Math.max(0, current.costMonth - vsEnergy.costMonth);
  const savingsPct = current.costYear > 0 ? Math.round((1 - vsEnergy.costYear / current.costYear) * 100) : 0;
  const kwhSavedYear = Math.max(0, (current.kwhDay - vsEnergy.kwhDay) * 365);
  const co2Year = kwhSavedYear * US_LB_CO2_PER_KWH;

  const gallons = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const turnoversPerDay = gallons > 0 ? dailyGallons / gallons : 0;

  const selectPump = (id: string) => patch({ pumpId: id, gpm: '', watts: '' });

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [
    { tone: 'info', text: 'Flow and watts are typical figures at average plumbing resistance. For an exact result, enter your pump’s specs from its label, or the live wattage shown on a variable-speed pump’s display.' },
    { tone: 'info', text: 'Yearly figures assume you run the pump every day. Close the pool for winter? Scale the year down to the months you actually run — the percent saved stays the same.' },
  ];
  if (ready && replacement.tooSmall) {
    warnings.push({ tone: 'warn', text: `The ${vs.label} can’t move that much water in ${num(vsHours)} h even at full speed — it would need about ${formatHoursMinutes(replacement.hoursPerDay)} a day, or step up to a larger variable-speed pump.` });
  }
  if (ready && effWatts < 1200) {
    warnings.push({ tone: 'info', text: 'This is a smaller pump, so the dollar savings are more modest than a big single-speed — but a variable-speed swap usually still pays off in quieter, gentler running.' });
  }
  if (turnoversPerDay > 0 && turnoversPerDay < 0.8) {
    warnings.push({ tone: 'warn', text: `At this run time you’re turning the water over about ${turnoversPerDay.toFixed(1)}× a day — under one full turnover. Clear water usually needs at least one; you may want to run longer.` });
  }
  if (turnoversPerDay > 2.5) {
    warnings.push({ tone: 'info', text: `You’re turning the water over ${turnoversPerDay.toFixed(1)}× a day — more than most pools need. Trimming the run time would cut cost on either pump.` });
  }

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <PiggyBank className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Variable-Speed Pool Pump Savings Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          Pick your current pump and how long you run it — see what it’s costing you, and how much a
          modern variable-speed pump would save moving the same water.
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

          {/* ── Current pump ── */}
          <h2 className="font-display font-bold text-fg text-lg mb-3">Your current pump</h2>
          <div className="mb-4">
            <label htmlFor="pump" className={labelClass}>Pump make &amp; model</label>
            <select id="pump" value={pumpId} onChange={(e) => selectPump(e.target.value)} className={fieldClass}>
              <option value={CUSTOM_PUMP_ID}>I don’t know — enter specs manually</option>
              {PUMP_GROUPS.map((g) => (
                <optgroup key={g.brand} label={g.brand}>
                  {g.pumps.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Specs: inline inputs for manual entry, otherwise a readout + adjust. */}
          {isCustom ? (
            <div className="mb-5 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="gpm" className="text-xs text-muted block mb-1">Flow rate (GPM)</label>
                <input id="gpm" type="number" inputMode="decimal" min="0" value={gpm}
                  onChange={(e) => set('gpm', e.target.value)} placeholder="e.g. 75" className={fieldClass} />
              </div>
              <div>
                <label htmlFor="watts" className="text-xs text-muted block mb-1">Power draw (watts)</label>
                <input id="watts" type="number" inputMode="numeric" min="0" step="50" value={watts}
                  onChange={(e) => set('watts', e.target.value)} placeholder="e.g. 2000" className={fieldClass} />
              </div>
            </div>
          ) : (
            <details className="group mb-5 rounded-2xl border border-line bg-card-2">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-sm text-muted">
                  This pump: <span className="font-semibold text-fg tabular-nums">~{Math.round(effGpm)} GPM</span> ·{' '}
                  <span className="font-semibold text-fg tabular-nums">~{Math.round(effWatts).toLocaleString('en-US')} W</span>
                </span>
                <span className="text-xs font-semibold text-subtle inline-flex items-center gap-1 group-open:text-brand-orange">
                  Adjust <Plus className="w-3.5 h-3.5 transition-transform duration-200 group-open:rotate-45" />
                </span>
              </summary>
              <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="gpm" className="text-xs text-muted block mb-1">Flow rate (GPM)</label>
                  <input id="gpm" type="number" inputMode="decimal" min="0" value={gpm}
                    onChange={(e) => set('gpm', e.target.value)} placeholder={String(model?.gpm ?? '')} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="watts" className="text-xs text-muted block mb-1">Power draw (watts)</label>
                  <input id="watts" type="number" inputMode="numeric" min="0" step="50" value={watts}
                    onChange={(e) => set('watts', e.target.value)} placeholder={String(model?.watts ?? '')} className={fieldClass} />
                </div>
              </div>
            </details>
          )}

          {/* Run time */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="hours" className={`${labelClass} !mb-0`}>Hours you run it per day</label>
              <span className="text-sm font-bold text-fg tabular-nums">{hoursN || 0} hrs</span>
            </div>
            <input id="hours" type="range" min={1} max={24} step={0.5} value={hoursN || 1}
              onChange={(e) => set('hours', e.target.value)} className="w-full accent-brand-orange" />
            <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              {ready
                ? <>Moves about <span className="font-semibold text-muted">{Math.round(dailyGallons).toLocaleString('en-US')} gal/day</span>{turnoversPerDay > 0 ? <> · {turnoversPerDay.toFixed(1)}× turnover of your pool</> : ''}.</>
                : 'Set your pump and run time to see the water moved and the cost.'}
            </p>
          </div>

          {/* ── Comparison pump ── */}
          <h2 className="font-display font-bold text-fg text-lg mb-3 mt-7 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-brand-blue-light" /> Compare to a variable-speed pump
          </h2>
          <div className="mb-4">
            <label htmlFor="vspump" className={labelClass}>Modern variable-speed pump</label>
            <select id="vspump" value={vsId} onChange={(e) => set('vsId', e.target.value)} className={fieldClass}>
              {MODERN_VS_PUMPS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="vshours" className={`${labelClass} !mb-0`}>Run the new pump per day</label>
              <span className="text-sm font-bold text-fg tabular-nums">{num(vsHours) || 0} hrs</span>
            </div>
            <input id="vshours" type="range" min={6} max={24} step={1} value={num(vsHours) || 6}
              onChange={(e) => set('vsHours', e.target.value)} className="w-full accent-brand-blue" />
            <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              A variable-speed pump moves the same water by running slower for longer. More hours = lower
              speed = less energy{ready && replacement.rpm > 0 ? <> — here, about <span className="font-semibold text-muted">{replacement.rpm.toLocaleString('en-US')} RPM ({Math.round(replacement.gpm)} GPM, {Math.round(replacement.watts)} W)</span></> : ''}.
            </p>
          </div>

          {/* Electricity rate + optional volume */}
          <div className="mt-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="rate" className={labelClass}>Electricity rate ($/kWh)</label>
              <input id="rate" type="number" inputMode="decimal" min="0" step="0.01" value={rate}
                onChange={(e) => set('rate', e.target.value)} placeholder="e.g. 0.17" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="vol" className={labelClass}>Pool volume <span className="font-normal text-subtle">(optional — shows turnovers)</span></label>
              <div className="flex gap-2">
                <input id="vol" type="number" inputMode="decimal" min="0" value={volume}
                  onChange={(e) => set('volume', e.target.value)} placeholder="e.g. 20000" className={fieldClass} />
                <div className="inline-flex rounded-xl border border-line bg-card-2 p-1 shrink-0">
                  {(['gal', 'L'] as const).map((u) => (
                    <button key={u} type="button" onClick={() => set('volUnit', u)} aria-pressed={volUnit === u}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${volUnit === u ? 'bg-card-3 text-fg' : 'text-muted hover:text-fg'}`}>
                      {u === 'gal' ? 'Gal' : 'L'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Result ── */}
          <div className="mt-7 rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">You’d save about</p>
            <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">
              {ready ? `${formatUSD(savingsYear)}/yr` : '—'}
            </p>
            {ready ? (
              <p className="text-subtle text-sm mt-2">
                {savingsPct}% less than your current pump · about {formatUSD(savingsMonth)}/month saved
              </p>
            ) : (
              <p className="text-subtle text-sm mt-1">Pick your current pump and run time above.</p>
            )}

            {/* Current vs VS cost */}
            {ready && (
              <div className="mt-5 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-line bg-card-2 p-3.5 text-left">
                  <p className="text-[11px] text-subtle uppercase tracking-wide">Your pump now</p>
                  <p className="font-display font-bold text-fg text-2xl tabular-nums mt-0.5">{formatUSD(current.costYear)}<span className="text-sm font-normal text-subtle">/yr</span></p>
                  <p className="text-[11px] text-subtle mt-1 tabular-nums">{formatUSD(current.costMonth)}/mo · {current.kwhDay.toFixed(1)} kWh/day</p>
                </div>
                <div className="rounded-xl border border-brand-blue/50 bg-brand-blue/10 p-3.5 text-left">
                  <p className="text-[11px] text-brand-blue-light uppercase tracking-wide font-semibold">Variable-speed</p>
                  <p className="font-display font-bold text-fg text-2xl tabular-nums mt-0.5">{formatUSD(vsEnergy.costYear)}<span className="text-sm font-normal text-subtle">/yr</span></p>
                  <p className="text-[11px] text-subtle mt-1 tabular-nums">{formatUSD(vsEnergy.costMonth)}/mo · {vsEnergy.kwhDay.toFixed(1)} kWh/day</p>
                </div>
              </div>
            )}

            {/* Secondary stats */}
            {ready && savingsYear > 0 && (
              <div className="mt-2.5 grid grid-cols-2 gap-2.5">
                <div className="rounded-xl border border-line bg-card-2 p-3">
                  <p className="text-[11px] text-subtle">Electricity saved</p>
                  <p className="font-display font-bold text-fg text-base tabular-nums mt-0.5">{Math.round(kwhSavedYear).toLocaleString('en-US')} kWh/yr</p>
                </div>
                <div className="rounded-xl border border-line bg-card-2 p-3">
                  <p className="text-[11px] text-subtle">CO₂ avoided</p>
                  <p className="font-display font-bold text-fg text-base tabular-nums mt-0.5">{formatCo2(co2Year)}/yr</p>
                </div>
              </div>
            )}

            {ready && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Variable-Speed Pool Pump Savings Calculator — Free Pool Tools" />
                {gallons > 0 && (
                  <button type="button"
                    onClick={() => { saveProfile({ volumeGal: Math.round(gallons) }); setSavedPool(true); setTimeout(() => setSavedPool(false), 2000); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm font-semibold text-muted hover:text-fg hover:border-line-strong transition-colors">
                    {savedPool ? <Check className="w-4 h-4 text-brand-orange" /> : <Save className="w-4 h-4" />}
                    {savedPool ? 'Saved to My Pool' : 'Save to My Pool'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Savings callout */}
          {ready && savingsYear > 0 && (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-brand-orange/40 bg-brand-orange/10 px-4 py-3">
              <TrendingDown className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
              <p className="text-sm text-fg leading-relaxed">
                Over 10 years that’s about <span className="font-bold text-brand-orange">{formatUSD(savingsYear * 10)}</span> kept
                in your pocket — and a quality variable-speed pump usually pays back its purchase price in the first one to three years.
              </p>
            </div>
          )}

          {/* Show the math */}
          {ready && (
            <details className="group mt-4 rounded-2xl border border-line bg-card-2">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Show the math</span>
                <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange"><Plus className="w-4 h-4" /></span>
              </summary>
              <div className="px-4 pb-4">
                <p className="font-mono text-sm text-muted break-words">
                  water/day = {Math.round(effGpm)} GPM × 60 × {hoursN} hr = {Math.round(dailyGallons).toLocaleString('en-US')} gal
                </p>
                <p className="font-mono text-sm text-muted break-words mt-1.5">
                  now = ({Math.round(effWatts).toLocaleString('en-US')} W ÷ 1000) × {hoursN} hr × {formatUSD(rateN)} × 365 = {formatUSD(current.costYear)}/yr
                </p>
                <p className="font-mono text-sm text-muted break-words mt-1.5">
                  VS @ {replacement.rpm.toLocaleString('en-US')} RPM = {Math.round(replacement.watts)} W for {formatHoursMinutes(replacement.hoursPerDay)} → {formatUSD(vsEnergy.costYear)}/yr
                </p>
                <p className="font-mono text-sm text-muted break-words mt-1.5">
                  saved = {formatUSD(current.costYear)} − {formatUSD(vsEnergy.costYear)} = {formatUSD(savingsYear)}/yr ({savingsPct}%)
                </p>
                <p className="text-[11px] text-subtle mt-2">
                  Affinity laws: a VS pump’s flow scales with speed and its power with the cube of speed, so the energy to move a fixed volume scales with speed². Watts are input (wall) watts. Yearly = daily × 365.
                </p>
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
        <h2>Why a variable-speed pump saves so much</h2>
        <p>
          A single-speed pump has one gear: wide open. It moves a lot of water fast, but it burns
          1,500–2,500 watts the whole time — often a home’s biggest electricity user after the air
          conditioner. A <strong>variable-speed pump</strong> moves the same water by spinning slowly,
          and that’s where the physics works in your favor. Flow drops in step with speed, but power
          drops with the <em>cube</em> of speed. Run at half speed and you move half the water per
          minute while drawing only about an eighth of the power.
        </p>
        <p>
          You run longer to move the same total gallons, so the energy to circulate your pool ends up
          scaling with speed <em>squared</em> — still a massive cut. That’s why dropping from a
          single-speed pump to a variable-speed pump at low RPM typically slashes pump electricity by
          <strong> 50–80%</strong>, and why many states now mandate variable-speed pumps for
          replacements.
        </p>

        <h2>Worked example</h2>
        <p>
          A 1.5 HP single-speed pump (~75 GPM, ~2,000 watts) run 8 hours a day moves about
          36,000 gallons daily and uses 16 kWh — roughly <strong>$2.72/day</strong>, or about
          <strong> $990 a year</strong> at $0.17/kWh.
        </p>
        <p>
          Move that same 36,000 gallons with a modern variable-speed pump spread over 12 hours and it
          only needs to turn at about half speed — drawing a few hundred watts instead of two thousand.
          The yearly cost drops to roughly <strong>$340</strong>, a saving near <strong>$650 a year</strong>.
          Over the life of the pump that’s thousands of dollars, and the pump runs far more quietly too.
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

      <RelatedTools currentPath="/variable-speed-pool-pump-savings-calculator" />
    </PageShell>
  );
};
