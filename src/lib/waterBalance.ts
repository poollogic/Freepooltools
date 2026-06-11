/**
 * Water-balance dosing engine — pure functions. Covers the three adjustments the
 * other tools don't yet: lowering pH/alkalinity with acid, raising alkalinity
 * with baking soda, and raising calcium hardness with calcium chloride.
 *
 * ── Acid (lowering pH / TA) ───────────────────────────────────────────────
 * Acid lowers pH and total alkalinity together. Alkalinity falls linearly with
 * the acid added (1 equivalent of strong acid removes 1 equivalent of
 * alkalinity); pH is buffered and logarithmic, so we model the carbonate system
 * directly rather than with a flat rule:
 *
 *   Alk(eq/L) = CT·(α1 + 2·α2) + Kw/[H] − [H]
 *
 * where CT is total inorganic carbon and α1/α2 are the bicarbonate/carbonate
 * fractions (carbonic-acid constants pK1 6.35, pK2 10.33 at 25 °C). Given the
 * starting pH and TA we solve for CT, then the acid to reach a new pH is the
 * drop in alkalinity at constant CT — which also tells us the resulting TA.
 *
 * Calibration: lowering TA by 10 ppm in 10,000 gal needs 7.565 eq of acid →
 * 25.6 fl oz of 31.45% muriatic acid, matching the industry figure. Lowering pH
 * 8.0→7.5 at TA 100 in 10,000 gal works out to ≈12 fl oz, also as published.
 *
 * ── Baking soda (raising TA) / calcium chloride (raising CH) ──────────────
 * Both are linear in ppm. Sodium bicarbonate adds 1 eq alkalinity per mole;
 * 1.4 lb per 10,000 gal raises TA 10 ppm. Calcium chloride adds calcium (as
 * CaCO3); the dose depends on the product (anhydrous vs dihydrate flake).
 *
 * Sources: Taylor Technologies / PHTA water-chemistry references; carbonate
 * equilibrium constants (Stumm & Morgan, Aquatic Chemistry).
 */
import { toGallons, formatAmount, type Phase } from './chlorine';

// ── Constants ─────────────────────────────────────────────────────────────
const K1 = 10 ** -6.35; // carbonic acid, first dissociation (25 °C)
const K2 = 10 ** -10.33; // bicarbonate, second dissociation
const KW = 10 ** -14; // water
const EQ_CACO3_MG = 50043; // mg of CaCO3 per equivalent of alkalinity
const MW_CACO3 = 100.087; // g/mol
const L_PER_GAL = 3.78541;
const G_PER_OZ = 28.3495; // weight ounces
const ML_PER_FLOZ = 29.5735;
const MW_HCL = 36.46; // g/mol
const MW_NAHCO3 = 84.007; // sodium bicarbonate

/** Ideal operating ranges (PHTA / Taylor). */
export const IDEAL = {
  ph: { low: 7.4, high: 7.6, mid: 7.5 },
  ta: { low: 80, high: 120, mid: 100 },
  ch: { low: 200, high: 400, mid: 300 },
};

// ── Carbonate system ──────────────────────────────────────────────────────
/** Bicarbonate (α1) and carbonate (α2) fractions of total carbonate at [H+]. */
const fractions = (H: number) => {
  const a1 = 1 / (H / K1 + 1 + K2 / H);
  const a2 = 1 / ((H * H) / (K1 * K2) + H / K2 + 1);
  return { a1, a2 };
};

/** Total alkalinity (eq/L) for a given total carbonate CT and [H+]. */
const alkalinity = (ct: number, H: number) => {
  const { a1, a2 } = fractions(H);
  return ct * (a1 + 2 * a2) + KW / H - H;
};

/** Total carbonate CT implied by a (pH, total alkalinity) pair. */
const totalCarbonate = (phNow: number, taPpm: number) => {
  const alk0 = Math.max(0, taPpm) / EQ_CACO3_MG; // eq/L
  const H0 = 10 ** -phNow;
  const { a1, a2 } = fractions(H0);
  return { ct: (alk0 - KW / H0 + H0) / (a1 + 2 * a2), alk0 };
};

