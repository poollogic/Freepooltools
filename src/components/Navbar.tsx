import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LayoutGrid, BookOpen } from 'lucide-react';
import { Logo } from './Logo';
import { ThemeToggle } from './ThemeToggle';

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
