import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Plus } from 'lucide-react';
import { PageShell } from './PageShell';
import { usePageMeta } from '@/lib/usePageMeta';
import { SITE_ORIGIN, SITE_NAME } from '@/lib/site';
import { relatedGuides } from '@/data/guides';

type Faq = { q: string; a: string };

type GuideLayoutProps = {
  /** Used for the <h1> and the meta/Article title. */
  title: string;
  description: string;
  /** Path without trailing slash, e.g. '/guides/cyanuric-acid-and-chlorine'. */
  path: string;
  /** ISO date. */
  updated: string;
  children: ReactNode;
  /** Primary "use the calculator" call-to-action. */
  cta?: { to: string; label: string; sub?: string };
  faqs?: Faq[];
  sources?: { label: string; url: string }[];
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

export const GuideLayout = ({ title, description, path, updated, children, cta, faqs, sources }: GuideLayoutProps) => {
  const url = `${SITE_ORIGIN}${path}/`;
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    datePublished: updated,
    dateModified: updated,
    mainEntityOfPage: url,
    author: { '@type': 'Organization', name: SITE_NAME, url: `${SITE_ORIGIN}/` },
    publisher: { '@type': 'Organization', name: SITE_NAME },
  };
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: SITE_NAME, item: `${SITE_ORIGIN}/` },
      { '@type': 'ListItem', position: 2, name: 'Guides', item: `${SITE_ORIGIN}/guides/` },
      { '@type': 'ListItem', position: 3, name: title, item: url },
    ],
  };
  const faqSchema = faqs?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      }
    : null;

  usePageMeta({
    title,
    description,
    canonicalPath: `${path}/`,
    jsonLd: faqSchema ? [articleSchema, faqSchema, breadcrumbSchema] : [articleSchema, breadcrumbSchema],
  });

  const more = relatedGuides(path, 3);

  return (
    <PageShell>
      <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="max-w-4xl mx-auto">
          <Link to="/guides" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg mb-6">
            <ArrowLeft className="w-4 h-4" /> All guides
          </Link>
          <div className="inline-flex items-center gap-2 mb-4 rounded-full border border-line bg-card-2 px-3 py-1.5">
            <BookOpen className="w-3.5 h-3.5 text-brand-orange" />
            <span className="text-muted font-semibold tracking-wide text-xs">Guide</span>
          </div>
          <h1 className="font-display font-bold text-fg text-3xl sm:text-4xl leading-tight tracking-tight mb-3">
            {title}
          </h1>
          <p className="text-subtle text-sm mb-8">Updated {fmtDate(updated)}</p>

          <div className="guide-prose">{children}</div>

          {cta && (
            <Link
              to={cta.to}
              className="group mt-10 flex items-center justify-between gap-4 rounded-2xl border border-line bg-gradient-to-br from-brand-blue/15 to-brand-orange/10 p-5 elevate"
            >
              <span>
                <span className="block font-display font-bold text-fg text-lg">{cta.label}</span>
                {cta.sub && <span className="block text-muted text-sm mt-0.5">{cta.sub}</span>}
              </span>
              <ArrowRight className="w-5 h-5 text-brand-orange shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}

          {faqs?.length ? (
            <section className="mt-12">
              <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-4">Common questions</h2>
              <div className="rounded-2xl border border-line bg-card divide-y divide-line elevate">
                {faqs.map((item) => (
                  <details key={item.q} className="group">
                    <summary className="list-none cursor-pointer flex items-start justify-between gap-4 px-5 sm:px-6 py-4 text-left">
                      <span className="font-display font-normal text-fg text-[15px] sm:text-base leading-snug">{item.q}</span>
                      <span className="shrink-0 mt-0.5 text-subtle transition-transform duration-200 group-open:rotate-45 group-open:text-brand-orange">
                        <Plus className="w-5 h-5" />
                      </span>
                    </summary>
                    <p className="px-5 sm:px-6 pb-5 -mt-1 text-muted leading-relaxed text-[15px]">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          {sources?.length ? (
            <section className="mt-10 pt-6 border-t border-line">
              <p className="text-xs uppercase tracking-[0.15em] text-subtle mb-2">Sources</p>
              <ul className="space-y-1.5">
                {sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-fg underline underline-offset-2">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {more.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display font-bold text-fg text-lg mb-3">More guides</h2>
              <ul className="space-y-2">
                {more.map((g) => (
                  <li key={g.path}>
                    <Link to={g.path} className="inline-flex items-center gap-1.5 text-brand-orange font-semibold hover:text-brand-orange-dark">
                      {g.shortTitle} <ArrowRight className="w-4 h-4" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </article>
    </PageShell>
  );
};