/**
 * Equivalents/L of strong acid to move pH down from `phNow` to `phTarget` in
 * water buffered at `taPpm` total alkalinity, plus the alkalinity that remains.
 */
const acidEqToLowerPh = (phNow: number, phTarget: number, taPpm: number) => {
  const { ct, alk0 } = totalCarbonate(phNow, taPpm);
  const alk1 = alkalinity(ct, 10 ** -phTarget);
  return { eqPerL: Math.max(0, alk0 - alk1), taAfter: Math.max(0, alk1 * EQ_CACO3_MG) };
};

/**
 * The pH you land on after lowering total alkalinity from `taNow` to `taTarget`
 * with acid, starting at `phNow`. Acid removes alkalinity at constant total
 * carbonate, so we solve alkalinity(CT, H) = target for the new pH. This is why
 * a big alkalinity drop can pull pH below the safe range — the caller warns when
 * it does. Returns 0 if it can't be determined.
 */
export const phAfterLoweringTa = (phNow: number, taNow: number, taTarget: number): number => {
  if (phNow <= 0 || taNow <= 0 || taTarget >= taNow) return phNow;
  const { ct } = totalCarbonate(phNow, taNow);
  const alkTarget = taTarget / EQ_CACO3_MG;
  // Alkalinity decreases monotonically with pH, so bisect for the matching pH.
  let lo = 2,
    hi = phNow;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    if (alkalinity(ct, 10 ** -mid) > alkTarget) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
};

// ── Acid products ─────────────────────────────────────────────────────────
export interface AcidProduct {
  id: string;
  label: string;
  short: string;
  phase: Phase;
  /** grams of product per equivalent of acid delivered. */
  gramsPerEq: number;
  /** Liquid only — solution density (g/mL) for the volume conversion. */
  density?: number;
  note: string;
}

export const ACID_PRODUCTS: AcidProduct[] = [
  {
    id: 'muriatic-31',
    label: 'Muriatic acid (31.45% / 20° Baumé)',
    short: 'muriatic acid',
    phase: 'liquid',
    gramsPerEq: MW_HCL / 0.3145,
    density: 1.16,
    note: 'Standard full-strength muriatic acid. Always add it to the water (never water to acid), pour slowly over a return with the pump running, and keep it off your skin and out of your lungs.',
  },
  {
    id: 'muriatic-145',
    label: 'Low-fume muriatic acid (14.5%)',
    short: 'low-fume muriatic acid',
    phase: 'liquid',
    gramsPerEq: MW_HCL / 0.145,
    density: 1.074,
    note: 'A gentler, lower-fuming dilution — you’ll need a bit over twice as much as full-strength acid for the same effect.',
  },
  {
    id: 'dry-acid',
    label: 'Dry acid (sodium bisulfate)',
    short: 'dry acid',
    phase: 'solid',
    gramsPerEq: 120.06 / 0.932, // sodium bisulfate, ~93% purity
    note: 'Granular pH/alkalinity reducer — easier and safer to handle than liquid acid, though pricier per dose. Pre-dissolve or broadcast over the deep end with the pump running.',
  },
];

export const getAcid = (id: string) => ACID_PRODUCTS.find((p) => p.id === id) ?? ACID_PRODUCTS[0];

/** Convert equivalents of acid to a friendly amount of the chosen product. */
const acidOunces = (product: AcidProduct, totalEq: number): number => {
  if (totalEq <= 0) return 0;
  const grams = totalEq * product.gramsPerEq;
  if (product.phase === 'liquid' && product.density) {
    return grams / product.density / ML_PER_FLOZ; // fluid ounces
  }
  return grams / G_PER_OZ; // weight ounces
};

export interface AcidResult {
  ounces: number;
  phase: Phase;
  /** Resulting TA after the dose (pH mode only). */
  taAfter: number;
  /** Resulting pH after the dose (TA mode only; 0 if not computed). */
  phAfter: number;
}

