/**
 * Pool pump runtime engine — pure functions.
 *
 * The governing idea is *turnover*: circulating the whole pool through the
 * filter at least once a day. Turnover time is just volume ÷ flow rate:
 *
 *   turnover hours = gallons ÷ (GPM × 60)
 *   runtime/day   = turnover hours × turnovers per day
 *
 * Residential rule of thumb is one turnover per day (often rounded up to ~8 h
 * in swim season); heavy use, heat, or algae call for more. Cost layers on the
 * pump's wattage and the local electricity rate.
 *
 * Sources: APSP/PHTA circulation guidance; U.S. DOE pump-energy guidance.
 */
import { toGallons } from './chlorine';

export { toGallons };

export const MIN_PER_HOUR = 60;

/** Hours to circulate the entire pool once (one turnover). */
export const turnoverHours = (gallons: number, gpm: number): number =>
  gallons > 0 && gpm > 0 ? gallons / (gpm * MIN_PER_HOUR) : 0;

/** Recommended pump runtime (hours/day) for `turnovers` full turnovers. */
export const runtimeHours = (gallons: number, gpm: number, turnovers: number): number =>
  turnoverHours(gallons, gpm) * turnovers;

export interface PumpCost {
  kwhDay: number;
  costDay: number;
  costMonth: number;
  costSeason: number;
}

/** Electricity used and cost for a given daily runtime. Season ≈ 5 months. */
export function pumpCost(hoursPerDay: number, watts: number, pricePerKwh: number): PumpCost {
  const kwhDay = (watts / 1000) * Math.max(0, hoursPerDay);
  const costDay = kwhDay * pricePerKwh;
  return { kwhDay, costDay, costMonth: costDay * 30, costSeason: costDay * 152 };
}

export interface PumpPreset {
  id: string;
  label: string;
  /** Rough flow at typical residential head, GPM. */
  gpm: number;
  /** Typical running wattage at that flow. */
  watts: number;
}

/**
 * Rough pump-size presets to help users who don't know their GPM. Flow varies
 * a lot with plumbing and head, so these are ballparks the user can override.
 */
export const PUMP_PRESETS: PumpPreset[] = [
  { id: 'custom', label: 'Enter my own', gpm: 0, watts: 0 },
  { id: 'vs-low', label: 'Variable-speed, low (~35 GPM)', gpm: 35, watts: 300 },
  { id: 'vs-med', label: 'Variable-speed, medium (~55 GPM)', gpm: 55, watts: 750 },
  { id: '075', label: '¾ HP single-speed (~45 GPM)', gpm: 45, watts: 1300 },
  { id: '1', label: '1 HP single-speed (~60 GPM)', gpm: 60, watts: 1500 },
  { id: '15', label: '1.5 HP single-speed (~75 GPM)', gpm: 75, watts: 1900 },
  { id: '2', label: '2 HP single-speed (~90 GPM)', gpm: 90, watts: 2400 },
];

export const getPumpPreset = (id: string): PumpPreset => PUMP_PRESETS.find((p) => p.id === id) ?? PUMP_PRESETS[0];

// ── Variable-speed pumps (affinity laws) ──────────────────────────────
// A VS pump's performance scales with motor speed by the pump affinity laws:
//   flow  ∝ speed        (Q ∝ N)
//   head  ∝ speed²       (H ∝ N²)
//   power ∝ speed³       (P ∝ N³)
// Given a pump's rating at full speed, derive flow and power at any RPM. The
// cubic power law is why slowing a VS pump saves so much: for a fixed turnover,
// energy ends up scaling with speed² (you run longer, but at far less power).

/** Flow (GPM) at `rpm`, scaled from the pump's flow at `maxRpm`. */
export const vsFlowAtRpm = (maxGpm: number, maxRpm: number, rpm: number): number =>
  maxRpm > 0 ? maxGpm * (rpm / maxRpm) : 0;

/** Power (watts) at `rpm`, scaled by the cube of the speed ratio. */
export const vsWattsAtRpm = (maxWatts: number, maxRpm: number, rpm: number): number =>
  maxRpm > 0 ? maxWatts * (rpm / maxRpm) ** 3 : 0;

export interface VsPumpPreset {
  id: string;
  label: string;
  /** Manufacturer max speed (most residential VS pumps top out ~3450 RPM). */
  maxRpm: number;
  /** Flow at full speed, GPM (at typical residential head). */
  maxGpm: number;
  /** Power draw at full speed, watts. */
  maxWatts: number;
}

/**
 * Rough variable-speed pump presets (specs at FULL speed, typical head). Real
 * flow/power depend on plumbing + head — users should use their pump curve or
 * the wattage on the pump's own display. Floor speeds are usually ~600–1000 RPM.
 */
