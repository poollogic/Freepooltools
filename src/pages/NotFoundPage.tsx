import { Link } from 'react-router-dom';
import { PageShell } from '@/components/PageShell';
import { usePageMeta } from '@/lib/usePageMeta';

export const NotFoundPage = () => {
  usePageMeta({
    title: 'Page not found | Free Pool Tools',
    description: 'That page doesn’t exist. Head back to the free pool calculators.',
    noindex: true,
  });

  return (
    <PageShell>
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-32 text-center">
        <p className="font-display font-bold text-brand-orange text-6xl mb-4">404</p>
        <h1 className="font-display font-bold text-fg text-3xl mb-4">Page not found</h1>
        <p className="text-muted mb-8">
          That page doesn’t exist — but the calculators are all one click away.
        </p>
        <Link to="/" className="btn btn-orange">
          Browse all pool tools
        </Link>
      </section>
    </PageShell>
  );
};
