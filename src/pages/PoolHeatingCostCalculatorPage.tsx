import { useEffect, useMemo, useState } from 'react';
import { Thermometer, Info, Plus, AlertTriangle, Check, Save, Flame, Zap } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { ShareButton } from '@/components/ShareButton';
import { RelatedTools } from '@/components/RelatedTools';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import {
  HEATERS,
  getHeater,
  estimateHeating,
  compareHeaters,
  toGallons,
  formatUSD,
  formatHours,
  type HeaterSpec,
  type HeaterType,
} from '@/lib/heating';
import { useShareableState, codecs, type ShareSchema } from '@/lib/useShareableState';
import { usePoolProfile, getProfile, saveProfile, clearProfile } from '@/lib/poolProfile';

const fieldClass =
  'w-full rounded-xl border border-line bg-card-2 px-4 py-3 text-fg text-[15px] placeholder-subtle focus:outline-none focus:border-brand-blue/60 focus:ring-2 focus:ring-brand-blue/30 transition';
const labelClass = 'block text-sm font-semibold text-muted mb-1.5';
const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};
const HEATER_IDS = ['gas', 'propane', 'heatpump'] as const;

type State = {
  heater: HeaterType;
  volume: string;
  volUnit: 'gal' | 'L';
  current: string;
  target: string;
  price: string;
  /** Friendly perf: efficiency % for combustion, COP for heat pump. */
  perf: string;
  btuHr: string;
};

/** Friendly per-heater defaults (efficiency as %, COP as-is). */
const heaterDefaults = (spec: HeaterSpec) => ({
  price: String(spec.defaultPrice),
  perf: spec.isCop ? String(spec.defaultPerf) : String(Math.round(spec.defaultPerf * 100)),
  btuHr: String(spec.defaultBtuHr),
});

const DEFAULTS: State = {
  heater: 'gas',
  volume: '20000',
  volUnit: 'gal',
  current: '70',
  target: '85',
  ...heaterDefaults(getHeater('gas')),
};

const SCHEMA = {
  heater: { param: 'h', ...codecs.oneOf(HEATER_IDS) },
  volume: { param: 'v', ...codecs.numStr() },
  volUnit: { param: 'u', ...codecs.oneOf(['gal', 'L'] as const) },
  current: { param: 'c', ...codecs.numStr() },
  target: { param: 't', ...codecs.numStr() },
  price: { param: 'p', ...codecs.numStr() },
  perf: { param: 'e', ...codecs.numStr() },
  btuHr: { param: 'b', ...codecs.numStr() },
} satisfies ShareSchema<State>;

const FAQS: { q: string; a: string }[] = [
  {
    q: 'How much does it cost to heat a pool?',
    a: 'It depends on pool size, how many degrees you’re raising the water, your heater type, and local fuel prices. As a benchmark, heating a 20,000-gallon pool by 15 °F costs roughly $45 with natural gas, about $23 with an electric heat pump, and near $98 with propane — at typical U.S. rates. Enter your own numbers above for an exact figure, and remember holding that temperature costs more on top of the initial heat-up.',
  },
  {
    q: 'Is a heat pump or a gas heater cheaper to run?',
    a: 'Per unit of heat, an electric heat pump is almost always cheaper to operate because it moves heat instead of burning fuel — a COP around 5 means it delivers roughly five times the energy it draws. Gas costs more per BTU but heats far faster and works in any weather. Propane is usually the priciest per BTU. The trade-off: heat pumps are slow and lose output in cold air; gas wins when you want the pool warm today.',
  },
  {
    q: 'How long does it take to heat a pool?',
    a: 'Time = energy needed ÷ heater output. A 250,000 BTU gas heater warms a 20,000-gallon pool about 15 °F in roughly 12 hours; a 110,000 BTU heat pump doing the same takes closer to 23 hours. Bigger pools, bigger temperature jumps, and cold or windy conditions all stretch that out. The calculator estimates your heat-up time from the heater size you enter.',
  },
  {
    q: 'Does a pool cover really save money on heating?',
    a: 'Yes — it’s the single biggest saver. Most of a pool’s heat loss is evaporation, and a solar or thermal cover cuts that by 50–70%. The U.S. Department of Energy reports covers can reduce heating energy by up to 70%. Whatever it costs to heat your pool, a cover keeps that heat in overnight so your heater isn’t fighting the same battle every morning.',
  },
  {
    q: 'How is pool heating cost calculated?',
    a: 'First the energy: BTU = gallons × 8.34 × temperature rise in °F. Then the fuel: for gas or propane, divide by the heater’s efficiency and by the BTU per fuel unit (100,000 per therm; 91,500 per gallon of propane). For a heat pump, divide by its COP and by 3,412 BTU per kWh. Multiply the fuel used by your local price and you’ve got the cost. This tool does all of that and shows the math.',
  },
  {
    q: 'Why does it cost more to keep a pool warm than these numbers show?',
    a: 'This calculator estimates the one-time energy to raise the water to your target. Once it’s warm, the pool constantly loses heat to evaporation, wind, and cooler air, so the heater keeps cycling to hold temperature — that ongoing maintenance is where most seasonal heating dollars go. A cover, wind breaks, and not overheating the water are the levers that cut it.',
  },
];