export const VS_PUMP_PRESETS: VsPumpPreset[] = [
  { id: 'custom', label: 'Enter my own', maxRpm: 3450, maxGpm: 0, maxWatts: 0 },
  { id: 'vs-sm', label: 'Small VS (~1.5 HP)', maxRpm: 3450, maxGpm: 70, maxWatts: 1700 },
  { id: 'vs-md', label: 'Medium VS (~2.0–2.7 HP)', maxRpm: 3450, maxGpm: 90, maxWatts: 2300 },
  { id: 'vs-lg', label: 'Large VS (~3 HP)', maxRpm: 3450, maxGpm: 110, maxWatts: 2900 },
];

export const getVsPreset = (id: string): VsPumpPreset =>
  VS_PUMP_PRESETS.find((p) => p.id === id) ?? VS_PUMP_PRESETS[0];

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
export const formatUSD = (n: number): string => USD.format(Number.isFinite(n) ? n : 0);

/** Decimal hours → "5 hr 34 min" (or "—" when zero/invalid). */
export function formatHoursMinutes(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '—';
  const whole = Math.floor(hours);
  const mins = Math.round((hours - whole) * 60);
  if (whole === 0) return `${mins} min`;
  if (mins === 0) return `${whole} hr${whole > 1 ? 's' : ''}`;
  return `${whole} hr${whole > 1 ? 's' : ''} ${mins} min`;
}

// ── Pump energy + variable-speed upgrade savings ──────────────────────
// Drives the Variable-Speed Pump Savings Calculator: how much a single-speed
// pump costs to run, and how much a modern VS pump moving the SAME water saves.

/** EPA U.S. average grid emissions — pounds of CO₂ per kWh of electricity. */
export const US_LB_CO2_PER_KWH = 0.85;

export interface EnergyUse {
  /** Water moved per day, gallons (flow × 60 × hours). */
  gallonsPerDay: number;
  kwhDay: number;
  costDay: number;
  costMonth: number;
  costYear: number;
}

/** Energy + cost for a pump moving water `hoursPerDay` at `gpm` / `watts`. */
export function pumpEnergy(
  gpm: number,
  watts: number,
  hoursPerDay: number,
  pricePerKwh: number,
): EnergyUse {
  const h = Math.max(0, hoursPerDay);
  const kwhDay = (Math.max(0, watts) / 1000) * h;
  const costDay = kwhDay * Math.max(0, pricePerKwh);
  return {
    gallonsPerDay: Math.max(0, gpm) * MIN_PER_HOUR * h,
    kwhDay,
    costDay,
    costMonth: costDay * 30,
    costYear: costDay * 365,
  };
}

export interface VsReplacement {
  /** Running speed as a fraction of full speed (0–1). */
  speedRatio: number;
  rpm: number;
  gpm: number;
  watts: number;
  /** Real hours/day to move the same daily gallons at this speed. */
  hoursPerDay: number;
  /** True if even full speed can't move the day's water in the target window. */
  tooSmall: boolean;
  energy: EnergyUse;
}

/**
 * Model a modern variable-speed pump moving the SAME daily gallons as the
 * current pump. The user picks a target run window; we solve for the speed that
 * fits it, clamp that to the pump's usable RPM range, then report the true hours
 * and energy at that speed. Because flow scales with speed and power with its
 * cube, the energy to move a fixed volume scales with speed² — running slower
 * for longer is the whole savings story.
 */
export function compareVsReplacement(
  gallonsPerDay: number,
  targetHours: number,
  vs: { maxGpm: number; maxWatts: number; maxRpm: number; minRpm: number },
  pricePerKwh: number,
): VsReplacement {
  const maxGpm = Math.max(0, vs.maxGpm);
  const empty: VsReplacement = {
    speedRatio: 0, rpm: 0, gpm: 0, watts: 0, hoursPerDay: 0, tooSmall: false,
    energy: pumpEnergy(0, 0, 0, pricePerKwh),
  };
  if (maxGpm <= 0 || gallonsPerDay <= 0 || targetHours <= 0) return empty;

  const sFloor = vs.maxRpm > 0 ? Math.min(1, vs.minRpm / vs.maxRpm) : 0.2;
  // Speed that would move the day's water in exactly the target window.
  const sRaw = gallonsPerDay / (maxGpm * MIN_PER_HOUR * targetHours);
  const s = Math.min(1, Math.max(sFloor, sRaw));
  const gpm = maxGpm * s;
  const watts = Math.max(0, vs.maxWatts) * s ** 3;
  const hoursPerDay = gpm > 0 ? gallonsPerDay / (gpm * MIN_PER_HOUR) : 0;
  return {
    speedRatio: s,
    rpm: Math.round(vs.maxRpm * s),
    gpm,
    watts,
    hoursPerDay,
    tooSmall: sRaw > 1, // needed more than full speed to hit the target window
    energy: pumpEnergy(gpm, watts, hoursPerDay, pricePerKwh),
  };
}
