/**
 * Chlorine dosing engine — pure functions, no React. See
 * docs/chlorine-calculator-research.md for sources and the validated constants.
 *
 * Core method (Indiana DOH / NSPF Pool & Spa Operator Handbook):
 *   To change free chlorine (FC) by 1 ppm in 10,000 gallons takes 1.3 "ounces"
 *   of a product, divided by the product's available-chlorine fraction. For
 *   LIQUIDS that 1.3 is read as fluid ounces; for SOLIDS as weight ounces.
 *
 *   amount(oz) = 1.3 × (gallons / 10,000) × ΔFC ÷ availableFraction
 *
 * Validated against the DOH worked example: 40,000 gal, 1→3 ppm (ΔFC 2),
 * sodium hypochlorite 12% → ≈ 85.6 fl oz. (See doseOunces test note below.)
 */

export type Phase = 'liquid' | 'solid';
export type Environment = 'outdoor' | 'indoor' | 'spa';

/** fl oz (liquid) or weight oz (solid) per 10,000 gal per 1 ppm, before dividing
 *  by the available-chlorine fraction. */
export const BASE_OZ = 1.3;
const L_PER_GAL = 3.78541;

export interface ChlorineProduct {
  id: string;
  label: string;
  short: string;
  phase: Phase;
  /** Selectable available-chlorine strengths (%). First entry is the default. */
  strengths: number[];
  /** ppm of cyanuric acid added per 1 ppm FC raised (stabilized products only). */
  addsCyaPerPpm?: number;
  addsCalcium?: boolean;
  ph: 'raises' | 'lowers' | 'neutral';
  /** Suitable for shocking (fast, unstabilized). */
  goodForShock?: boolean;
  note: string;
}

export const PRODUCTS: ChlorineProduct[] = [
  {
    id: 'liquid',
    label: 'Liquid chlorine (sodium hypochlorite)',
    short: 'liquid chlorine',
    phase: 'liquid',
    strengths: [12.5, 12, 10],
    ph: 'raises',
    goodForShock: true,
    note: 'Fast-acting, adds no CYA or calcium; nudges pH up. The best all-round choice for dosing and shocking.',
  },
  {
    id: 'bleach',
    label: 'Household bleach',
    short: 'bleach',
    phase: 'liquid',
    strengths: [8.25, 7.5, 6],
    ph: 'raises',
    note: 'Same chemistry as liquid chlorine but weaker, so you need more. Use plain, unscented bleach with no additives.',
  },
  {
    id: 'calhypo',
    label: 'Cal-hypo (calcium hypochlorite)',
    short: 'cal-hypo',
    phase: 'solid',
    strengths: [73, 70, 68, 65, 53, 48],
    addsCalcium: true,
    ph: 'raises',
    goodForShock: true,
    note: 'Granular; pre-dissolve before adding. Adds calcium hardness over time. Good for shocking.',
  },
  {
    id: 'dichlor',
    label: 'Dichlor (stabilized granular)',
    short: 'dichlor',
    phase: 'solid',
    strengths: [56, 62],
    addsCyaPerPpm: 0.9,
    ph: 'lowers',
    note: 'Adds cyanuric acid (~0.9 ppm CYA per 1 ppm FC) — convenient, but repeated use raises CYA quickly.',
  },
  {
    id: 'trichlor',
    label: 'Trichlor (stabilized tablets)',
    short: 'trichlor',
    phase: 'solid',
    strengths: [90],
    addsCyaPerPpm: 0.6,
    ph: 'lowers',
    note: 'Sold as slow-dissolve tablets for a feeder/floater. Adds CYA (~0.6 ppm per 1 ppm FC) and lowers pH.',
  },
  {
    id: 'lithium',
    label: 'Lithium hypochlorite',
    short: 'lithium hypochlorite',
    phase: 'solid',
    strengths: [35],
    ph: 'raises',
    note: 'Dissolves fast with low residue and adds no CYA or calcium — but expensive.',
  },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id) ?? PRODUCTS[0];

/** Convert a volume in the user's unit to US gallons. */
export const toGallons = (volume: number, unit: 'gal' | 'L') =>
  unit === 'L' ? volume / L_PER_GAL : volume;

