import { Link } from 'react-router-dom';
import { m } from 'motion/react';
import { BookOpen, ArrowRight } from 'lucide-react';
import { PageShell } from '@/components/PageShell';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN } from '@/lib/site';
import { GUIDES, LIVE_GUIDES } from '@/data/guides';

const itemListSchema = {
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  name: 'Pool care guides',
  itemListElement: LIVE_GUIDES.map((g, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: g.title,
    url: `${SITE_ORIGIN}${g.path}/`,
  })),
};

export const GuidesHubPage = () => {
  usePageMeta({
    title: 'Pool Care Guides: Chemistry Explained | Free Pool Tools',
    description:
      'Plain-English pool care guides — cyanuric acid and chlorine, ideal water chemistry levels, and more. Learn the why behind the numbers, then run the calculators.',
    canonicalPath: '/guides/',
    jsonLd: [itemListSchema],
  });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-10 text-center">
        <div className="inline-flex items-center gap-2 mb-5 rounded-full border border-line bg-card-2 backdrop-blur-[10px] px-3.5 py-1.5">
          <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
          <span className="text-muted font-semibold tracking-wide text-xs">Guides</span>
        </div>
        <h1 className="font-display font-bold text-fg text-4xl sm:text-5xl leading-[1.05] tracking-tight mb-5">
          Pool care, explained
        </h1>
        <p className="text-lg text-muted leading-relaxed max-w-2xl mx-auto">
          The “why” behind the numbers — clear, sourced explainers on pool chemistry. Read up, then
          jump into the calculators to put it into practice.
        </p>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid gap-5 sm:grid-cols-2">
          {GUIDES.map((g, i) => {
            const soon = g.status === 'soon';
            const inner = (
              <>
                <span className="w-11 h-11 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                  <BookOpen className="w-5 h-5 text-brand-orange" />
                </span>
                <h2 className="text-fg font-display font-bold text-lg mb-2 leading-snug">{g.title}</h2>
                <p className="text-muted text-[15px] leading-relaxed flex-1">{g.excerpt}</p>
                <span className="inline-flex items-center gap-1.5 font-semibold text-sm mt-4">
                  {soon ? (
                    <span className="text-subtle">Coming soon</span>
                  ) : (
                    <span className="text-brand-orange inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                      Read guide <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </span>
              </>
            );
            const base = 'group flex flex-col h-full rounded-2xl border border-line bg-card p-6 elevate transition-all';
            return (
              <m.div key={g.path} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                {soon ? (
                  <div className={`${base} opacity-70`}>{inner}</div>
                ) : (
                  <Link to={g.path} className={`${base} hover:bg-card-2 hover:border-line-strong hover:-translate-y-0.5`}>
                    {inner}
                  </Link>
                )}
              </m.div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
};
