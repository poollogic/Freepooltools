import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { relatedTools } from '@/data/tools';

/**
 * "More pool tools" cross-link grid for the bottom of each tool page. Internal
 * linking between tool pages spreads crawl equity and keeps users on-site — the
 * monetization model is pageviews, so this replaces the old lead-gen CTA.
 */
export const RelatedTools = ({ currentPath }: { currentPath: string }) => {
  const tools = relatedTools(currentPath, 3);
  if (tools.length === 0) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
      <h2 className="font-display font-bold text-fg text-xl sm:text-2xl mb-5">More pool tools</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const soon = tool.status === 'soon';
          const card = (
            <>
              <span className="w-10 h-10 rounded-xl bg-brand-orange/15 flex items-center justify-center mb-4">
                <Icon className="w-[18px] h-[18px] text-brand-orange" />
              </span>
              <h3 className="text-fg font-display font-bold text-base mb-1.5 leading-snug">
                {tool.title}
              </h3>
              <p className="text-muted text-[13px] leading-relaxed flex-1">{tool.blurb}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold mt-4">
                {soon ? (
                  <span className="text-subtle">Coming soon</span>
                ) : (
                  <span className="text-brand-orange inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                    Open tool <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </span>
            </>
          );

          const classes =
            'group flex flex-col h-full rounded-2xl border border-line bg-card p-5 elevate transition-all';

          return soon ? (
            <div key={tool.path} className={`${classes} opacity-70`}>
              {card}
            </div>
          ) : (
            <Link key={tool.path} to={tool.path} className={`${classes} hover:bg-card-2 hover:border-line-strong hover:-translate-y-0.5`}>
              {card}
            </Link>
          );
        })}
      </div>
    </section>
  );
};
