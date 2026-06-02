# Salt Calculator — Research & Build Spec

> For saltwater pools (salt-chlorine generators / SWG). Sibling to chlorine + CYA.

## Targets (SWG salt level)
- Ideal **~3,200 ppm**; acceptable **2,700–3,400 ppm**.
- Below ~2,700 → generator reduces/stops producing chlorine.
- Above ~3,400–4,000 → salty taste; some cells shut down on high salt.
- By brand: **Hayward AquaRite 3,200** · **Pentair IntelliChlor 3,400** · **Jandy AquaPure ~4,000** (range 3,000–6,000). Always defer to the unit's manual.

## Raising salt (add salt)
```
lbs salt = (target_ppm − current_ppm) × gallons × 8.34 ÷ 1,000,000
  (8.34 = weight of 1 US gallon of water in lb)
```
Validated: 0 → 3,200 ppm in 10,000 gal = **267 lb ≈ 6–7 × 40-lb bags**.
A 40-lb bag raises 10,000 gal by ~480 ppm.

- Use **pool-grade salt (≥99% NaCl)**, non-iodized, no anti-caking additives.
- Broadcast over the pool (not the skimmer), brush to dissolve, run the pump,
  wait ~24h before testing. Add in stages — salt only comes down by draining.

## Lowering salt (dilution only)
No chemical removes salt. Drain & refill:
```
drainFraction = 1 − (target / current);  gallonsToDrain = volume × drainFraction
```
Dilution also lowers CYA, alkalinity, calcium proportionally — re-test after.

## Build
- Engine `src/lib/salt.ts`: `saltToAddLbs`, `waterToDrainForSalt`, `SALT_SYSTEMS`
  presets, `formatSalt` (lb + 40-lb bags); reuse `toGallons` from chlorine.
- Page: Raise (system preset → target, or manual) + Lower (drain gallons/%);
  warnings (pool-grade salt, broadcast/brush/24h, below-2,700 / above-3,400),
  FAQ, HowTo/FAQ/Breadcrumb schema, share, My Pool (volume), RelatedTools.

## Sources
- [Swim University — Pool Salt Calculator](https://www.swimuniversity.com/how-much-pool-salt/) · [Omni — Pool Salt](https://www.omnicalculator.com/everyday-life/pool-salt) · [Pentair Salinity](https://www.pentair.com/en-us/pool-spa/education-support/homeowner-support/calculators/salinity-calculator.html)
- [Hayward — How much salt to add](https://www.hayward.com/blog/post/how-much-salt-do-you-add) · [Hayward — Lower salt](https://www.hayward.com/blog/post/how-to-lower-salt-levels-within-swimming-pool)
