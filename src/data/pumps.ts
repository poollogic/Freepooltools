/**
 * Pool-pump reference database for the Variable-Speed Pump Savings Calculator.
 *
 * Two lists:
 *  - CURRENT_PUMPS: the single- and two-speed pumps people are likely to be
 *    *replacing* — common residential models sold over roughly the last decade.
 *  - MODERN_VS_PUMPS: today's variable-speed pumps we compare against.
 *
 * Numbers are TYPICAL operating figures at a representative residential head
 * (~45–50 ft of total dynamic head). Real flow and watts vary with plumbing,
 * filter condition, and head, so the calculator lets users override them. We use
 * input (wall) watts, which is what shows up on the electric bill — derived from
 * each motor's rated horsepower, service factor, and typical efficiency, and
 * cross-checked against manufacturer spec sheets.
 *
 * Sources: manufacturer spec sheets (Pentair, Hayward, Sta-Rite, Jandy,
 * Waterway) and the California Energy Commission appliance database; U.S. DOE
 * pool-pump energy guidance for the savings model.
 */

export type PumpType = 'single' | 'two';

export interface PumpModel {
  /** Stable id used in the shareable URL. */
  id: string;
  brand: string;
  /** Model name including horsepower, e.g. "Super Pump 1.5 HP". */
  label: string;
  type: PumpType;
  /** Typical flow at ~45–50 ft head, GPM (high speed for two-speed). */
  gpm: number;
  /** Typical input/running power, watts (high speed for two-speed). */
  watts: number;
}

/** Special id for "I don't know — enter my own specs". */
export const CUSTOM_PUMP_ID = 'custom';

/**
 * Single- and two-speed residential pumps, grouped by brand. Brand order here is
 * the order the <optgroup>s appear in. These are the upgrade candidates — older
 * energy-hungry pumps people are deciding whether to replace.
 */
