import { useSyncExternalStore } from 'react';

/**
 * "Pinned tools" — a small list of tool paths the user pins for quick access
 * from a folder dropdown in the header. Stored in localStorage, shared across
 * tabs.
 *
 * SSR-safe: the server snapshot is a stable empty array, so the prerendered
 * HTML shows no pinned shortcuts; the real list fills in after hydration (the
 * folder is an overlay, so nothing shifts). Mirrors the poolProfile store.
 */
const KEY = 'fpt-pinned-tools';
const EMPTY: string[] = [];

let cache: string[] | null = null;
const subscribers = new Set<() => void>();

const load = (): string[] => {
  if (typeof localStorage === 'undefined') return EMPTY;
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : EMPTY;
  } catch {
    return EMPTY;
  }
};

/** Imperative read of the pinned paths (stable reference until mutated). */
export const getPinnedTools = (): string[] => {
  if (cache === null) cache = load();
  return cache;
};

const emit = () => subscribers.forEach((cb) => cb());

const persist = (next: string[]) => {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — list still lives for the session */
  }
  emit();
};

export const isPinned = (path: string) => getPinnedTools().includes(path);

/** Add the path if absent, remove it if present. */
export const togglePinnedTool = (path: string) => {
  const cur = getPinnedTools();
  persist(cur.includes(path) ? cur.filter((p) => p !== path) : [...cur, path]);
};

export const removePinnedTool = (path: string) => {
  const cur = getPinnedTools();
  if (cur.includes(path)) persist(cur.filter((p) => p !== path));
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

/** Reactive access to the pinned tool paths (empty until hydrated / if none). */
export const usePinnedTools = (): string[] =>
  useSyncExternalStore(subscribe, getPinnedTools, () => EMPTY);
