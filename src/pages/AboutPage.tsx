import { PageShell } from '@/components/PageShell';
import { usePageMeta } from '@/lib/usePageMeta';

/**
 * Methodology / E-E-A-T page. Pool chemistry is health-adjacent (people dose
 * chemicals from these outputs), so being explicit about formulas, sources, and
 * limitations is both honest and a ranking signal. Expand as tools are added.
 */
export const AboutPage = () => {
  usePageMeta({
    title: 'How We Calculate — Methodology & Sources | Free Pool Tools',
    description:
      'The formulas, assumptions, and sources behind our pool calculators — pool volume geometry, gallons-per-cubic-foot, and water-chemistry references.',
    canonicalPath: '/about/',
  });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl tracking-tight mb-5">
          How we calculate
        </h1>
        <p className="text-lg text-muted leading-relaxed mb-10 max-w-3xl">
          Every tool here is built on standard pool-industry math, shown openly so you can check
          our work. Results are estimates for planning and education — always confirm with a test
          kit before adding chemicals.
        </p>

        <div className="space-y-8 text-muted leading-relaxed max-w-3xl">
          <div>
            <h2 className="font-display font-bold text-fg text-xl mb-2">Pool volume</h2>
            <p>
              Volume is the area of the water surface times the average water depth, converted to
              gallons at <strong>7.48 U.S. gallons per cubic foot</strong>. Rectangles use length ×
              width; round pools use π × radius²; ovals use π × (length/2) × (width/2); kidney
              pools use the industry estimate 0.45 × (A + B) × length. Sloped pools are modeled
              section-by-section (shallow flat + slope + deep flat) for a more accurate result than
              a single average depth.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-fg text-xl mb-2">Why volume comes first</h2>
            <p>
              Almost every chemical dose — chlorine, acid, cyanuric acid, salt — is a rate per
              volume of water. Get the gallons wrong and every dose after it is wrong too. That's
              why the pool volume calculator is the foundation the other tools build on.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-fg text-xl mb-2">Water chemistry &amp; dosing</h2>
            <p>
              Our dosing tools follow the standard relationships used across the pool industry. Chlorine,
              salt, alkalinity, calcium, and acid doses are all expressed as a rate per volume of water —
              for example, roughly 10–11 fluid ounces of 12.5% liquid chlorine raises a 10,000-gallon
              pool by about 1 ppm of free chlorine — then scaled to your exact gallons and target. Our
              chlorine guidance is built around the free-chlorine-to-cyanuric-acid (FC/CYA) relationship,
              which determines how much of your chlorine is actually active. Water balance uses the{' '}
              <strong>Langelier Saturation Index (LSI)</strong>, combining pH, total alkalinity, calcium
              hardness, temperature, and total dissolved solids into a single number, with the standard
              industry lookup factors and a TDS constant of 12.1 for traditional pools (12.2 for
              saltwater). Each calculator prints the exact formula it used beneath the result.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-fg text-xl mb-2">Sources &amp; standards</h2>
            <p>
              The math here reflects long-established references rather than anything we invented: the
              Langelier Saturation Index for water balance, the cyanuric-acid stabilization research that
              underpins modern FC/CYA targets, manufacturer-published available-chlorine strengths for
              each product, and the geometry of pool volume. We favor conservative, widely accepted
              ranges — for instance, free chlorine targeted to your CYA level, total alkalinity around
              80–120 ppm, calcium hardness around 200–400 ppm, and an LSI between −0.3 and +0.3. Where
              sources disagree at the edges, we err toward the safer recommendation.
            </p>
          </div>

          <div>
            <h2 className="font-display font-bold text-fg text-xl mb-2">Accuracy & limitations</h2>
            <p>
              Real pools have steps, benches, and irregular floors that a formula can't see, so
              treat results as close estimates rather than exact figures. For chemistry, your test
              kit is the source of truth — these tools tell you roughly how much to add, not whether
              you've added it correctly. Add chemicals gradually, re-test after the pump has circulated
              the water, and never mix chemicals together. When a reading is far out of range, make a
              partial correction, let it settle, and measure again rather than chasing the number in one
              large dose.
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
};
