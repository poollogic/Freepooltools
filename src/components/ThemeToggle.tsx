import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';

/**
 * Light/dark toggle — a sliding pill with a sun/moon knob. The knob slides via a
 * Tailwind translate utility (class-based, so it survives the mobile motion
 * safety net), and the whole site flips through the token layer in index.css.
 */
export const ThemeToggle = () => {
  const { theme, toggle, mounted } = useTheme();
  // Treat the pre-mount state as dark to match the SSR/first-render markup.
  const isDark = !mounted || theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={!isDark}
      aria-label="Toggle light and dark theme"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="relative inline-flex items-center w-14 h-7 rounded-full border border-line bg-card-3 px-0.5 transition-colors"
    >
      {/* Faint track glyphs for context */}
      <Moon className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />
      <Sun className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />

      {/* Sliding knob */}
      <span
        className={`relative z-10 grid place-items-center w-6 h-6 rounded-full shadow-md transition-transform duration-300 ${
          isDark
            ? 'translate-x-0 bg-gradient-to-br from-brand-blue-light to-brand-blue'
            : 'translate-x-[1.75rem] bg-gradient-to-br from-amber-300 to-brand-orange'
        }`}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-white" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-white" />
        )}
      </span>
    </button>
  );
};
