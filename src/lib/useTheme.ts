import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'fpt-theme';
// 400 days — the max lifetime browsers honor for a cookie. Re-written on every
// toggle (and every page load, by the inline script in index.html) so the
// window keeps sliding forward: the choice persists until the user changes it
// or clears their browsing data.
const MAX_AGE = 60 * 60 * 24 * 400;

/** Persist the theme to both localStorage (no expiry) and a long-lived cookie. */
const persist = (theme: Theme) => {
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    /* storage unavailable (private mode) — falls back to the cookie */
  }
  try {
    document.cookie = `${KEY}=${theme}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax`;
  } catch {
    /* nothing else we can do */
  }
};

const currentFromDom = (): Theme =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('light')
    ? 'light'
    : 'dark';

// Session flag: false until the very first mount has hydrated, true afterwards.
// On the first load we must start from the dark default so the client render
// matches the prerendered HTML (the static HTML can't know a per-user theme).
// But the toggle remounts on every client-side route change — there, reading
// the already-applied theme synchronously avoids a dark→real flicker each nav.
let hasHydrated = false;

/**
 * Read + toggle the site theme. The actual class is set on <html> before paint
 * by the inline script in index.html; this hook syncs React to it and flips it.
 *
 * `mounted` is false only during the first hydration; on later mounts (SPA
 * navigation) it initializes from the live DOM so the toggle never bounces.
 */
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => (hasHydrated ? currentFromDom() : 'dark'));
  const [mounted, setMounted] = useState(hasHydrated);

  useEffect(() => {
    hasHydrated = true;
    setTheme(currentFromDom());
    setMounted(true);
  }, []);

  const apply = (next: Theme) => {
    const el = document.documentElement;
    // Enable smooth transitions just for this flip, then remove so they never
    // fire on a normal page load.
    el.classList.add('theme-transition');
    el.classList.remove('light', 'dark');
    el.classList.add(next);
    persist(next);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'light' ? '#eef4fb' : '#07111c');
    window.setTimeout(() => el.classList.remove('theme-transition'), 320);
    setTheme(next);
  };

  const toggle = () => apply(theme === 'light' ? 'dark' : 'light');

  return { theme, toggle, mounted };
};
