/**
 * Langelier Saturation Index (LSI) engine — pure functions.
 *
 *   LSI = pH + TF + CF + AF − TDS_constant
 *
 * where TF (temperature), CF (calcium hardness) and AF (carbonate alkalinity)
 * are looked up from the NSPF / industry-standard factor tables and interpolated.
 * The TDS constant is 12.1 for traditional chlorine pools and 12.2 for saltwater
 * pools (higher total dissolved solids). Note the calcium factor is the NSPF
 * table value, which is ≈ log₁₀(CH) − 0.4, NOT log₁₀(CH) directly.
 *
 * Ported from the proven Suncoast field app (see lsi-utils.ts / chemistry-utils.ts).
 * Sources: NSPF Pool & Spa Operator Handbook; Taylor Technologies Watergram.
 */

/** NSPF standard Temperature Factor table (°F → TF). */
export const LSI_TEMP_TABLE: [number, number][] = [
  [32, 0.0], [37, 0.1], [46, 0.2], [53, 0.3], [60, 0.4],
  [66, 0.5], [76, 0.6], [84, 0.7], [94, 0.8], [105, 0.9],
];

/**
 * NSPF/industry Calcium Hardness factor table (ppm → CF).
 * NOTE: CF ≠ log₁₀(CH). The industry values are ≈ log₁₀(CH) − 0.4.
 */
export const LSI_CALCIUM_TABLE: [number, number][] = [
  [25, 1.0], [50, 1.3], [75, 1.5], [100, 1.6], [125, 1.7],
  [150, 1.8], [200, 1.9], [250, 2.0], [300, 2.1], [400, 2.2], [800, 2.5],
];

/** NSPF/industry Total Carbonate Alkalinity factor table (ppm → AF). */
export const LSI_ALKALINITY_TABLE: [number, number][] = [
  [25, 1.4], [50, 1.7], [75, 1.9], [100, 2.0], [125, 2.1],
  [150, 2.2], [200, 2.3], [250, 2.4], [300, 2.5], [400, 2.6], [800, 2.9],
];

/** Generic piecewise-linear table interpolator — shared by TF, CF and AF. */
export function interpolateTable(table: [number, number][], value: number): number {
  if (value <= table[0][0]) return table[0][1];
  if (value >= table[table.length - 1][0]) return table[table.length - 1][1];
  for (let i = 0; i < table.length - 1; i++) {
    const [v1, f1] = table[i];
    const [v2, f2] = table[i + 1];
    if (value >= v1 && value <= v2) {
      return f1 + ((value - v1) / (v2 - v1)) * (f2 - f1);
    }
  }
  return table[0][1];
}

/** Temperature Factor (TF). */
export const lsiTempFactor = (tempF: number): number => interpolateTable(LSI_TEMP_TABLE, tempF);
/** Calcium Hardness Factor (CF). NOT log₁₀(CH). */
export const lsiCalciumFactor = (chPpm: number): number => interpolateTable(LSI_CALCIUM_TABLE, chPpm);
/** Total Alkalinity Factor (AF). */
export const lsiAlkalinityFactor = (taPpm: number): number => interpolateTable(LSI_ALKALINITY_TABLE, taPpm);

export type PoolType = 'chlorine' | 'salt';

/** TDS constant: chlorine pools 12.1, salt pools 12.2 (higher dissolved solids). */
export const tdsConstant = (poolType: PoolType): number => (poolType === 'salt' ? 12.2 : 12.1);

// ─── Cyanuric-acid (CYA) correction ──────────────────────────────────────────
// A total-alkalinity titration also counts cyanurate, which contributes to the
// measured TA without being part of the carbonate balance the LSI cares about.
// So before computing the alkalinity factor we subtract the cyanurate share.
// How much of the CYA reads as alkalinity is pH-dependent: it's the fraction of
// cyanuric acid that's ionized at the sample pH (first dissociation, pKa₁≈6.88),
// scaled by the CaCO₃-equivalent weight ratio (50.04 / 129.07).
// Refs: Wojtowicz, J. Swimming Pool & Spa Chem.; TFP/PoolMath carbonate-alk model.

/** First acid-dissociation constant of cyanuric acid at 25 °C. */
export const CYA_PKA1 = 6.88;
/** ppm CYA → ppm CaCO₃ when fully ionized (equivalent-weight ratio). */
export const CYA_EQ_FACTOR = 50.04 / 129.07;

/** Cyanurate's contribution to a measured total-alkalinity reading, in ppm CaCO₃. */
export function cyanurateAlkalinity(cyaPpm: number, ph: number): number {
  if (cyaPpm <= 0) return 0;
  const ionizedFraction = 1 / (1 + Math.pow(10, CYA_PKA1 - ph));
  return cyaPpm * CYA_EQ_FACTOR * ionizedFraction;
}

export type LsiZone = 'corrosive' | 'slightlyCorrosive' | 'balanced' | 'slightlyScaling' | 'scaling';

export interface LsiResult {
  /** LSI value, rounded to 2 dp. */
  value: number;
  zone: LsiZone;
  label: string;
  /** Individual factor contributions, for the "show the math" breakdown. */
  factors: { ph: number; tf: number; cf: number; af: number; k: number };
  /** Carbonate alkalinity actually used (TA minus the cyanurate share), ppm. */
  carbonateTa: number;
  /** How much alkalinity the cyanuric acid accounted for, ppm. */
  cyanurateAlk: number;
}

export interface LsiInputs {
  ph: number;
  ta: number;       // total alkalinity, ppm
  ch: number;       // calcium hardness, ppm
  tempF: number;    // water temperature, °F
  poolType: PoolType;
  /** Optional cyanuric acid (stabilizer), ppm — corrects TA when > 0. */
  cya?: number;
}

const ZONE_LABEL: Record<LsiZone, string> = {
  corrosive: 'Corrosive',
  slightlyCorrosive: 'Slightly corrosive',
  balanced: 'Balanced',
  slightlyScaling: 'Slightly scaling',
  scaling: 'Scale-forming',
};

/** Classify a numeric LSI into its water-balance zone. */
export function lsiZone(value: number): LsiZone {
  if (value < -0.5) return 'corrosive';
  if (value < -0.3) return 'slightlyCorrosive';
  if (value <= 0.3) return 'balanced';
  if (value <= 0.5) return 'slightlyScaling';
  return 'scaling';
}

/** Compute the Langelier Saturation Index from raw water-test readings. */
export function computeLsi({ ph, ta, ch, tempF, poolType, cya = 0 }: LsiInputs): LsiResult {
  // Subtract the cyanurate share so the alkalinity factor uses carbonate alkalinity.
  const cyanurateAlk = cyanurateAlkalinity(cya, ph);
  const carbonateTa = Math.max(0, ta - cyanurateAlk);
  const tf = lsiTempFactor(tempF);
  const cf = lsiCalciumFactor(ch);
  const af = lsiAlkalinityFactor(carbonateTa);
  const k = tdsConstant(poolType);
  const raw = ph + tf + cf + af - k;
  const value = Math.round(raw * 100) / 100;
  const zone = lsiZone(value);
  return {
    value,
    zone,
    label: ZONE_LABEL[zone],
    factors: { ph, tf, cf, af, k },
    carbonateTa: Math.round(carbonateTa),
    cyanurateAlk: Math.round(cyanurateAlk),
  };
}

/** Format an LSI value with an explicit sign (+0.12 / −0.34 / 0.00). */
export function formatLsi(value: number): string {
  if (value === 0) return '0.00';
  const sign = value > 0 ? '+' : '−';
  return `${sign}${Math.abs(value).toFixed(2)}`;
}
