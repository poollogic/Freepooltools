import { Link } from 'react-router-dom';
import { ArrowRight, Wrench, Check, Plus } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { usePageMeta } from '@/lib/usePageMeta';
import { TOOLS, LIVE_TOOLS } from '@/data/tools';
import { SITE_ORIGIN } from '@/lib/site';

// Homepage FAQ — genuine, human answers about the calculators. Doubles as the
// on-page content AND the FAQPage JSON-LD below (single source of truth). This
// is how the homepage earns relevance for "pool calculators" — helpful content
// + internal links to every tool, NOT keyword stuffing.
const HOME_FAQS: { q: string; a: string }[] = [
  {
    q: 'Are these pool calculators really free?',
    a: 'Yes — every calculator on Free Pool Tools is completely free, with no account, sign-up, or email required. Run as many calculations as you like.',
  },
  {
    q: 'Who are these pool tools for?',
    a: 'Both homeowners looking after their own pool and working pool techs who need quick, reliable numbers in the field. The calculators handle in-ground and above-ground pools, plus spas and hot tubs.',
  },
  {
    q: 'How accurate are the results?',
    a: 'Each calculator uses standard pool-industry formulas and shows the math so you can check it. Treat the results as solid estimates for planning and dosing, and always confirm your water chemistry with a test kit before adding chemicals.',
  },
  {
    q: 'Can I share a calculation with someone?',
    a: 'Yes. Every tool builds a shareable link that restores your exact inputs, so you can send a result to a customer, family member, or friend and they will see the same numbers.',
  },
  {
    q: 'Which pool calculators can I use here?',
    a: 'All of them are live. You can work out your pool volume, chlorine dose, shock dose, cyanuric acid (CYA), salt, muriatic acid, total alkalinity, calcium hardness, and water balance (LSI), plus run the numbers on pump runtime, variable-speed pump savings, and pool heating cost. Each one is a dedicated page with the formula shown and a shareable result.',
  },
  {
    q: 'Do I need to know my pool volume first?',
    a: 'For the chemical-dosing tools, yes — every dose scales with how much water you have, so an accurate volume is the foundation. If you do not know your gallons, start with the pool volume calculator (it handles rectangles, rounds, ovals, and varying-depth pools), then carry that number into the chlorine, salt, alkalinity, and other calculators.',
  },
  {
    q: 'Do these tools work for above-ground pools, spas, and hot tubs?',
    a: 'Yes. The calculators are driven by water volume and your current readings, not the type of pool, so they work the same for in-ground and above-ground pools as well as spas and hot tubs. Just enter the right volume — small spas need much smaller chemical doses, and the math handles that automatically.',
  },
];

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Free pool calculators',
  itemListElement: LIVE_TOOLS.map((t, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: t.title,
    url: `${SITE_ORIGIN}${t.path}/`,
  })),
};

const faqPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HOME_FAQS.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