export const CURRENT_PUMPS: PumpModel[] = [
  // ── Pentair ──
  { id: 'pentair-superflo-075', brand: 'Pentair', label: 'SuperFlo 0.75 HP', type: 'single', gpm: 50, watts: 1300 },
  { id: 'pentair-superflo-1', brand: 'Pentair', label: 'SuperFlo 1.0 HP', type: 'single', gpm: 60, watts: 1600 },
  { id: 'pentair-superflo-15', brand: 'Pentair', label: 'SuperFlo 1.5 HP', type: 'single', gpm: 75, watts: 2000 },
  { id: 'pentair-superflo-2', brand: 'Pentair', label: 'SuperFlo 2.0 HP', type: 'single', gpm: 85, watts: 2500 },
  { id: 'pentair-superflo-15-2sp', brand: 'Pentair', label: 'SuperFlo 1.5 HP (two-speed)', type: 'two', gpm: 75, watts: 2000 },
  { id: 'pentair-whisperflo-1', brand: 'Pentair', label: 'WhisperFlo 1.0 HP', type: 'single', gpm: 65, watts: 1800 },
  { id: 'pentair-whisperflo-15', brand: 'Pentair', label: 'WhisperFlo 1.5 HP', type: 'single', gpm: 80, watts: 2100 },
  { id: 'pentair-whisperflo-2', brand: 'Pentair', label: 'WhisperFlo 2.0 HP', type: 'single', gpm: 90, watts: 2550 },
  { id: 'pentair-dynamo-1', brand: 'Pentair', label: 'Dynamo 1.0 HP (above-ground)', type: 'single', gpm: 55, watts: 1500 },
  { id: 'pentair-dynamo-15', brand: 'Pentair', label: 'Dynamo 1.5 HP (above-ground)', type: 'single', gpm: 65, watts: 1800 },

  // ── Hayward ──
  { id: 'hayward-superpump-075', brand: 'Hayward', label: 'Super Pump 0.75 HP', type: 'single', gpm: 50, watts: 1300 },
  { id: 'hayward-superpump-1', brand: 'Hayward', label: 'Super Pump 1.0 HP', type: 'single', gpm: 60, watts: 1600 },
  { id: 'hayward-superpump-15', brand: 'Hayward', label: 'Super Pump 1.5 HP', type: 'single', gpm: 75, watts: 2000 },
  { id: 'hayward-superpump-2', brand: 'Hayward', label: 'Super Pump 2.0 HP', type: 'single', gpm: 85, watts: 2480 },
  { id: 'hayward-superpump-15-2sp', brand: 'Hayward', label: 'Super Pump 1.5 HP (two-speed)', type: 'two', gpm: 75, watts: 2000 },
  { id: 'hayward-super2-15', brand: 'Hayward', label: 'Super II 1.5 HP', type: 'single', gpm: 80, watts: 2050 },
  { id: 'hayward-super2-2', brand: 'Hayward', label: 'Super II 2.0 HP', type: 'single', gpm: 90, watts: 2520 },
  { id: 'hayward-super2-25', brand: 'Hayward', label: 'Super II 2.5 HP', type: 'single', gpm: 95, watts: 2900 },
  { id: 'hayward-maxflo-1', brand: 'Hayward', label: 'MaxFlo 1.0 HP', type: 'single', gpm: 55, watts: 1500 },
  { id: 'hayward-maxflo-15', brand: 'Hayward', label: 'MaxFlo 1.5 HP', type: 'single', gpm: 70, watts: 1900 },
  { id: 'hayward-tristar-15', brand: 'Hayward', label: 'TriStar 1.5 HP', type: 'single', gpm: 80, watts: 2050 },
  { id: 'hayward-tristar-2', brand: 'Hayward', label: 'TriStar 2.0 HP', type: 'single', gpm: 90, watts: 2500 },
  { id: 'hayward-powerflo-15', brand: 'Hayward', label: 'PowerFlo Matrix 1.5 HP (above-ground)', type: 'single', gpm: 55, watts: 1500 },

  // ── Sta-Rite ──
  { id: 'starite-maxepro-1', brand: 'Sta-Rite', label: 'Max-E-Pro 1.0 HP', type: 'single', gpm: 60, watts: 1600 },
  { id: 'starite-maxepro-15', brand: 'Sta-Rite', label: 'Max-E-Pro 1.5 HP', type: 'single', gpm: 75, watts: 2000 },
  { id: 'starite-maxepro-2', brand: 'Sta-Rite', label: 'Max-E-Pro 2.0 HP', type: 'single', gpm: 85, watts: 2450 },
  { id: 'starite-duraglas-15', brand: 'Sta-Rite', label: 'Dura-Glas 1.5 HP', type: 'single', gpm: 78, watts: 2050 },
  { id: 'starite-supermax-1', brand: 'Sta-Rite', label: 'SuperMax 1.0 HP', type: 'single', gpm: 58, watts: 1550 },
  { id: 'starite-supermax-15', brand: 'Sta-Rite', label: 'SuperMax 1.5 HP', type: 'single', gpm: 72, watts: 1950 },

  // ── Jandy ──
  { id: 'jandy-flopro-1', brand: 'Jandy', label: 'FloPro 1.0 HP', type: 'single', gpm: 60, watts: 1600 },
  { id: 'jandy-flopro-15', brand: 'Jandy', label: 'FloPro 1.5 HP', type: 'single', gpm: 75, watts: 2000 },
  { id: 'jandy-stealth-15', brand: 'Jandy', label: 'Stealth 1.5 HP', type: 'single', gpm: 78, watts: 2050 },
  { id: 'jandy-stealth-2', brand: 'Jandy', label: 'Stealth 2.0 HP', type: 'single', gpm: 88, watts: 2500 },

  // ── Waterway ──
  { id: 'waterway-svl56-1', brand: 'Waterway', label: 'SVL56 1.0 HP', type: 'single', gpm: 58, watts: 1550 },
  { id: 'waterway-svl56-15', brand: 'Waterway', label: 'SVL56 1.5 HP', type: 'single', gpm: 72, watts: 1950 },
  { id: 'waterway-champion-2', brand: 'Waterway', label: 'Champion 2.0 HP', type: 'single', gpm: 88, watts: 2500 },

  // ── Above-ground / budget ──
  { id: 'intex-sx3000', brand: 'Above-ground', label: 'Intex SX3000 sand-filter pump', type: 'single', gpm: 40, watts: 1000 },
  { id: 'generic-ag-1', brand: 'Above-ground', label: 'Generic above-ground 1.0 HP', type: 'single', gpm: 50, watts: 1400 },

  // ── Generic by horsepower (don't see your model) ──
  { id: 'generic-075', brand: 'Generic (by HP)', label: 'Generic single-speed 0.75 HP', type: 'single', gpm: 50, watts: 1300 },
  { id: 'generic-1', brand: 'Generic (by HP)', label: 'Generic single-speed 1.0 HP', type: 'single', gpm: 60, watts: 1600 },
  { id: 'generic-15', brand: 'Generic (by HP)', label: 'Generic single-speed 1.5 HP', type: 'single', gpm: 75, watts: 2000 },
  { id: 'generic-2', brand: 'Generic (by HP)', label: 'Generic single-speed 2.0 HP', type: 'single', gpm: 85, watts: 2500 },
];

