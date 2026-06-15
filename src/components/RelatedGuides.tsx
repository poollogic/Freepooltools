import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight } from 'lucide-react';

/**
 * "Related guides" cross-link grid for tool pages — points calculators at the
 * topically-relevant explainers in /guides, building tool↔guide topical
 * clusters and feeding the guides internal links (they're the most
 * link-starved pages).
 *
 * Link data is passed in by each page rather than imported from the guides
 * registry on purpose: tool pages must not pull the /guides data/code into
 * their chunk (see the guides.ts header + the speed/modularity rule). Each
 * `to` should already include its trailing slash so it points at the canonical
 * URL with no redirect hop.
 */
export type RelatedGuideLink = { to: string; title: string; excerpt: string };

export const RelatedGuides = ({ guides }: { guides: RelatedGuideLink[] }) => {
  if (guides.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-5">Related guides</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {guides.map((g) => (
          <Link
            key={g.to}
            to={g.to}
            className="group flex flex-col h-full rounded-2xl border border-line bg-card p-5 elevate transition-all hover:bg-card-2 hover:border-line-strong hover:-translate-y-0.5"
          >
            <span className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
              <BookOpen className="w-[18px] h-[18px] text-brand-orange" />
            </span>
            <h3 className="text-fg font-display font-bold text-base mb-1.5 leading-snug">{g.title}</h3>
            <p className="text-muted text-[13px] leading-relaxed flex-1">{g.excerpt}</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-4 text-brand-orange group-hover:gap-2.5 transition-all">
              Read guide <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};