/** Acid to lower pH from `phNow` to `phTarget` (TA acts as the buffer). */
export const acidToLowerPh = (
  gallons: number,
  phNow: number,
  phTarget: number,
  taPpm: number,
  product: AcidProduct,
): AcidResult => {
  if (gallons <= 0 || phTarget >= phNow || phNow <= 0) {
    return { ounces: 0, phase: product.phase, taAfter: taPpm, phAfter: phTarget };
  }
  const { eqPerL, taAfter } = acidEqToLowerPh(phNow, phTarget, taPpm);
  const totalEq = eqPerL * gallons * L_PER_GAL;
  return { ounces: acidOunces(product, totalEq), phase: product.phase, taAfter, phAfter: phTarget };
};

/**
 * Acid to lower total alkalinity from `taNow` to `taTarget` (linear in acid).
 * Also reports the pH it lands on — acid drops pH alongside alkalinity, so a
 * large reduction can sink pH below the safe range (the page warns when it does).
 */
export const acidToLowerTa = (
  gallons: number,
  taNow: number,
  taTarget: number,
  product: AcidProduct,
  phNow: number,
): AcidResult => {
  if (gallons <= 0 || taTarget >= taNow) {
    return { ounces: 0, phase: product.phase, taAfter: taNow, phAfter: phNow };
  }
  const eqPerL = (taNow - taTarget) / EQ_CACO3_MG;
  const totalEq = eqPerL * gallons * L_PER_GAL;
  return {
    ounces: acidOunces(product, totalEq),
    phase: product.phase,
    taAfter: taTarget,
    phAfter: phNow > 0 ? phAfterLoweringTa(phNow, taNow, taTarget) : 0,
  };
};

// ── Baking soda (raise TA) ────────────────────────────────────────────────
/** Weight ounces of sodium bicarbonate to raise TA from current → target ppm. */
export const bakingSodaOz = (gallons: number, taNow: number, taTarget: number): number => {
  if (gallons <= 0 || taTarget <= taNow) return 0;
  const eq = ((taTarget - taNow) / EQ_CACO3_MG) * gallons * L_PER_GAL; // = moles NaHCO3
  return (eq * MW_NAHCO3) / G_PER_OZ;
};

// ── Calcium chloride (raise CH) ───────────────────────────────────────────
export interface CalciumProduct {
  id: string;
  label: string;
  short: string;
  /** grams of product per mole of calcium delivered. */
  gramsPerMolCa: number;
  note: string;
}

export const CALCIUM_PRODUCTS: CalciumProduct[] = [
  {
    id: 'dihydrate',
    label: 'Calcium chloride flake (dihydrate, ~77%)',
    short: 'calcium chloride flake',
    gramsPerMolCa: 147.01, // CaCl2·2H2O
    note: 'The common white “calcium hardness increaser” flake. Pre-dissolve in a bucket — it gets hot and can cloud the water if dumped in dry.',
  },
  {
    id: 'anhydrous',
    label: 'Calcium chloride, anhydrous (100%)',
    short: 'anhydrous calcium chloride',
    gramsPerMolCa: 110.98, // CaCl2
    note: 'Pure anhydrous calcium chloride (e.g. road/ice-melt pellets, 100%). More concentrated, so you need less — but it releases even more heat when dissolving.',
  },
];

export const getCalcium = (id: string) => CALCIUM_PRODUCTS.find((p) => p.id === id) ?? CALCIUM_PRODUCTS[0];

/** Weight ounces of calcium chloride to raise CH from current → target ppm. */
export const calciumOz = (
  gallons: number,
  chNow: number,
  chTarget: number,
  product: CalciumProduct,
): number => {
  if (gallons <= 0 || chTarget <= chNow) return 0;
  const molCa = (((chTarget - chNow) / 1000) * gallons * L_PER_GAL) / MW_CACO3; // mg→g via /1000
  return (molCa * product.gramsPerMolCa) / G_PER_OZ;
};

export { toGallons, formatAmount };
export type { Phase };
