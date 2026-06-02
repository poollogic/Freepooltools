# Chlorine Calculator — Research & Build Spec

> Authoritative research compiled before building `/chlorine-calculator`. Every
> number here is sourced; cite these on the page (accuracy + E-E-A-T, since
> dosing is health-adjacent). Always pair output with a "confirm with a test kit"
> disclaimer.

## 1. Target free-chlorine (FC) levels — what to recommend

| Source | Recommendation |
| --- | --- |
| **CDC** (home pools) | FC **≥ 1 ppm** (pools), **≥ 2 ppm if cyanuric acid is used**, **≥ 3 ppm hot tubs**. pH **7.0–7.8**. Don't use CYA in hot tubs. Test FC + pH **≥ 2×/day**. |
| **PHTA / APSP-5** (residential) | FC **2.0–4.0 ppm**. CYA ideal **30–50 ppm**, **max 100 ppm** (APSP-11). |
| **CDC (public, fecal)** | CYA in public pools ≤ **15 ppm**; MAHC caps CYA. |

**Key principle (the accuracy edge most calculators miss):** the right FC target
depends on **cyanuric acid (CYA)**. Higher CYA → a smaller fraction of FC is
active (HOCl) → you must hold a **higher FC** for the same sanitizing power.

### CYA is a NECESSITY for outdoor pools (documented)
For any **outdoor** chlorine pool, CYA (stabilizer/conditioner) is essential, not
optional — UV sunlight destroys unprotected free chlorine fast:
- **UV destroys ~50% of unprotected FC in ~17 minutes** of direct sun.
- An unstabilized outdoor pool can lose **50–90% of its FC in a few hours** (most
  gone in **2–4 hours** on a sunny day).
- **With CYA, chlorine lasts 3–5× longer.** CYA forms a reversible bond that
  shields chlorine from UV while keeping it available to sanitize.
- **Ideal 30–50 ppm** (outdoor). Below → chlorine burns off; above ~100 →
  over-stabilized / "chlorine lock" (chlorine present but ineffective).
- **Exceptions where CYA is NOT used:** **indoor pools** (no UV) and **hot tubs**
  (CDC explicitly says no CYA in hot tubs).

So the calculator treats CYA as a **first-class, default input** for outdoor
pools and drives the FC target from it (chart below). Sources: Montana DPHHS
public-health fact sheet, peer-reviewed Frontiers study, Orenda, Swim University
(see §7).

### FC/CYA target chart (Trouble Free Pool model, via InYo Pools)
Traditional (liquid/cal-hypo/tab) chlorine pools:

| CYA (ppm) | Min FC | Target FC |
| --- | --- | --- |
| 20 | 2 | 3–5 |
| 30 | 2 | 4–6 |
| 40 | 3 | 5–7 |
| 50 | 4 | 6–8 |
| 60 | 5 | 7–9 |
| 70 | 5 | 8–10 |
| 80 | 6 | 9–11 |
| 90 | 7 | 10–12 |
| 100 | 8 | 11–13 |

Saltwater (SWG) pools run higher CYA: CYA 70 → target ~5, CYA 80 → target ~6.
Field rule of thumb: **min FC ≈ 7.5% of CYA**, **target ≈ ~11% of CYA**,
**shock ≈ 40% of CYA**.

**Recommended CYA ranges:** liquid-chlorine pools **30–50** (PHTA) / 30–60 (TFP);
saltwater pools **60–80**.

## 2. Dosing math — the citable formula (Indiana DOH / NSPF handbook)

To change FC by **1 ppm in 10,000 gallons**:
- **Solids (by weight):** `0.083 lb` = `1.3 oz` per 10,000 gal per ppm.
  - Derivation: `lbs = 1 ppm × (10,000 ÷ 120,000)` because 120,000 gal of water weighs 1,000,000 lb.
- Then **divide by the product's available-chlorine fraction** (label %, as a decimal).

**General formula used by the calculator:**
```
amount = BASE  ×  (gallons / 10,000)  ×  ΔFC  /  availableFraction

  where ΔFC = targetFC − currentFC (ppm)
        BASE = 1.3  (report ounces; liquids → fluid oz, solids → weight oz)
               0.083 (report pounds for solids)
```
Report in friendly units (fl oz / cups / quarts / gallons for liquids; oz / lb for solids).

### Verified per-product dosing (per 10,000 gal, +1 ppm FC) — NSPF/Indiana DOH table
| Product | Avail. Cl | +1 ppm / 10k gal | Side effects to flag |
| --- | --- | --- | --- |
| Liquid chlorine / sodium hypochlorite | **12%** (also 10%, 12.5%) | **10.7 fl oz** (1.3/0.12) | Raises pH (temporary); adds a little salt |
| Household bleach | **6%** (7.5%, 8.25%) | ~21.7 fl oz @6% | Same as above; weaker → more volume |
| Cal-hypo (calcium hypochlorite) | **67%** (range 47–78) | **2 oz** (1.3/0.67) | **Adds calcium hardness**; raises pH |
| Dichlor | **56%** or **62%** | **2.4 / 2.1 oz** | **Adds CYA** (~0.9 ppm CYA per 1 ppm FC) |
| Trichlor (tabs) | **~90%** | **1.5 oz** | **Adds CYA** (~0.6 ppm CYA per 1 ppm FC); **lowers pH** |
| Lithium hypochlorite | **~35%** | **3.8 oz** | Expensive; low residue |
| Chlorine gas | 100% | 1.3 oz | Industrial — omit for residential |

