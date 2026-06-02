/**
 * Cyanuric acid (CYA / stabilizer) engine — pure functions. See
 * docs/cya-calculator-research.md for sources.
 *
 * Raise: granular cyanuric acid is ~100% pure; 1.3 oz per 10,000 gal raises CYA
 *        1 ppm (DOH/NSPF: 13 oz/10k/10 ppm), divided by product purity.
 * Lower: dilution only — no chemical removes CYA.
 */
import { type Phase, toGallons, formatAmount } from './chlorine';

export type PoolKind = 'chlorine' | 'salt';

/** oz of pure cyanuric acid per 10,000 gal per 1 ppm CYA. */
export const CYA_BASE_OZ = 1.3;

export interface Stabilizer {
  id: string;
  label: string;
  short: string;
  phase: Phase;
  /** % cyanuric acid. */
  purities: number[];
  note: string;
}

export const STABILIZERS: Stabilizer[] = [
  {
    id: 'granular',
    label: 'Granular stabilizer / conditioner (cyanuric acid)',
    short: 'granular stabilizer',
    phase: 'solid',
    purities: [100, 99],
    note: 'Nearly pure cyanuric acid and the cheapest option. Slow to dissolve (24–48h+) — pre-dissolve or use a sock, run the pump, and wait ~48 hours before retesting.',
  },
  {
    id: 'liquid',
    label: 'Liquid stabilizer (pre-dissolved)',
    short: 'liquid stabilizer',
    phase: 'liquid',
    purities: [45],
    note: 'Pre-dissolved (~45% CYA) so it registers within hours, but costs roughly 4–5× more than granular for the same CYA increase.',
  },
];

export const getStabilizer = (id: string) => STABILIZERS.find((s) => s.id === id) ?? STABILIZERS[0];

export interface CyaTarget {
  low: number;
  high: number;
  mid: number;
}
export const recommendedCya = (kind: PoolKind): CyaTarget =>
  kind === 'salt' ? { low: 60, high: 80, mid: 70 } : { low: 30, high: 50, mid: 40 };

/** Ounces of stabilizer to raise CYA by `deltaCya` ppm in `volumeGal` gallons.
 *  Weight oz for granular, fluid oz for liquid. */
export const doseToRaiseCya = (volumeGal: number, deltaCya: number, purityPct: number): number => {
  if (volumeGal <= 0 || deltaCya <= 0 || purityPct <= 0) return 0;
  return CYA_BASE_OZ * (volumeGal / 10000) * deltaCya * (100 / purityPct);
};

/** Dilution to lower CYA: fraction of water (and gallons) to drain + refill. */
export const waterToDrain = (volumeGal: number, currentCya: number, targetCya: number) => {
  if (volumeGal <= 0 || currentCya <= 0 || targetCya >= currentCya) {
    return { fraction: 0, gallons: 0 };
  }
  const fraction = Math.max(0, 1 - targetCya / currentCya);
  return { fraction, gallons: volumeGal * fraction };
};

export { toGallons, formatAmount };
export type { Phase };