export interface VsPumpModel {
  id: string;
  label: string;
  /** Flow at full speed, GPM (~45–50 ft head). */
  maxGpm: number;
  /** Input power at full speed, watts. */
  maxWatts: number;
  /** Manufacturer max speed (most residential VS pumps top out ~3450 RPM). */
  maxRpm: number;
  /** Lowest practical speed for circulation/skimming. */
  minRpm: number;
}

/**
 * Current variable-speed pumps to compare against. The savings come from running
 * these at low RPM — flow scales with speed, power with the cube of speed — so
 * what matters most is each pump's efficiency (watts per GPM), which the affinity
 * laws then scale down. Default replacement is a mainstream mid-range model.
 */
export const MODERN_VS_PUMPS: VsPumpModel[] = [
  { id: 'pentair-superflo-vs', label: 'Pentair SuperFlo VS (1.5 HP)', maxGpm: 80, maxWatts: 1900, maxRpm: 3450, minRpm: 1100 },
  { id: 'pentair-intelliflo3-15', label: 'Pentair IntelliFlo3 VSF (1.5 HP)', maxGpm: 110, maxWatts: 2400, maxRpm: 3450, minRpm: 600 },
  { id: 'pentair-intelliflo3-3', label: 'Pentair IntelliFlo3 VSF (3 HP)', maxGpm: 130, maxWatts: 3110, maxRpm: 3450, minRpm: 600 },
  { id: 'hayward-superpump-vs', label: 'Hayward Super Pump VS (1.65 HP)', maxGpm: 80, maxWatts: 1800, maxRpm: 3450, minRpm: 600 },
  { id: 'hayward-maxflo-vs', label: 'Hayward MaxFlo VS (1.65 HP)', maxGpm: 75, maxWatts: 1700, maxRpm: 3450, minRpm: 600 },
  { id: 'hayward-tristar-vs950', label: 'Hayward TriStar VS 950 (2.7 HP)', maxGpm: 110, maxWatts: 2400, maxRpm: 3450, minRpm: 600 },
  { id: 'jandy-vsflopro', label: 'Jandy VS FloPro (1.85 HP)', maxGpm: 95, maxWatts: 2100, maxRpm: 3450, minRpm: 600 },
  { id: 'starite-intellipro3', label: 'Sta-Rite IntelliPro3 VSF (3 HP)', maxGpm: 130, maxWatts: 3110, maxRpm: 3450, minRpm: 600 },
  { id: 'generic-vs', label: 'Generic modern variable-speed pump', maxGpm: 100, maxWatts: 2300, maxRpm: 3450, minRpm: 800 },
];

export const DEFAULT_PUMP_ID = 'hayward-superpump-15';
export const DEFAULT_VS_ID = 'pentair-superflo-vs';

export const getPump = (id: string): PumpModel | undefined => CURRENT_PUMPS.find((p) => p.id === id);
export const getVsPump = (id: string): VsPumpModel =>
  MODERN_VS_PUMPS.find((p) => p.id === id) ?? MODERN_VS_PUMPS[0];

/** Brands in first-seen order, each with its pumps — for grouped <optgroup>s. */
export const PUMP_GROUPS: { brand: string; pumps: PumpModel[] }[] = CURRENT_PUMPS.reduce(
  (groups, pump) => {
    const group = groups.find((g) => g.brand === pump.brand);
    if (group) group.pumps.push(pump);
    else groups.push({ brand: pump.brand, pumps: [pump] });
    return groups;
  },
  [] as { brand: string; pumps: PumpModel[] }[],
);