/**
 * Ounces of product needed to raise FC by `deltaFc` ppm in `volumeGal` gallons.
 * Fluid ounces for liquids, weight ounces for solids.
 */
export const doseOunces = (volumeGal: number, deltaFc: number, strengthPct: number): number => {
  if (volumeGal <= 0 || deltaFc <= 0 || strengthPct <= 0) return 0;
  return BASE_OZ * (volumeGal / 10000) * deltaFc * (100 / strengthPct);
};
// Validation (DOH): doseOunces(40000, 2, 12) === 1.3 * 4 * 2 * (100/12) ≈ 86.7 fl oz
// (DOH rounds the per-ppm figure to 10.7 → 85.6; within rounding). ✓

export interface FcTargets {
  /** Minimum FC to keep sanitizing. */
  min: number;
  /** Recommended operating target range. */
  low: number;
  high: number;
  mid: number;
}

/**
 * Recommended FC for the environment. Outdoor pools are CYA-driven (the FC/CYA
 * relationship): higher CYA needs higher FC. Indoor pools and spas don't use CYA
 * and use the flat CDC/PHTA targets.
 *   outdoor: min ≈ 7.5% of CYA; target ≈ (10% of CYA) + 2, ±1.
 */
export const recommendedFc = (env: Environment, cya: number): FcTargets => {
  if (env === 'spa') return { min: 3, low: 3, high: 5, mid: 4 };
  if (env === 'indoor') return { min: 1, low: 2, high: 4, mid: 3 };
  const c = Math.max(0, cya);
  const mid = c * 0.1 + 2;
  return {
    min: Math.max(1, Math.round(c * 0.075)),
    low: Math.max(2, Math.round(mid - 1)),
    high: Math.round(mid + 1),
    mid: Math.round(mid),
  };
};

/** Shock (SLAM) FC level to clear algae — CYA-dependent (~40% of CYA), with a
 *  sensible floor for low/zero-CYA water. */
export const algaeShockFc = (cya: number) => Math.max(12, Math.round(cya * 0.4));

/** Breakpoint FC to clear chloramines: 10× combined chlorine. */
export const breakpointFc = (combinedChlorine: number) => Math.max(0, combinedChlorine * 10);

/**
 * Default daily FC loss (ppm/day) for the upkeep estimate.
 *
 * Outdoors the dominant driver is UV, which cyanuric acid suppresses — so loss
 * falls smoothly as CYA rises toward a floor (rather than a hard step). Model:
 *   loss = 1.5 (baseline demand) + 4.5 · e^(−CYA/25) (UV component)
 * giving ≈6/day at CYA 0, ≈2.9 at 30, ≈2.1 at 50, leveling near ~1.7 at high
 * CYA — consistent with the documented "2–4 ppm/day for a stabilized pool, far
 * more without CYA". Indoor pools have no UV; spas are small and bather-driven.
 *
 * This is a sensible DEFAULT, not a guarantee — real loss also depends on sun
 * intensity, temperature, and bather load, so the field is user-editable.
 */
export const defaultDailyLoss = (env: Environment, cya: number): number => {
  if (env === 'indoor') return 1;
  if (env === 'spa') return 1.5;
  const loss = 1.5 + 4.5 * Math.exp(-Math.max(0, cya) / 25);
  return Math.round(loss * 10) / 10; // one decimal
};

/** Friendly amount string. Liquids → fl oz → cups/quarts/gallons; solids → oz → lb. */
export const formatAmount = (ounces: number, phase: Phase): string => {
  if (ounces <= 0) return '—';
  const r = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n));
  if (phase === 'liquid') {
    if (ounces < 12) return `${r(ounces)} fl oz`;
    if (ounces < 32) return `${r(ounces)} fl oz (≈ ${r(ounces / 8)} cups)`;
    if (ounces < 128) return `${r(ounces / 32)} quarts (≈ ${r(ounces)} fl oz)`;
    return `${r(ounces / 128)} gallons (≈ ${r(ounces / 128 * 4)} quarts)`;
  }
  if (ounces < 16) return `${r(ounces)} oz`;
  return `${r(ounces / 16)} lb (≈ ${r(ounces)} oz)`;
};