> Stabilized-chlorine CYA additions (dichlor ~0.9, trichlor ~0.6 ppm CYA per
> ppm FC) are standard pool-chemistry figures (Trouble Free Pool). Surface these
> as a warning when a stabilized product is selected — repeated use drives CYA
> up and can require draining.

## 3. Shock / breakpoint chlorination
- **Combined chlorine (CC)** = total Cl − free Cl. CC = chloramines (the "chlorine
  smell," red eyes). Shock to remove it.
- **Breakpoint formula:** `target FC = 10 × CC`. Dose needed = `(10 × CC) − currentFC` ppm.
  Severe contamination → 20–30× CC. (In The Swim, Orenda, Poolcenter.)
- **TFP "SLAM" / algae shock level ≈ 40% of CYA** (CYA-dependent — higher CYA needs higher shock FC).
- **CDC fecal/Crypto:** raise FC to **20 ppm and hold 12.75 hours** (CT value 15,300), pH ≤ 7.5, no CYA.
- Best shock chemical = unstabilized, fast: **liquid chlorine** or **cal-hypo** (not stabilized tabs).

## 4. Lowering chlorine (over-chlorinated)
- Easiest: stop adding, let **sunlight** burn it off (esp. low-CYA water).
- Chemical neutralizers (per 10k gal, −1 ppm): **sodium thiosulfate 2.6 oz**, **sodium sulfite 2.4 oz**. Add gradually, re-test.

## 5. Safety guidance to display (from the DOH guide)
- **Never mix pool chemicals** (esp. different chlorine types) — can react violently.
- Add chemicals with the pump running, pool **not in use**; broadcast/pre-dissolve per label.
- **Always add acid to water, never water to acid.**
- Keep **pH 7.2–7.8** — chlorine works poorly outside this range.
- Adjustment order: **FC → total alkalinity → pH → CYA → hardness.**
- This is an estimate; **follow the product label** and **confirm with a test kit**.

## 6. Proposed calculator design

**Primary mode — "How much chlorine to add":**
- Inputs: pool volume (gal/L) [carry over from volume calc via share URL],
  **pool environment** (outdoor / indoor / hot tub), **CYA (ppm)**, current FC,
  target FC, **chlorine product** (liquid 12.5% / 10% / bleach 6% / cal-hypo
  65–73% / dichlor / trichlor / lithium) with editable strength %.
- **CYA is a first-class input, not optional.** For **outdoor** pools it's
  required and **drives the recommended target FC** from the FC/CYA chart (with
  the range shown), because CYA is essential there (§1). If CYA is 0/low on an
  outdoor pool, warn that chlorine will burn off in sunlight and prompt to add
  stabilizer (link the future CYA calculator). For **indoor / hot tub**, hide CYA
  and use the flat CDC targets (and note CYA shouldn't be used there).
- Output: amount in friendly units + the worked formula ("how we got that").
- Warnings: stabilized-product CYA gain; cal-hypo calcium; pH effects; low-CYA-outdoor.

**Secondary mode — "Shock my pool" (breakpoint):**
- Inputs: volume, current FC, current **total** chlorine (→ CC) OR a reason
  (cloudy/algae) → use 40%·CYA or 10×CC. Output dose of liquid chlorine/cal-hypo.

**Optional mode — "Lower my chlorine":** thiosulfate/sulfite dose + "wait for sun" tip.

**Page content (SEO + E-E-A-T):** target-level table, FC/CYA explainer, product
comparison table, shock explainer, safety list, FAQ ("how much chlorine to add to
my pool", "how much bleach", "how much liquid chlorine per 10000 gallons", "pool
shock calculator"), HowTo + FAQPage + BreadcrumbList schema, RelatedTools.

**Engine:** pure functions, unit-tested against the table above (e.g. 40,000 gal,
1→3 ppm, 12% sodium hypochlorite must yield ≈ 85.6 fl oz, matching the DOH worked
example). Use `useShareableState`.

## 7. Sources
- [CDC — Home Pool & Hot Tub Water Treatment & Testing](https://www.cdc.gov/healthy-swimming/about/home-pool-and-hot-tub-water-treatment-and-testing.html)
- Indiana State Dept. of Health — *Adjusting Chemical Levels in a Swimming Pool* (adapted from NSPF Pool & Spa Operator Handbook): https://www.in.gov/health/eph/files/Chemical_adjustment_pool.pdf
- [PHTA / ANSI-APSP-5 residential water quality](https://www.phta.org/)
- [Trouble Free Pool — CYA/Chlorine relationship](https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship)
- [InYo Pools — CYA calculator + FC/CYA chart](https://diy.inyopools.com/article/pool-cyanuric-acid-calculator/)
- [In The Swim — Breakpoint chlorination](https://www.intheswim.com/eguides/breakpoint-chlorination.html) · [Orenda — Breakpoint](https://blog.orendatech.com/breakpoint-chlorination-explained)

**CYA is essential (UV protection of chlorine):**
- Montana DPHHS — *Fact Sheet on Cyanuric Acid and Stabilized Chlorine Products* (govt): https://dphhs.mt.gov/assets/publichealth/FCS/PublicSwimmingPools/CyanuricAcid.pdf
- Peer-reviewed: *Study on the health risk of cyanuric acid in swimming pool water* — [Frontiers in Public Health](https://www.frontiersin.org/journals/public-health/articles/10.3389/fpubh.2023.1294842/full) / [NCBI PMC10801151](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10801151/)
- [Orenda — Understanding Cyanuric Acid](https://blog.orendatech.com/understanding-cyanuric-acid) · [Swim University — Cyanuric Acid](https://www.swimuniversity.com/cyanuric-acid/)
