import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, BookOpen, Pin } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { TOOLS } from '@/data/tools';
import { usePinnedTool, togglePinnedTool } from '@/lib/pinnedTool';

// Match a route path to a tool, tolerating a trailing slash (prerendered pages
// are served at /path/).
const norm = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);
// Compact label for the header chip: "Pool Shock Calculator" → "Shock".
const shortLabel = (title: string) =>
  title.replace(/\s*Calculator$/, '').replace(/^Pool\s+/, '');

/**
 * Site-wide top navigation. A floating, gradient-bordered glass pill that's
 * airy at the top of the page and tightens (stronger glass + shadow + brighter
 * gradient border) once the user scrolls — so it feels crafted without stealing
 * focus from the calculator. Starts in the un-scrolled state to match the
 * prerendered HTML, then upgrades after mount.
 */
export const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Pinned-tool quick access. The nav knows the current route, so the pin
  // toggle + jump chip live here — no per-page wiring. SSR-safe: pinned is null
  // until hydration, so the prerendered HTML omits the chip (no layout shift).
  const here = norm(useLocation().pathname);
  const pinned = usePinnedTool();
  const currentTool = TOOLS.find((t) => norm(t.path) === here);
  const pinnedTool = pinned ? TOOLS.find((t) => norm(t.path) === norm(pinned)) : undefined;
  const onPinnedPage = !!pinnedTool && norm(pinnedTool.path) === here;

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <nav className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Gradient border wrapper — the 1px padding shows the gradient as a hairline. */}
        <div
          className={`mt-3 rounded-2xl p-px transition-all duration-300 elevate nav-shell ${
            scrolled ? 'is-scrolled' : ''
          }`}
        >
          <div
            className={`nav-bar mobile-blur flex items-center justify-between rounded-[15px] px-4 sm:px-5 py-2.5 transition-all duration-300 backdrop-blur-[12px] ${
              scrolled ? 'is-scrolled' : ''
            }`}
          >
            <Link to="/" aria-label="Free Pool Tools home" className="logo-link text-[17px]">
              <Logo />
            </Link>

            <div className="flex items-center gap-1 sm:gap-2">
              {/* Pinned-tool quick jump — shown on every page except the pinned
                  tool's own page. */}
              {pinnedTool && !onPinnedPage && (
                <Link
                  to={pinnedTool.path}
                  title={`Go to your pinned tool: ${pinnedTool.title}`}
                  className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-fg border border-brand-orange/40 bg-brand-orange/[0.08] hover:bg-brand-orange/15 transition-colors"
                >
                  <pinnedTool.icon className="w-4 h-4 text-brand-orange" />
                  <span className="hidden sm:inline">{shortLabel(pinnedTool.title)}</span>
                </Link>
              )}

              {/* Pin/unpin the tool you're currently viewing. */}
              {currentTool && (
                <button
                  type="button"
                  onClick={() => togglePinnedTool(currentTool.path)}
                  aria-pressed={onPinnedPage}
                  title={onPinnedPage ? 'Unpin this tool from the header' : 'Pin this tool to the header'}
                  aria-label={onPinnedPage ? 'Unpin this tool' : 'Pin this tool'}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                    onPinnedPage
                      ? 'border-brand-orange/40 bg-brand-orange/[0.08] text-brand-orange'
                      : 'border-transparent text-muted hover:text-fg hover:border-line hover:bg-card-2'
                  }`}
                >
                  <Pin className={`w-4 h-4 ${onPinnedPage ? 'fill-current' : ''}`} />
                </button>
              )}

              <ThemeToggle />
              <Link
                to="/guides"
                className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-muted hover:text-fg border border-transparent hover:border-line hover:bg-card-2 transition-colors"
              >
                <BookOpen className="w-4 h-4 text-brand-blue-light" />
                <span className="hidden sm:inline">Guides</span>
              </Link>
              <Link
                to="/"
                className="group inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-muted hover:text-fg border border-transparent hover:border-line hover:bg-card-2 transition-colors"
              >
                <LayoutGrid className="w-4 h-4 text-brand-blue-light group-hover:text-brand-blue-light" />
                <span className="hidden sm:inline">All tools</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};
