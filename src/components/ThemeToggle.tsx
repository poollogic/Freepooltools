import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';

/**
 * Light/dark toggle — a sliding pill with a sun/moon knob. The knob's position,
 * color, and icon are driven entirely by the `html.light` / `html.dark` class
 * (set before first paint by the inline script in index.html) via CSS in
 * index.css — so on load it renders in the correct spot with nothing to
 * animate. The transform transition only fires on an actual click. React here
 * just wires up the click + the accessible switch state.
 */
export const ThemeToggle = () => {
  const { theme, toggle, mounted } = useTheme();
  const isLight = mounted && theme === 'light';

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isLight}
      aria-label="Toggle light and dark theme"
      title={isLight ? 'Switch to dark mode' : 'Switch to light mode'}
      className="relative inline-flex items-center w-14 h-7 rounded-full border border-line bg-card-3 px-0.5"
    >
      {/* Faint track glyphs for context */}
      <Moon className="pointer-events-none absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />
      <Sun className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-subtle" />

      {/* Sliding knob — see .theme-knob in index.css for the theme-driven state. */}
      <span className="theme-knob relative z-10 inline-grid place-items-center w-6 h-6 rounded-full shadow-md transition-transform duration-300">
        <Moon className="theme-knob-moon col-start-1 row-start-1 w-3.5 h-3.5 text-white" />
        <Sun className="theme-knob-sun col-start-1 row-start-1 w-3.5 h-3.5 text-white" />
      </span>
    </button>
  );
};
