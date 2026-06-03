import { useSyncExternalStore } from 'react';

/**
 * "Pinned tool" — a single tool path the user pins for one-tap access from the
 * header on every page. Stored in localStorage and shared across tabs.
 *
 * SSR-safe: the server snapshot is null, so the prerendered HTML renders no
 * pin chip; the real value fills in after hydration (no layout shift, since the
 * chip lives inside the existing nav row). Mirrors the poolProfile store.
 */
const KEY = 'fpt-pinned-tool';

let cache: string | null | undefined; // undefined = not yet read this session
const subscribers = new Set<() => void>();

const load = (): string | null => {
  if (typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(KEY) || null;
  } catch {
    return null;
  }
};

/** Imperative read of the pinned tool path (or null). */
export const getPinnedTool = (): string | null => {
  if (cache === undefined) cache = load();
  return cache ?? null;
};

const emit = () => subscribers.forEach((cb) => cb());

export const setPinnedTool = (path: string) => {
  cache = path;
  try {
    localStorage.setItem(KEY, path);
  } catch {
    /* storage unavailable — pin still lives for the session */
  }
  emit();
};

export const clearPinnedTool = () => {
  cache = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
};

/** Pin the path if it isn't pinned, otherwise unpin it. */
export const togglePinnedTool = (path: string) => {
  if (getPinnedTool() === path) clearPinnedTool();
  else setPinnedTool(path);
};

const subscribe = (cb: () => void) => {
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = load();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    subscribers.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

/** Reactive access to the pinned tool path (null until hydrated / if unset). */
export const usePinnedTool = (): string | null =>
  useSyncExternalStore(subscribe, getPinnedTool, () => null);
