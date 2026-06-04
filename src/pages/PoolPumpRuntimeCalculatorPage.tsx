import { useEffect, useMemo, useState } from 'react';
import { Timer, Info, Plus, AlertTriangle, Check, Save, Gauge, TrendingDown } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import {
  PUMP_PRESETS,
  getPumpPreset,
  turnoverHours,
  runtimeHours,
  pumpCost,
  toGallons,
  formatUSD,
  formatHoursMinutes,
  vsFlowAtRpm,
  vsWattsAtRpm,
  VS_PUMP_PRESETS,
  getVsPreset,
} from '@/lib/pump';
import { useShareableState, codecs, type ShareSchema } from '@/lib/useShareableState';
import { usePoolProfile, getProfile, saveProfile, clearProfile } from '@/lib/poolProfile';

const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const TURNOVER_IDS = ['1', '1.5', '2'] as const;

type State = {
  mode: 'single' | 'vs';
  volume: string;
  volUnit: 'gal' | 'L';
  turnovers: (typeof TURNOVER_IDS)[number];
  rate: string;
  // single-speed
  gpm: string;
  watts: string;
  // variable-speed (specs at full speed + the running speed)
  maxRpm: string;
  maxGpm: string;
  maxWatts: string;
  rpm: string;
};

const DEFAULTS: State = {
  mode: 'single',
  volume: '20000',
  volUnit: 'gal',
  turnovers: '1',
  rate: '0.17',
  gpm: '60',
  watts: '1500',
  maxRpm: '3450',
  maxGpm: '90',
  maxWatts: '2300',
  rpm: '1800',
};

const SCHEMA = {
  mode: { param: 'm', ...codecs.oneOf(['single', 'vs'] as const) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  turnovers: { param: 'to', ...codecs.oneOf(TURNOVER_IDS) },
  rate: { param: 'r', ...codecs.numStr() },
  gpm: { param: 'g', ...codecs.numStr() },
  watts: { param: 'w', ...codecs.numStr() },
  maxRpm: { param: 'mr', ...codecs.numStr() },
  maxGpm: { param: 'mg', ...codecs.numStr() },
  maxWatts: { param: 'mw', ...codecs.numStr() },
  rpm: { param: 'rp', ...codecs.numStr() },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How do I calculate runtime for a variable-speed pump?',
    a: 'Switch to the “Variable speed” tab. Because a VS pump’s flow scales with its speed (RPM) and its power with the cube of speed, the calculator takes your pump’s full-speed flow and watts and scales both to your chosen RPM, then works out the turnover time and cost at that speed. Lower the speed and you’ll see runtime go up but energy drop sharply — the speed table shows the trade-off so you can pick the cheapest workable RPM.',
  },
  {
    q: 'What RPM should I run my variable-speed pool pump?',
    a: 'For everyday circulation and filtering, most residential VS pumps run well around 1,500–2,500 RPM — low enough to save a lot of energy, high enough to skim the surface and keep the water turning over. Bump up to higher RPM when you’re running a heater or salt chlorinator (they need more flow), vacuuming, or running water features. Use the speed slider above to see the flow, runtime, and cost at each speed for your pool.',
  },
  {
    q: 'How long should I run my pool pump each day?',
    a: 'Long enough to turn the water over at least once a day. For a typical 20,000-gallon pool with a 60 GPM pump that’s about 5–6 hours; in peak swim season, heat, or after heavy use, run 1.5–2 turnovers (closer to 8–12 hours). Enter your volume and flow rate above for your exact number — undersized runtime is the most common cause of cloudy, algae-prone water.',
  },
  {
    q: 'How do I calculate pump run time?',
    a: 'First find your turnover time: gallons ÷ (GPM × 60). That’s how long the pump needs to push your whole pool through the filter once. Multiply by how many turnovers you want per day (1 is the baseline) to get daily runtime. For example, 20,000 gallons ÷ (60 × 60) ≈ 5.6 hours per turnover.',
  },
  {
    q: 'What is pool “turnover”?',
    a: 'Turnover is circulating a volume of water equal to your whole pool through the filter and back. One turnover doesn’t filter 100% of the water (some treated water re-mixes), but it’s the industry yardstick for circulation. Public pools are often required to turn over every 6 hours; residential pools generally aim for at least one turnover per day.',
  },
  {
    q: 'Is it cheaper to run a variable-speed pump?',
    a: 'Almost always, yes. Power rises with roughly the cube of speed, so running at half speed uses about an eighth of the energy — even though you run longer to move the same water. A variable-speed pump at low RPM might use 300–700 watts versus 1,500–2,400 for a single-speed, cutting pump electricity costs by 50–80%. Enter your pump’s actual wattage above to see your numbers.',
  },
  {
    q: 'Should I run the pump during the day or at night?',
    a: 'Run it during daylight if you can. Chlorine and circulation are most needed when the sun is driving photosynthesis (algae) and bathers are in the water. The exception is cost: if your utility charges lower off-peak rates at night, splitting the runtime — some midday for chemistry, the rest off-peak — can save money without hurting water quality.',
  },
  {
    q: 'How much does it cost to run a pool pump?',
    a: 'It depends on the pump’s wattage, daily runtime, and your electricity rate. A 1,500-watt single-speed pump running 6 hours a day at $0.17/kWh costs about $1.50 a day — roughly $45 a month. A variable-speed pump doing the same circulation at low RPM can drop that to well under $20 a month. The calculator estimates your daily, monthly, and season-long cost above.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to calculate pool pump run time',
  description: 'Work out how many hours a day to run your pool pump based on pool volume, pump flow rate, and turnover.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter pool volume', text: 'Enter your pool volume in gallons or liters.' },
    { '@type': 'HowToStep', position: 2, name: 'Pick your pump type', text: 'Choose single-speed (enter flow in GPM) or variable-speed (enter the pump’s full-speed flow and watts, then set the running RPM — flow and power scale automatically).' },
    { '@type': 'HowToStep', position: 3, name: 'Choose turnovers per day', text: 'Pick how many full turnovers you want — 1 is the baseline, 2 for heavy use or heat.' },
    { '@type': 'HowToStep', position: 4, name: 'Read runtime and cost', text: 'See the hours per day to run the pump, plus the daily, monthly, and seasonal electricity cost.' },
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
    { '@type': 'ListItem', position: 2, name: 'Pool Pump Runtime Calculator', item: SITE_ORIGIN + '/pool-pump-runtime-calculator/' },
  ],
};