const howToSchema = {
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: 'How to estimate the cost to heat a pool',
  description: 'Estimate the energy, cost, and time to heat your pool with a gas heater, propane heater, or electric heat pump.',
  step: [
    { '@type': 'HowToStep', position: 1, name: 'Enter pool size and temperatures', text: 'Enter your pool volume, current water temperature, and the target you want to reach.' },
    { '@type': 'HowToStep', position: 2, name: 'Pick your heater and fuel price', text: 'Choose natural gas, propane, or an electric heat pump, and set your local fuel price.' },
    { '@type': 'HowToStep', position: 3, name: 'Read the cost, time, and comparison', text: 'See the cost and hours to heat up, plus a side-by-side cost of all three heater types.' },
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
    { '@type': 'ListItem', position: 2, name: 'Pool Heating Cost Calculator', item: SITE_ORIGIN + '/pool-heating-cost-calculator/' },
  ],
};

export const PoolHeatingCostCalculatorPage = () => {
  usePageMeta({
    title: 'Pool Heating Cost Calculator — Gas vs. Heat Pump',
    description:
      'Free pool heating cost calculator — estimate the cost, energy, and time to heat your pool by gas, propane, or electric heat pump. Compare all three. No sign-up.',
    canonicalPath: '/pool-heating-cost-calculator/',
    jsonLd: [howToSchema, faqSchema, breadcrumbSchema],
  });

  const { state, set, patch, shareUrl } = useShareableState<State>(DEFAULTS, SCHEMA);
  const { heater, volume, volUnit, current, target, price, perf, btuHr } = state;

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

  const spec = getHeater(heater);
  const gallons = useMemo(() => toGallons(num(volume), volUnit), [volume, volUnit]);
  const deltaF = Math.max(0, num(target) - num(current));
  // Convert the friendly perf (efficiency % or COP) into the engine's perf value.
  const perfValue = spec.isCop ? num(perf) : num(perf) / 100;

  const est = useMemo(
    () => estimateHeating({ gallons, deltaF, spec, price: num(price), perf: perfValue, btuHr: num(btuHr) }),
    [gallons, deltaF, spec, price, perfValue, btuHr],
  );
  const comparison = useMemo(() => compareHeaters(gallons, deltaF), [gallons, deltaF]);
  const cheapestId = comparison.reduce((a, b) => (b.est.cost < a.est.cost ? b : a), comparison[0]).spec.id;

  const ready = gallons > 0 && deltaF > 0;
  const costPerDegree = deltaF > 0 ? est.cost / deltaF : 0;

  const switchHeater = (id: HeaterType) => patch({ heater: id, ...heaterDefaults(getHeater(id)) });

  const warnings: { tone: 'warn' | 'info'; text: string }[] = [
    { tone: 'info', text: 'This is the one-time cost to heat from your current temperature to your target. Holding that temperature costs more over the season — the pool keeps losing heat to evaporation and air.' },
    { tone: 'info', text: 'A solar or thermal cover is the biggest saver: it cuts evaporation loss 50–70%, so the heat you pay for stays in the pool overnight.' },
  ];
  if (heater === 'heatpump') warnings.push({ tone: 'warn', text: 'Heat pumps slow down and lose efficiency as the air cools — below ~50 °F output drops sharply. Great for warm-climate maintenance, weak for fast heat-ups in cold weather.' });
  if (num(target) > 90) warnings.push({ tone: 'warn', text: 'Targets above ~90 °F use a lot more fuel and are bathwater-warm for a pool. Most swimmers are comfortable at 78–84 °F.' });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-8 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <Thermometer className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free Pool Tool</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool Heating Cost Calculator
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          What it costs — and how long it takes — to heat your pool, with gas, propane, and electric
          heat pump compared side by side.
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

          {/* Heater type */}
          <div className="grid grid-cols-3 gap-2 mb-6 rounded-xl border border-line bg-card-2 p-1">
            {HEATERS.map((h) => (
              <button key={h.id} type="button" onClick={() => switchHeater(h.id)} aria-pressed={heater === h.id}
                className={`py-2.5 px-2 rounded-lg text-[13px] sm:text-sm font-semibold transition-colors inline-flex items-center justify-center gap-1.5 ${heater === h.id ? 'bg-brand-blue text-white shadow-sm shadow-brand-blue/30' : 'text-muted hover:text-fg'}`}>
                {h.id === 'heatpump' ? <Zap className="w-3.5 h-3.5 shrink-0" /> : <Flame className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{h.label}</span>
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
              <label htmlFor="price" className={labelClass}>Fuel price ($/{spec.priceUnit})</label>
              <input id="price" type="number" inputMode="decimal" min="0" step="0.01" value={price}
                onChange={(e) => set('price', e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-2">
            <div>
              <label htmlFor="cur" className={labelClass}>Current water temp (°F)</label>
              <input id="cur" type="number" inputMode="decimal" value={current}
                onChange={(e) => set('current', e.target.value)} placeholder="e.g. 70" className={fieldClass} />
            </div>
            <div>
              <label htmlFor="tgt" className={labelClass}>Target temp (°F)</label>
              <input id="tgt" type="number" inputMode="decimal" value={target}
                onChange={(e) => set('target', e.target.value)} placeholder="e.g. 85" className={fieldClass} />
            </div>
          </div>
          <p className="flex items-start gap-2 text-xs text-subtle leading-relaxed mt-3 mb-5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Raising the water {deltaF > 0 ? `${deltaF.toFixed(0)} °F` : '0 °F'}. Most swimmers are comfortable at 78–84 °F.
          </p>

          {/* Advanced */}
          <details className="group mb-6 rounded-2xl border border-line bg-card-2">
            <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Advanced: heater specs</span>
              <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange"><Plus className="w-4 h-4" /></span>
            </summary>
            <div className="px-4 pb-4 grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="perf" className={labelClass}>{spec.isCop ? 'COP (efficiency factor)' : 'Thermal efficiency (%)'}</label>
                <input id="perf" type="number" inputMode="decimal" min="0" step={spec.isCop ? '0.1' : '1'} value={perf}
                  onChange={(e) => set('perf', e.target.value)} className={fieldClass} />
              </div>
              <div>
                <label htmlFor="btu" className={labelClass}>Heater size (BTU/hr{spec.isCop ? ', output' : ', input'})</label>
                <input id="btu" type="number" inputMode="numeric" min="0" step="10000" value={btuHr}
                  onChange={(e) => set('btuHr', e.target.value)} className={fieldClass} />
              </div>
            </div>
          </details>

          {/* Result */}
          <div className="rounded-2xl bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 border border-line p-6 text-center">
            <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-1">Cost to heat up · {spec.label}</p>
            <p className="font-display font-bold text-fg text-4xl sm:text-5xl tabular-nums">{ready ? formatUSD(est.cost) : '—'}</p>
            {ready ? (
              <p className="text-subtle text-sm mt-2">
                to raise {Math.round(gallons).toLocaleString('en-US')} gal by {deltaF.toFixed(0)} °F · ~{formatHours(est.hours)} · {formatUSD(costPerDegree)}/°F
              </p>
            ) : (
              <p className="text-subtle text-sm mt-1">Enter your volume and a target above your current temperature.</p>
            )}

            {ready && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
                <ShareButton url={shareUrl} shareTitle="Pool Heating Cost Calculator — Free Pool Tools" />
                <button type="button"
                  onClick={() => { saveProfile({ volumeGal: Math.round(gallons) }); setSavedPool(true); setTimeout(() => setSavedPool(false), 2000); }}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-card-2 px-3 py-2 text-sm font-semibold text-muted hover:text-fg hover:border-line-strong transition-colors">
                  {savedPool ? <Check className="w-4 h-4 text-brand-orange" /> : <Save className="w-4 h-4" />}
                  {savedPool ? 'Saved to My Pool' : 'Save to My Pool'}
                </button>
              </div>
            )}
          </div>

          {/* Comparison */}
          {ready && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {comparison.map(({ spec: s, est: e }) => (
                <div key={s.id}
                  className={`rounded-xl border p-3 text-center ${s.id === cheapestId ? 'border-brand-blue/50 bg-brand-blue/10' : 'border-line bg-card-2'}`}>
                  <p className="text-[11px] text-subtle truncate">{s.label}</p>
                  <p className="font-display font-bold text-fg text-lg tabular-nums mt-0.5">{formatUSD(e.cost)}</p>
                  <p className="text-[11px] text-subtle mt-0.5">~{formatHours(e.hours)}</p>
                  {s.id === cheapestId && <p className="text-[10px] font-semibold text-brand-blue-light uppercase tracking-wide mt-1">Cheapest</p>}
                </div>
              ))}
            </div>
          )}
          {ready && <p className="mt-2 text-[11px] text-subtle text-center">Comparison uses typical U.S. rates (gas $1.50/therm, propane $3.00/gal, electricity $0.17/kWh). Your selected estimate above uses the price you entered.</p>}

          {/* Show the math */}
          {ready && (
            <details className="group mt-4 rounded-2xl border border-line bg-card-2">
              <summary className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 py-3">
                <span className="text-xs uppercase tracking-[0.15em] text-subtle font-semibold">Show the math</span>
                <span className="text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange"><Plus className="w-4 h-4" /></span>
              </summary>
              <div className="px-4 pb-4">
                <p className="font-mono text-sm text-muted break-words">
                  energy = gal × 8.34 × ΔT = {Math.round(gallons).toLocaleString('en-US')} × 8.34 × {deltaF.toFixed(0)} = {Math.round(est.btu).toLocaleString('en-US')} BTU
                </p>
                <p className="font-mono text-sm text-muted break-words mt-1.5">
                  {spec.isCop
                    ? `kWh = BTU ÷ COP ÷ 3,412 = ${Math.round(est.btu).toLocaleString('en-US')} ÷ ${perfValue} ÷ 3,412 = ${est.units.toFixed(1)} kWh`
                    : `${spec.priceUnit}s = BTU ÷ efficiency ÷ ${spec.btuPerUnit.toLocaleString('en-US')} = ${est.units.toFixed(1)} ${spec.priceUnit}s`}
                </p>
                <p className="font-mono text-sm text-muted break-words mt-1.5">
                  cost = {est.units.toFixed(1)} {spec.isCop ? 'kWh' : `${spec.priceUnit}s`} × {formatUSD(num(price))} = {formatUSD(est.cost)}
                </p>
                <p className="text-[11px] text-subtle mt-2">8.34 = lb per gallon of water; 1 BTU raises 1 lb of water 1 °F. Net energy to the water — real-world use is higher due to heat loss during heat-up.</p>
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
        <h2>Gas, propane, or heat pump?</h2>
        <p>
          The cheapest fuel to <em>run</em> is almost always an <strong>electric heat pump</strong>,
          because it moves heat from the air into the water instead of burning fuel — a COP of 5 means
          it delivers about five units of heat for every unit of electricity it draws. The catch is
          speed and weather: heat pumps heat slowly and lose output as the air gets cold.
        </p>
        <p>
          <strong>Natural gas</strong> costs more per BTU but heats fast and works in any temperature —
          the right pick when you want the pool warm tonight or you’re heating a spa. <strong>Propane</strong>
          behaves like gas but is usually the most expensive per BTU, so it mainly makes sense where
          natural gas isn’t available.
        </p>

        <h2>Worked example</h2>
        <p>
          A 20,000-gallon pool at 70 °F, heated to 85 °F (a 15 °F rise):
        </p>
        <p>
          <code>energy = 20,000 × 8.34 × 15 = 2,502,000 BTU</code>. With a natural-gas heater at 84%
          efficiency and $1.50/therm, that’s <code>2,502,000 ÷ 0.84 ÷ 100,000 ≈ 29.8 therms ≈ $45</code>.
          The same heat-up on a heat pump (COP 5.5, $0.17/kWh) is about 133 kWh ≈ <strong>$23</strong> —
          roughly half the cost, but it takes nearly twice as long.
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

      <RelatedTools currentPath="/pool-heating-cost-calculator" />
    </PageShell>
  );
};
