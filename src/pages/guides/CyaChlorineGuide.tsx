import { Link } from 'react-router-dom';
import { GuideLayout } from '@/components/GuideLayout';
import { GUIDES } from '@/data/guides';

const guide = GUIDES.find((g) => g.slug === 'cyanuric-acid-and-chlorine')!;

const FAQS = [
  {
    q: 'What is the ideal FC/CYA ratio?',
    a: 'A widely used field rule is to keep free chlorine at roughly 7.5% of your CYA as the bare minimum, and around 11–12% as a comfortable daily target. So at 40 ppm CYA that’s about a 3 ppm minimum and a 5–6 ppm target; at 80 ppm CYA it’s about 6 ppm minimum and 9–11 ppm target.',
  },
  {
    q: 'Can I have too much cyanuric acid?',
    a: 'Yes. Above roughly 80–100 ppm, chlorine becomes so “locked” by CYA that it sanitizes very slowly even when a test shows a normal level — that’s over-stabilization. The only way down is to drain and dilute, so it’s much easier to add CYA slowly than to fix an overshoot.',
  },
  {
    q: 'Do I need cyanuric acid in an indoor pool or hot tub?',
    a: 'No. CYA only protects chlorine from sunlight, so an indoor pool has nothing to gain from it, and the CDC recommends not using CYA in hot tubs. Add it only to outdoor pools.',
  },
];

const SOURCES = [
  { label: 'CDC — Home Pool & Hot Tub Water Treatment and Testing', url: 'https://www.cdc.gov/healthy-swimming/about/home-pool-and-hot-tub-water-treatment-and-testing.html' },
  { label: 'Trouble Free Pool — CYA / Chlorine relationship', url: 'https://www.troublefreepool.com/wiki/index.php?title=CYA_Chlorine_Relationship' },
  { label: 'PHTA / ANSI-APSP-5 — residential water quality', url: 'https://www.phta.org/' },
];

export const CyaChlorineGuide = () => (
  <GuideLayout
    title={guide.title}
    description="How cyanuric acid (CYA) protects chlorine from sunlight, why too much stops chlorine working, and how to use the FC/CYA ratio to set the right chlorine level."
    path={guide.path}
    updated={guide.updated}
    faqs={FAQS}
    sources={SOURCES}
    cta={{
      to: '/chlorine-calculator',
      label: 'Calculate your chlorine dose',
      sub: 'The chlorine calculator sets your target from your CYA automatically.',
    }}
  >
    <p>
      Cyanuric acid (CYA) — also sold as <strong>stabilizer</strong> or <strong>conditioner</strong> —
      and chlorine are a package deal in any outdoor pool. Get the balance right and your chlorine
      lasts all day; get it wrong in either direction and you’ll either burn through chlorine by noon
      or watch it stop working entirely. Here’s how the two relate, in plain English.
    </p>

    <h2>Why chlorine needs cyanuric acid</h2>
    <p>
      Sunlight is brutal on chlorine. Ultraviolet light breaks free chlorine down fast — studies put
      it at roughly <strong>half gone within about 17 minutes</strong> of direct sun, and an
      unprotected outdoor pool can lose <strong>50–90% of its chlorine in just a few hours</strong>.
      Without protection, you simply can’t hold a sanitizer level through an afternoon.
    </p>
    <p>
      Cyanuric acid fixes this. It forms a loose, reversible bond with chlorine that acts like
      sunscreen: it shields the chlorine from UV while still releasing it to kill germs and algae.
      With CYA in the water, chlorine lasts roughly <strong>3–5× longer</strong>. That’s why CYA is
      essential for outdoor pools — and pointless (even discouraged) for indoor pools and hot tubs,
      which get no sun.
    </p>

    <h2>The catch: too much CYA “locks” your chlorine</h2>
    <p>
      The same bond that protects chlorine also slows it down. As CYA climbs, a smaller and smaller
      fraction of your free chlorine is in its active form at any moment. Push CYA too high — above
      roughly 80–100 ppm — and chlorine becomes so sluggish that the water can look “in range” on a
      test yet sanitize poorly. This is <strong>over-stabilization</strong>, and it’s a common cause
      of cloudy or algae-prone water in pools that test fine for chlorine.
    </p>
    <p>
      Because nothing chemical removes CYA, the only way to bring it back down is to{' '}
      <Link to="/cya-calculator">drain and dilute</Link>. So the goal is to keep CYA in a sweet
      spot, not to chase it up.
    </p>

    <h2>The FC/CYA ratio — the number that ties them together</h2>
    <p>
      The practical takeaway is that <strong>your correct chlorine level depends on your CYA</strong>,
      not on a single “2–4 ppm” rule. The higher your CYA, the more free chlorine you need to keep the
      same sanitizing power. A widely used guide:
    </p>
    <ul>
      <li><strong>Minimum</strong> free chlorine ≈ 7.5% of CYA (never let it drop below this)</li>
      <li><strong>Target</strong> free chlorine ≈ 11–12% of CYA for everyday operation</li>
      <li><strong>Shock</strong> level ≈ 40% of CYA to clear algae</li>
    </ul>
    <p>So in practice:</p>
    <ul>
      <li>CYA 30 → minimum ~2 ppm, target ~4–6 ppm</li>
      <li>CYA 50 → minimum ~4 ppm, target ~6–8 ppm</li>
      <li>CYA 80 → minimum ~6 ppm, target ~9–11 ppm</li>
    </ul>

    <h2>Putting it to work</h2>
    <p>
      Aim for <strong>30–50 ppm CYA</strong> in a traditional chlorine pool, or <strong>60–80 ppm</strong>
      in a saltwater pool (salt systems make chlorine at a lower rate, so the extra buffer helps). Then
      hold your free chlorine at the target for that CYA level. If your CYA is low, your chlorine will
      keep vanishing in the sun; if it’s very high, raise your chlorine target or dilute the CYA back
      down. Our calculators do this math for you — the{' '}
      <Link to="/chlorine-calculator">chlorine calculator</Link> reads your CYA and recommends the
      right target automatically, and the{' '}
      <Link to="/cya-calculator">stabilizer calculator</Link> tells you how much CYA to add or how
      much water to drain.
    </p>
  </GuideLayout>
);
