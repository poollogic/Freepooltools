# CYA / Stabilizer Calculator — Research & Build Spec

> Sibling to the chlorine calculator. See chlorine-calculator-research.md for the
> CYA *necessity* evidence (UV protection, over-stabilization). This doc covers
> the **dosing** math for raising and lowering cyanuric acid.

## 1. Targets
- **Chlorine / tablet pools:** 30–50 ppm CYA (PHTA ideal 30–50).
- **Saltwater (SWG) pools:** 60–80 ppm (lower chlorine output → more buffer).
- **Indoor pools / hot tubs:** none (no UV; CDC says no CYA in hot tubs).
- Above ~100 ppm → over-stabilization ("chlorine lock"); public pools capped (CDC ≤15 for fecal response).

## 2. Raising CYA (add stabilizer)
Granular cyanuric acid is ~99–100% pure. Per the DOH/NSPF table and multiple sources:
- **13 oz per 10,000 gal raises CYA 10 ppm → 1.3 oz / 10,000 gal / 1 ppm.**

Formula:
```
ounces = 1.3 × (gallons / 10,000) × ΔCYA ÷ (purity% / 100)
  ΔCYA = target − current
```
- **Granular** (weight oz; default purity 100%, also 99%). Slow to dissolve: 24–48h+ (some products 5–7 days) — pre-dissolve / use a sock, run the pump, **wait ~48h before retesting**. Don't chase the number.
- **Liquid stabilizer** (~45% CYA, dosed by volume → ~2.9 fl oz per ppm per 10k): dissolves in hours, but ~4–5× the cost.

## 3. Lowering CYA (dilution only)
**There is no chemical that removes CYA** (despite "CYA reducer" marketing). The
only reliable way is to drain part of the water and refill:
```
drainFraction = 1 − (targetCYA / currentCYA)      (0 if target ≥ current)
gallonsToDrain = poolVolumeGal × drainFraction
```
Example: 100 → 40 ppm = drain 60% and refill. Caveat: dilution lowers
**alkalinity, calcium hardness, and salt by the same %** — re-test and rebalance
after. For very large drains, do it in stages.

## 4. Tie-in with the chlorine calculator
- Chlorine's **low-CYA (outdoor) warning** → link here in **Raise** mode.
- Chlorine's **stabilizer-buildup callout** (trichlor/dichlor adding CYA) → link here in **Lower** mode.
- Carry volume (and current CYA) via the share URL (`?v=&u=gal&cya=`); use the saved "My Pool" too.

## 5. Build
- Engine `src/lib/cya.ts`: `doseToRaiseCya`, `waterToDrain`, `recommendedCya`,
  product list; reuse `toGallons` + `formatAmount` from `chlorine.ts`.
- Page modes: **Raise** (pool type → target, product, current/target) and
  **Lower** (drain gallons + %). Warnings: dissolve time, go-slow, no reducer
  works, dilution side effects. FC/CYA explainer, FAQ, HowTo/FAQ/Breadcrumb
  schema, share, My Pool save/use, RelatedTools.
- Validate: 20,000 gal, +30 ppm granular → 1.3 × 2 × 30 = 78 oz ≈ 4.9 lb;
  100→40 ppm in 20,000 gal → drain 12,000 gal (60%).

## 6. Sources
- Indiana DOH / NSPF *Adjusting Chemical Levels* (stabilizer 13 oz/10k/10 ppm) — see chlorine doc.
- [Swim University — Raise/Balance CYA](https://www.swimuniversity.com/cyanuric-acid/) · [Pool Chemical Calculator — stabilizer](https://poolchemicalcalculator.com/news/pool-stabilizer-cyanuric-acid/)
- Lowering / no reducer: [Pool Shark H2O — CYA reducer options](https://blog.poolsharkh2o.com/cyanuric-acid-reducer) · [Poolonomics — lower CYA](https://poolonomics.com/lower-cyanuric-acid-in-pool/)