export const HomePage = () => {
  usePageMeta({
    title: 'Free Pool Tools — Calculators for Pool Owners & Pros',
    description:
      'Free pool calculators for homeowners and pool techs — pool volume, chlorine dosing, CYA, salt, and water balance. Instant, accurate, no email required.',
    canonicalPath: '/',
    jsonLd: [itemListSchema, faqPageSchema],
  });

  return (
    <PageShell>
      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <Wrench className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Free pool calculators</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.05] tracking-tight mb-5">
          Pool tools that just work
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-xl mx-auto">
          Free calculators for homeowners and pool techs — work out your volume, dose chemicals,
          and balance your water. Instant results, shareable links, no email required.
        </p>
        <ul className="flex flex-wrap justify-center gap-2 mt-7">
          {['No sign-up', 'Shareable results', 'Built on real pool chemistry'].map((label) => (
            <li
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3 py-1.5 text-xs font-semibold text-muted"
            >
              <Check className="w-3.5 h-3.5 text-brand-orange shrink-0" />
              {label}
            </li>
          ))}
        </ul>
      </section>

      {/* Tools grid */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((tool, i) => {
            const Icon = tool.icon;
            const soon = tool.status === 'soon';
            const inner = (
              <>
                <div className="flex items-start justify-between">
                  <span className="w-12 h-12 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-brand-orange" />
                  </span>
                  {soon && (
                    <span className="rounded-full border border-line bg-card-2 px-2.5 py-1 text-[11px] font-semibold text-muted">
                      Soon
                    </span>
                  )}
                </div>
                <h2 className="text-fg font-display font-bold text-xl mb-2">{tool.title}</h2>
                <p className="text-muted text-[15px] leading-relaxed flex-1">{tool.blurb}</p>
                <span className="inline-flex items-center gap-1.5 font-semibold text-sm mt-4">
                  {soon ? (
                    <span className="text-subtle">Coming soon</span>
                  ) : (
                    <span className="text-brand-orange inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Open calculator <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </span>
              </>
            );

            const base =
              'group flex flex-col h-full rounded-2xl border border-line bg-card p-6 elevate transition-all';

            return (
              <div key={tool.path} className="card-rise" style={{ animationDelay: `${i * 0.06}s` }}>
                {soon ? (
                  <div className={`${base} opacity-70`}>{inner}</div>
                ) : (
                  <Link to={`${tool.path}/`} className={`${base} hover:bg-card-2 hover:border-line-strong hover:-translate-y-0.5`}>
                    {inner}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Supporting content — natural, human copy + internal links. This is what
          earns the homepage relevance for "pool calculators": helpful content
          and links to every tool, not a keyword dump. */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <h2 className="font-display font-bold text-fg text-2xl sm:text-3xl mb-4">
          Free pool calculators, built right
        </h2>
        <div className="space-y-4 text-muted leading-relaxed max-w-3xl">
          <p>
            Keeping a pool balanced comes down to numbers: how much water you have, how much of each
            chemical to add, and whether your water is in range. Free Pool Tools turns those numbers
            into quick, dependable calculators that work the same for homeowners and pool
            professionals — no sign-up, no app, no email.
          </p>
          <p>
            Start with the{' '}
            <Link
              to="/pool-volume-calculator/"
              className="text-brand-orange font-semibold hover:text-brand-orange-dark"
            >
              pool volume calculator
            </Link>{' '}
            to find your gallons — it’s the foundation every chemical dose is based on. From there,
            our chemistry tools build on that volume to tell you exactly how much to add. Every
            result comes with the formula we used and a link you can share.
          </p>
          <p>
            For everyday water chemistry, the{' '}
            <Link to="/chlorine-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              chlorine
            </Link>
            ,{' '}
            <Link to="/pool-shock-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              shock
            </Link>
            , and{' '}
            <Link to="/cya-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              cyanuric acid
            </Link>{' '}
            calculators keep your sanitizer working, while the{' '}
            <Link to="/pool-alkalinity-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              alkalinity
            </Link>
            ,{' '}
            <Link to="/calcium-hardness-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              calcium hardness
            </Link>
            ,{' '}
            <Link to="/muriatic-acid-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              muriatic acid
            </Link>
            , and{' '}
            <Link to="/lsi-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              water balance (LSI)
            </Link>{' '}
            tools keep the water from turning corrosive or scaling. Running a saltwater pool? The{' '}
            <Link to="/salt-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              salt calculator
            </Link>{' '}
            sizes your salt dose, and on the equipment side the{' '}
            <Link to="/pool-pump-runtime-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              pump runtime
            </Link>
            ,{' '}
            <Link to="/variable-speed-pool-pump-savings-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              variable-speed pump savings
            </Link>
            , and{' '}
            <Link to="/pool-heating-cost-calculator/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              heating cost
            </Link>{' '}
            calculators help you run the pool for less.
          </p>
          <p>
            Every calculator uses standard, published pool-industry formulas, and each one shows the math
            behind its answer so you can check the work instead of trusting a black box. We treat dosing
            as health-adjacent: the numbers are careful estimates for planning, and you should always
            confirm your water with a reliable test kit before adding chemicals. You can read more about
            the formulas and sources we use on our{' '}
            <Link to="/about/" className="text-brand-orange font-semibold hover:text-brand-orange-dark">
              methodology page
            </Link>
            . No sign-up, no app, no email — just open a tool and get your answer.
          </p>
        </div>
      </section>

      {/* FAQ — visible content (prerendered) backed by the FAQPage JSON-LD above. */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <h2 className="font-display font-bold text-fg text-2xl sm:text-3xl mb-5">
          Pool calculator FAQ
        </h2>
        <div className="rounded-2xl border border-line bg-card divide-y divide-line elevate">
          {HOME_FAQS.map((item) => (
            <details key={item.q} className="group">
              <summary className="list-none cursor-pointer flex items-start justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                <span className="font-display font-normal text-fg text-[15px] sm:text-base leading-snug">
                  {item.q}
                </span>
                <span className="shrink-0 mt-0.5 text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange">
                  <Plus className="w-5 h-5" />
                </span>
              </summary>
              <p className="px-5 sm:px-6 pb-5 -mt-1 text-muted leading-relaxed text-[15px]">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </PageShell>
  );
};
