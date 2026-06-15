import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { LIVE_TOOLS } from '@/data/tools';
import { SITE_TAGLINE } from '@/lib/site';

/**
 * Site footer. Lists the live tools (internal links help SEO) plus a short
 * trust/accuracy disclaimer — pool dosing is health-adjacent, so being explicit
 * that results are estimates supports E-E-A-T and sets honest expectations.
 */
export const Footer = () => (
  <footer className="relative z-10 border-t border-line bg-card">
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <Link to="/" className="text-[17px]">
            <Logo />
          </Link>
          <p className="mt-3 text-muted text-sm leading-relaxed max-w-sm">{SITE_TAGLINE}</p>
        </div>

        <div>
          <p className="text-fg font-semibold text-sm mb-3">Tools</p>
          <ul className="space-y-2">
            {LIVE_TOOLS.map((tool) => (
              <li key={tool.path}>
                <Link
                  to={`${tool.path}/`}
                  className="text-muted hover:text-fg text-sm transition-colors"
                >
                  {tool.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-fg font-semibold text-sm mb-3">Site</p>
          <ul className="space-y-2">
            <li>
              <Link to="/" className="text-muted hover:text-fg text-sm transition-colors">
                All tools
              </Link>
            </li>
            <li>
              <Link to="/guides/" className="text-muted hover:text-fg text-sm transition-colors">
                Guides
              </Link>
            </li>
            <li>
              <Link
                to="/about/"
                className="text-muted hover:text-fg text-sm transition-colors"
              >
                How we calculate
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-10 pt-6 border-t border-line flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-faint text-xs">
          © {new Date().getFullYear()} Free Pool Tools. All calculators are free to use.
        </p>
        <p className="text-faint text-xs max-w-md sm:text-right">
          Results are estimates for planning and education. Always confirm with a test kit before
          adding chemicals.
        </p>
      </div>
    </div>
  </footer>
);
