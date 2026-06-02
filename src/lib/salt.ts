/**
 * Pool salt engine — pure functions. See docs/salt-calculator-research.md.
 *
 * Raise: lbs = (target − current) ppm × gallons × 8.34 ÷ 1,000,000.
 * Lower: dilution only (drain & refill).
 */
import { toGallons } from './chlorine';

/** Weight of 1 US gallon of water, lb. */
export const LB_PER_GAL = 8.34;

/** Acceptable salt range for most salt-chlorine generators. */
export const SALT_IDEAL = { low: 2700, high: 3400, ideal: 3200 };

export interface SaltSystem {
  id: string;
  label: string;
  target: number;
  /** Whether the target is user-editable (manual mode). */
  manual?: boolean;
}

export const SALT_SYSTEMS: SaltSystem[] = [
  { id: 'generic', label: 'Most systems (3,200 ppm)', target: 3200 },
  { id: 'hayward', label: 'Hayward AquaRite (3,200 ppm)', target: 3200 },
  { id: 'pentair', label: 'Pentair IntelliChlor (3,400 ppm)', target: 3400 },
  { id: 'jandy', label: 'Jandy AquaPure (4,000 ppm)', target: 4000 },
  { id: 'manual', label: 'Set my own target', target: 3200, manual: true },
];

export const getSaltSystem = (id: string) => SALT_SYSTEMS.find((s) => s.id === id) ?? SALT_SYSTEMS[0];

/** Pounds of pool salt to raise from current → target ppm in `volumeGal`. */
export const saltToAddLbs = (volumeGal: number, currentPpm: number, targetPpm: number): number => {
  if (volumeGal <= 0 || targetPpm <= currentPpm) return 0;
  return ((targetPpm - currentPpm) * volumeGal * LB_PER_GAL) / 1_000_000;
};

/** Dilution to lower salt: fraction + gallons to drain and refill. */
export const waterToDrainForSalt = (volumeGal: number, currentPpm: number, targetPpm: number) => {
  if (volumeGal <= 0 || currentPpm <= 0 || targetPpm >= currentPpm) return { fraction: 0, gallons: 0 };
  const fraction = Math.max(0, 1 - targetPpm / currentPpm);
  return { fraction, gallons: volumeGal * fraction };
};

/** Friendly weight: pounds + an approximate count of 40-lb bags. */
export const formatSalt = (lbs: number): string => {
  if (lbs <= 0) return '—';
  const r = (n: number) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n));
  const base = `${r(lbs)} lb`;
  return lbs >= 20 ? `${base} (≈ ${Math.round((lbs / 40) * 10) / 10} × 40-lb bags)` : base;
};

export { toGallons };