export const PoolPumpRuntimeCalculatorPage = () => {
  usePageMeta({
    title: 'Pool Pump Runtime Calculator — How Long to Run Your Pump',
    description:
      'Free pool pump runtime calculator — how many hours a day to run your pump for a full turnover, plus the electricity cost. Single-speed and variable-speed (RPM-based) modes. No sign-up.',
    canonicalPath: '/pool-pump-runtime-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { mode, volume, volUnit, turnovers, rate, gpm, watts, maxRpm, maxGpm, maxWatts, rpm } = state;
  const isVs = mode === 'vs';

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
  const turns = num(turnovers) || 1;

  // Flow + power either come straight from the inputs (single-speed) or are
  // derived from the pump's full-speed rating via the affinity laws (variable).
  const maxRpmN = num(maxRpm) || 3450;
  const rpmN = Math.min(num(rpm), maxRpmN);
  const effGpm = isVs ? vsFlowAtRpm(num(maxGpm), maxRpmN, rpmN) : num(gpm);
  const effWatts = isVs ? vsWattsAtRpm(num(maxWatts), maxRpmN, rpmN) : num(watts);

  const oneTurnover = turnoverHours(gallons, effGpm);
  const runtime = runtimeHours(gallons, effGpm, turns);
  const cost = pumpCost(runtime, effWatts, num(rate));
  const ready = gallons > 0 && effGpm > 0;

  // Variable-speed: savings vs running this same pump at full speed, plus a
  // little speed-vs-cost table so the user can find the cheapest workable RPM.
  const fullRuntime = runtimeHours(gallons, num(maxGpm), turns);
  const fullCost = pumpCost(fullRuntime, num(maxWatts), num(rate));
  const savingsPct =
    isVs && fullCost.costDay > 0 ? Math.round((1 - cost.costDay / fullCost.costDay) * 100) : 0;
  const speedRows = useMemo(() => {
    if (!isVs || gallons <= 0 || num(maxGpm) <= 0) return [];
    const rpms = [1200, 1800, 2400, 3000, maxRpmN]
      .filter((r, i, a) => r <= maxRpmN && a.indexOf(r) === i)
      .sort((a, b) => a - b);
    return rpms.map((r) => {
      const f = vsFlowAtRpm(num(maxGpm), maxRpmN, r);
      const w = vsWattsAtRpm(num(maxWatts), maxRpmN, r);
      const rt = runtimeHours(gallons, f, turns);
      return { rpm: r, gpm: f, watts: w, runtime: rt, costMonth: pumpCost(rt, w, num(rate)).costMonth };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVs, gallons, maxGpm, maxWatts, maxRpm, turns, rate]);

  const applyPreset = (id: string) => {
    const p = getPumpPreset(id);
    if (p.id === 'custom') return;
    patch({ gpm: String(p.gpm), watts: String(p.watts) });
  };
  const applyVsPreset = (id: string) => {
    const p = getVsPreset(id);
    if (p.id === 'custom') return;
    patch({ maxRpm: String(p.maxRpm), maxGpm: String(p.maxGpm), maxWatts: String(p.maxWatts) });
  };

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [
    { tone: 'info', text: 'One turnover/day is the baseline. In peak season, heat waves, heavy bather load, or when fighting algae, run more (1.5–2 turnovers).' },
    { tone: 'info', text: 'Run the pump during daylight when chlorine demand and algae pressure are highest — unless off-peak electricity rates make splitting the schedule worthwhile.' },
  ];
  if (runtime > 0 && runtime < 4) warnings.push({ tone: 'warn', text: 'Under ~4 hours/day is light for most pools. Fine in cool weather, but bump it up in swim season to keep the water clear.' });
  if (!isVs && num(watts) >= 1500) warnings.push({ tone: 'warn', text: 'That wattage points to a single-speed pump. Switch to the Variable speed tab to see how much running at low RPM would save — usually 50–80%.' });
  if (isVs && runtime > 24) warnings.push({ tone: 'warn', text: `At ${rpmN} RPM, ${turns}× turnover would take ${formatHoursMinutes(runtime)} — more than a day. Raise the speed or target fewer turnovers.` });
  if (isVs && effGpm > 0 && effGpm < 25) warnings.push({ tone: 'info', text: 'Very low flow may not skim the surface well, and heaters or salt chlorinators often need a minimum flow to run. Bump the speed up while those are operating.' });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <Timer className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool Pump Runtime Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          How many hours a day to run your pump for a full turnover — and what that costs in
          electricity. Clear water without overpaying the power company.
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

          {/* Pool volume */}
          <div className="mb-5">
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

          {/* Pump type tabs */}
          <div className="mb-5">
            <label className={labelClass}>Pump type</label>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-line bg-card-2 p-1">
              {([{ id: 'single', label: 'Single speed' }, { id: 'vs', label: 'Variable speed' }] as { id: State['mode']; label: string }[]).map((t) => (
                <button key={t.id} type="button" onClick={() => set('mode', t.id)} aria-pressed={mode === t.id}
                  className={`inline-flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${mode === t.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'}`}>
                  {t.id === 'vs' && <Gauge className="w-4 h-4" />}{t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Single-speed: flow rate + preset helper */}
          {!isVs && (
            <>
              <div className="mb-5">
                <label htmlFor="gpm" className={labelClass}>Pump flow rate (GPM)</label>
                <input id="gpm" type="number" inputMode="decimal" min="0" value={gpm}
                  onChange={(e) => set('gpm', e.target.value)} placeholder="e.g. 60" className={fieldClass} />
              </div>
              <div className="mb-5">
                <label htmlFor="preset" className={labelClass}>Not sure? Estimate from your pump</label>
                <select id="preset" defaultValue="custom" onChange={(e) => applyPreset(e.target.value)} className={fieldClass}>
                  {PUMP_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
                <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Flow varies with plumbing and filter condition — these presets are ballparks. Use your pump curve or a flow meter for the real number.
                </p>
              </div>
            </>
          )}

          {/* Variable-speed: pump rating + running-speed slider */}
          {isVs && (
            <div className="mb-5 space-y-4">
              <div>
                <label htmlFor="vspreset" className={labelClass}>Your pump (full-speed specs)</label>
                <select id="vspreset" defaultValue="vs-md" onChange={(e) => applyVsPreset(e.target.value)} className={fieldClass}>
                  {VS_PUMP_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="maxgpm" className="text-xs text-muted block mb-1">Full-speed flow (GPM)</label>
                  <input id="maxgpm" type="number" inputMode="decimal" min="0" value={maxGpm}
                    onChange={(e) => set('maxGpm', e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="maxwatts" className="text-xs text-muted block mb-1">Full-speed watts</label>
                  <input id="maxwatts" type="number" inputMode="numeric" min="0" value={maxWatts}
                    onChange={(e) => set('maxWatts', e.target.value)} className={fieldClass} />
                </div>
                <div>
                  <label htmlFor="maxrpm" className="text-xs text-muted block mb-1">Max RPM</label>
                  <input id="maxrpm" type="number" inputMode="numeric" min="0" value={maxRpm}
                    onChange={(e) => set('maxRpm', e.target.value)} className={fieldClass} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="rpm" className={`${labelClass} !mb-0`}>Running speed</label>
                  <span className="text-sm font-bold text-fg tabular-nums">{rpmN.toLocaleString('en-US')} RPM</span>
                </div>
                <input id="rpm" type="range" min={600} max={maxRpmN} step={50} value={rpmN}
                  onChange={(e) => set('rpm', e.target.value)} className="w-full accent-brand-orange" />
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-line bg-card-2 px-3 py-2 text-center">
                    <p className="text-[11px] text-subtle">Flow at this speed</p>
                    <p className="font-display font-bold text-fg text-base tabular-nums">{effGpm > 0 ? `${Math.round(effGpm)} GPM` : '—'}</p>
                  </div>
                  <div className="rounded-lg border border-line bg-card-2 px-3 py-2 text-center">
                    <p className="text-[11px] text-subtle">Power at this speed</p>
                    <p className="font-display font-bold text-fg text-base tabular-nums">{effWatts > 0 ? `${Math.round(effWatts)} W` : '—'}</p>
                  </div>
                </div>
                <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-2">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  Flow scales with speed; power scales with the cube of speed (pump affinity laws). Enter your pump’s full-speed numbers from its curve or display — presets are ballparks.
                </p>
              </div>
            </div>
          )}

          {/* Turnovers */}
          <div className="mb-2">
            <label className={labelClass}>Turnovers per day</label>
            <div className="grid grid-cols-3 gap-2 rounded-xl border border-line bg-card-2 p-1">
              {([{ id: '1', label: '1× standard' }, { id: '1.5', label: '1.5× active' }, { id: '2', label: '2× heavy/heat' }] as { id: State['turnovers']; label: string }[]).map((t) => (
                <button key={t.id} type="button" onClick={() => set('turnovers', t.id)} aria-pressed={turnovers === t.id}
                  className={`py-2.5 px-2 rounded-lg text-[13px] sm:text-sm font-semibold transition-colors ${turnovers === t.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-3 mb-6">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            One full turnover takes {ready ? formatHoursMinutes(oneTurnover) : '—'} at {Math.round(effGpm) || 0} GPM.
          </p>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Run your pump about</p>
            <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">{ready ? formatHoursMinutes(runtime) : '—'}</p>
            {ready ? (
              <p className="text-subtle text-sm mt-2">per day for {turns}× turnover of {Math.round(gallons).toLocaleString('en-US')} gal</p>
            ) : (
              <p className="text-subtle text-sm mt-1">Enter your pool volume and pump details above.</p>
            )}

            {/* Cost row */}
            {ready && effWatts > 0 && num(rate) > 0 && (
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  { label: 'Per day', val: cost.costDay },
                  { label: 'Per month', val: cost.costMonth },
                  { label: 'Per season', val: cost.costSeason },
                ].map((c) => (
                  <div key={c.label} className="rounded-xl border border-line bg-card-2 p-3">
                    <p className="text-[11px] text-subtle">{c.label}</p>
                    <p className="font-display font-bold text-fg text-lg tabular-nums mt-0.5">{formatUSD(c.val)}</p>
                  </div>
                ))}
              </div>
            )}

            {ready && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Pool Pump Runtime Calculator — Free Pool Tools" />
                <button type="button"
                  onClick={() => { saveProfile({ volumeGal: Math.round(gallons) }); setSavedPool(true); setTimeout(() => setSavedPool(false), 2000); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm font-semibold text-muted hover:text-fg hover:border-line-strong transition-colors">
                  {savedPool ? <Check className="w-4 h-4 text-brand-orange" /> : <Save className="w-4 h-4" />}
                  {savedPool ? 'Saved to My Pool' : 'Save to My Pool'}
                </button>
              </div>
            )}
          </div>

          {/* Variable-speed: savings vs full speed + a speed-vs-cost table. */}
          {isVs && ready && effWatts > 0 && num(rate) > 0 && (
            <div className="mt-4 space-y-3">
              {savingsPct > 0 && (
                <div className="flex items-start gap-2.5 rounded-xl border border-brand-orange/40 bg-brand-orange/10 px-4 py-3">
                  <TrendingDown className="w-5 h-5 text-brand-orange shrink-0 mt-0.5" />
                  <p className="text-sm text-fg leading-relaxed">
                    Running at {rpmN.toLocaleString('en-US')} RPM instead of full speed cuts this pump’s energy about{' '}
                    <span className="font-bold text-brand-orange">{savingsPct}%</span> for the same turnover — about{' '}
                    <span className="font-semibold">{formatUSD(Math.max(0, fullCost.costMonth - cost.costMonth))}/month</span> saved.
                  </p>
                </div>
              )}
              <div className="overflow-x-auto rounded-xl border border-line">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-card-2 text-subtle text-[11px] uppercase tracking-wide">
                      <th className="text-left font-semibold px-3 py-2">Speed</th>
                      <th className="text-right font-semibold px-3 py-2">Flow</th>
                      <th className="text-right font-semibold px-3 py-2">Power</th>
                      <th className="text-right font-semibold px-3 py-2">Runtime</th>
                      <th className="text-right font-semibold px-3 py-2">$/mo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {speedRows.map((r) => {
                      const active = Math.abs(r.rpm - rpmN) < 25;
                      return (
                        <tr key={r.rpm} className={active ? 'bg-brand-blue/10 text-fg' : 'text-muted'}>
                          <td className="px-3 py-2 font-semibold tabular-nums">{r.rpm.toLocaleString('en-US')}{active ? ' ●' : ''}</td>
                          <td className="px-3 py-2 text-right tabular-nums">{Math.round(r.gpm)} GPM</td>
                          <td className="px-3 py-2 text-right tabular-nums">{Math.round(r.watts)} W</td>
                          <td className="px-3 py-2 text-right tabular-nums">{r.runtime > 24 ? '>24 hr' : formatHoursMinutes(r.runtime)}</td>
                          <td className="px-3 py-2 text-right tabular-nums font-semibold">{formatUSD(r.costMonth)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-subtle leading-relaxed">
                Slower = far less energy for the same turnover, but longer runtime and less flow per minute. Pick the lowest speed that finishes in a window you’re happy with and keeps skimmers, heaters, and salt cells working.
              </p>
            </div>
          )}

          {/* Electricity inputs — single-speed enters watts; variable-speed
              derives watts from the speed, so it only needs the rate. */}
          <div className={`mt-4 grid gap-4 ${isVs ? '' : 'sm:grid-cols-2'}`}>
            {!isVs && (
            <div>
              <label htmlFor="watts" className={labelClass}>Pump power (watts)</label>
              <input id="watts" type="number" inputMode="numeric" min="0" step="50" value={watts}
                onChange={(e) => set('watts', e.target.value)} placeholder="e.g. 1500" className={fieldClass} />
            </div>
            )}
            <div>
              <label htmlFor="rate" className={labelClass}>Electricity rate ($/kWh)</label>
              <input id="rate" type="number" inputMode="decimal" min="0" step="0.01" value={rate}
                onChange={(e) => set('rate', e.target.value)} placeholder="e.g. 0.17" className={fieldClass} />
            </div>
          </div>

          {/* Show the math */}
          {ready && (
            <details className="group mt-4 rounded-2xl border border-line bg-card-2">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Show the math</span>
                <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange"><Plus className="w-4 h-4" /></span>
              </summary>
              <div className="px-4 pb-4">
                {isVs && (
                  <>
                    <p className="font-mono text-sm text-muted break-words">
                      flow = {num(maxGpm)} GPM × ({rpmN} ÷ {maxRpmN}) = {Math.round(effGpm)} GPM
                    </p>
                    <p className="font-mono text-sm text-muted break-words mt-1.5">
                      power = {num(maxWatts)} W × ({rpmN} ÷ {maxRpmN})³ = {Math.round(effWatts)} W
                    </p>
                  </>
                )}
                <p className="font-mono text-sm text-muted break-words mt-1.5">
                  turnover = gal ÷ (GPM × 60) = {Math.round(gallons).toLocaleString('en-US')} ÷ ({Math.round(effGpm)} × 60) = {oneTurnover.toFixed(2)} hr
                </p>
                <p className="font-mono text-sm text-muted break-words mt-1.5">
                  runtime = {oneTurnover.toFixed(2)} hr × {turns} = {runtime.toFixed(2)} hr/day
                </p>
                {effWatts > 0 && num(rate) > 0 && (
                  <p className="font-mono text-sm text-muted break-words mt-1.5">
                    cost/day = ({Math.round(effWatts)} W ÷ 1000) × {runtime.toFixed(2)} hr × {formatUSD(num(rate))} = {formatUSD(cost.costDay)}
                  </p>
                )}
                <p className="text-[11px] text-subtle mt-2">
                  {isVs
                    ? 'Affinity laws: flow scales with speed, power with the cube of speed. Turnover is the standard circulation yardstick (one pass ≠ 100% filtered). Season ≈ 5 months.'
                    : 'Turnover doesn’t filter 100% of the water in one pass, but it’s the standard circulation yardstick. Season ≈ 5 months.'}
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
        <h2>How runtime is decided</h2>
        <p>
          Pump runtime comes down to one job: pushing your whole pool through the filter often enough
          to keep it clean. Move the full volume through once and you’ve done a <strong>turnover</strong>.
          Divide your gallons by your pump’s flow rate (in gallons per minute, times 60 for an hourly
          rate) and you get the hours one turnover takes — that’s your daily baseline.
        </p>
        <p>
          Run more than one turnover when demand is high: hot weather, lots of swimmers, heavy debris,
          or an algae bloom. Run closer to the minimum in cool, off-season weeks to save power. The
          biggest savings lever isn’t fewer hours — it’s a <strong>variable-speed pump</strong>, which
          moves the same water at a fraction of the wattage.
        </p>

        <h2>Worked example</h2>
        <p>
          A 20,000-gallon pool with a 60 GPM pump:
        </p>
        <p>
          <code>turnover = 20,000 ÷ (60 × 60) ≈ 5.6 hours</code>. So one turnover a day means running
          the pump about <strong>5 hr 34 min</strong>. A 1,500-watt single-speed pump over that time
          uses ~8.3 kWh — about <strong>$1.42/day</strong> at $0.17/kWh, or roughly <strong>$43/month</strong>.
          Drop to a variable-speed pump at ~750 watts and the same circulation costs well under half that.
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

      <RelatedTools currentPath="/pool-pump-runtime-calculator" />
    </PageShell>
  );
};
