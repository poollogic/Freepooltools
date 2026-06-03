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
