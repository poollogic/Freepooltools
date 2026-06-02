/**
 * Pool heating engine — pure functions.
 *
 * Physics of heating water: 1 BTU raises 1 lb of water by 1 °F, and 1 US gallon
 * weighs 8.34 lb. So the energy to warm a pool is:
 *
 *   BTU = gallons × 8.34 × ΔT(°F)
 *
 * That's the *net* energy delivered to the water. What it costs depends on how
 * efficiently the heater turns fuel into delivered heat:
 *   • Combustion (gas / propane): fuel = BTU ÷ thermal-efficiency ÷ BTU-per-unit.
 *   • Heat pump: it moves heat rather than making it, so electrical energy is
 *     BTU ÷ COP ÷ BTU-per-kWh (a COP of 5 ≈ 500% "efficiency").
 *
 * This models the one-time heat-up. Holding a temperature costs more over time
 * (ongoing evaporation/convection losses) — surfaced as guidance in the UI.
 *
 * Sources: U.S. DOE pool-heating guidance; ASHRAE water specific heat.
 */
import { toGallons } from './chlorine';

export { toGallons };

/** Weight of 1 US gallon of water, lb. */
export const LB_PER_GAL = 8.34;
/** 1 therm of natural gas = 100,000 BTU. */
export const BTU_PER_THERM = 100_000;
/** 1 US gallon of propane ≈ 91,500 BTU. */
export const BTU_PER_GAL_PROPANE = 91_500;
/** 1 kWh of electricity = 3,412 BTU. */
export const BTU_PER_KWH = 3412;

export type HeaterType = 'gas' | 'propane' | 'heatpump';

export interface HeaterSpec {
  id: HeaterType;
  label: string;
  /** What you pay for: 'therm' | 'gal' | 'kWh'. */
  priceUnit: string;
  /** Default fuel price in $/unit (US-typical; user-editable). */
  defaultPrice: number;
  /** Combustion thermal efficiency (gas/propane) OR coefficient of performance (heat pump). */
  defaultPerf: number;
  /** True when `defaultPerf` is a COP (heat pump) rather than an efficiency fraction. */
  isCop: boolean;
  /** Energy per fuel unit, BTU. For heat pumps this is BTU per kWh. */
  btuPerUnit: number;
  /** Typical rated size, BTU/hr — input rating for combustion, output for heat pumps. */
  defaultBtuHr: number;
}

export const HEATERS: HeaterSpec[] = [
  { id: 'gas', label: 'Natural gas', priceUnit: 'therm', defaultPrice: 1.5, defaultPerf: 0.84, isCop: false, btuPerUnit: BTU_PER_THERM, defaultBtuHr: 250_000 },
  { id: 'propane', label: 'Propane', priceUnit: 'gal', defaultPrice: 3.0, defaultPerf: 0.84, isCop: false, btuPerUnit: BTU_PER_GAL_PROPANE, defaultBtuHr: 250_000 },
  { id: 'heatpump', label: 'Electric heat pump', priceUnit: 'kWh', defaultPrice: 0.17, defaultPerf: 5.5, isCop: true, btuPerUnit: BTU_PER_KWH, defaultBtuHr: 110_000 },
];

export const getHeater = (id: string): HeaterSpec => HEATERS.find((h) => h.id === id) ?? HEATERS[0];

/** Net BTU to raise `gallons` by `deltaF` °F (delivered to the water; no losses). */
export const btuToHeat = (gallons: number, deltaF: number): number =>
  gallons <= 0 || deltaF <= 0 ? 0 : gallons * LB_PER_GAL * deltaF;

export interface HeatingEstimate {
  /** Net energy delivered to the water, BTU. */
  btu: number;
  /** Fuel consumed: therms, gallons of propane, or kWh. */
  units: number;
  /** Cost of that fuel, USD. */
  cost: number;
  /** Hours to heat up at the rated heater size. */
  hours: number;
}

/** Estimate the cost, fuel, and time to heat a pool from current → target. */
export function estimateHeating(opts: {
  gallons: number;
  deltaF: number;
  spec: HeaterSpec;
  price: number;
  perf: number;
  btuHr: number;
}): HeatingEstimate {
  const { gallons, deltaF, spec, price, perf, btuHr } = opts;
  const btu = btuToHeat(gallons, deltaF);
  let units: number;
  let hours: number;
  if (spec.isCop) {
    // Heat pump: electrical kWh = heat ÷ COP ÷ BTU-per-kWh; rated by output heat.
    units = perf > 0 ? btu / perf / BTU_PER_KWH : 0;
    hours = btuHr > 0 ? btu / btuHr : 0;
  } else {
    // Combustion: fuel units = heat ÷ efficiency ÷ BTU-per-unit; rated by input,
    // so delivered output per hour = rated input × efficiency.
    units = perf > 0 ? btu / perf / spec.btuPerUnit : 0;
    hours = btuHr > 0 ? btu / (btuHr * perf) : 0;
  }
  return { btu, units, cost: units * price, hours };
}

/** Same heat-up across every heater type at its default rate — for the comparison row. */
export const compareHeaters = (gallons: number, deltaF: number): { spec: HeaterSpec; est: HeatingEstimate }[] =>
  HEATERS.map((spec) => ({
    spec,
    est: estimateHeating({ gallons, deltaF, spec, price: spec.defaultPrice, perf: spec.defaultPerf, btuHr: spec.defaultBtuHr }),
  }));

const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
export const formatUSD = (n: number): string => USD.format(Number.isFinite(n) ? n : 0);

/** Human time: "11.9 hrs" or "1 day 4 hrs" for long heat-ups. */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '—';
  if (hours < 24) return `${hours.toFixed(1)} hr${hours >= 2 ? 's' : ''}`;
  const days = Math.floor(hours / 24);
  const rem = Math.round(hours - days * 24);
  return rem > 0 ? `${days} day${days > 1 ? 's' : ''} ${rem} hr` : `${days} day${days > 1 ? 's' : ''}`;
}
