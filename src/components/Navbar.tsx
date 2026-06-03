import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutGrid, BookOpen, Pin, PinOff, X, Folder, ArrowRight } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { TOOLS } from '@/data/tools';
import { usePinnedTools, togglePinnedTool, removePinnedTool } from '@/lib/pinnedTools';

// Match a route path to a tool, tolerating a trailing slash (prerendered pages
// are served at /path/).
const norm = (p: string) => (p !== '/' && p.endsWith('/') ? p.slice(0, -1) : p);

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

  // Pinned-tools folder. The nav knows the current route, so pinning + the
  // shortcuts dropdown live here — no per-page wiring. SSR-safe: the list is
  // empty until hydration, so the prerendered HTML shows no pinned shortcuts.
  const here = norm(useLocation().pathname);
  const pinnedPaths = usePinnedTools();
  const currentTool = TOOLS.find((t) => norm(t.path) === here);
  const pinnedTools = pinnedPaths
    .map((p) => TOOLS.find((t) => norm(t.path) === norm(p)))
    .filter((t): t is (typeof TOOLS)[number] => Boolean(t));
  const currentPinned = !!currentTool && pinnedPaths.some((p) => norm(p) === here);

  // The folder is only useful when you can pin (on a tool page) or already have
  // shortcuts. Keep it hidden elsewhere so the nav stays clean.
  const showFolder = !!currentTool || pinnedTools.length > 0;

  const [open, setOpen] = useState(false);
  const folderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (folderRef.current && !folderRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

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
              {/* Pinned-tools folder — a single button that opens a dropdown of
                  shortcuts and lets you pin/unpin the tool you're viewing. */}
              {showFolder && (
                <div className="relative" ref={folderRef}>
                  <button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    aria-haspopup="menu"
                    aria-expanded={open}
                    aria-label="Pinned tools"
                    className={`relative inline-flex items-center justify-center w-9 h-9 rounded-lg border transition-colors ${
                      open
                        ? 'border-brand-orange/40 bg-brand-orange/[0.08] text-brand-orange'
                        : 'border-transparent text-muted hover:text-fg hover:border-line hover:bg-card-2'
                    }`}
                  >
                    <Folder className="w-4 h-4" />
                    {pinnedTools.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-brand-orange text-white text-[10px] font-bold leading-[16px] text-center">
                        {pinnedTools.length}
                      </span>
                    )}
                  </button>

                  {open && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-64 rounded-xl border border-line bg-card backdrop-blur-[12px] elevate overflow-hidden z-50"
                    >
                      {/* Pin/unpin the tool you're currently viewing. */}
                      {currentTool && (
                        <button
                          type="button"
                          onClick={() => togglePinnedTool(currentTool.path)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-fg hover:bg-card-2 transition-colors"
                        >
                          {currentPinned ? (
                            <PinOff className="w-4 h-4 text-subtle shrink-0" />
                          ) : (
                            <Pin className="w-4 h-4 text-brand-orange shrink-0" />
                          )}
                          {currentPinned ? 'Unpin this tool' : 'Pin this tool'}
                        </button>
                      )}

                      {currentTool && pinnedTools.length > 0 && (
                        <div className="border-t border-line" />
                      )}

                      {pinnedTools.length > 0 ? (
                        <ul className="py-1">
                          <li className="px-4 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-subtle">
                            Pinned shortcuts
                          </li>
                          {pinnedTools.map((t) => {
                            const Icon = t.icon;
                            const onThis = norm(t.path) === here;
                            return (
                              <li key={t.path} className="flex items-center group">
                                <Link
                                  to={t.path}
                                  onClick={() => setOpen(false)}
                                  className={`flex-1 min-w-0 flex items-center gap-2.5 pl-4 pr-2 py-2 text-sm transition-colors ${
                                    onThis ? 'text-fg font-semibold' : 'text-muted hover:text-fg hover:bg-card-2'
                                  }`}
                                >
                                  <Icon className="w-4 h-4 text-brand-blue-light shrink-0" />
                                  <span className="truncate">{t.title}</span>
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => removePinnedTool(t.path)}
                                  aria-label={`Remove ${t.title} from pinned`}
                                  className="shrink-0 inline-flex items-center justify-center w-8 h-8 mr-1 rounded-lg text-subtle hover:text-fg hover:bg-card-2 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="px-4 py-3 text-[13px] text-subtle leading-relaxed flex items-start gap-2">
                          <ArrowRight className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                          <span>Pin the tools you use most for one-tap access from any page.</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
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
