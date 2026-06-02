import { useSyncExternalStore } from 'react';

/**
 * "My Pool" — a tiny browser-saved profile shared across every calculator, so a
 * user enters their pool once and the tools auto-fill. Volume is stored in
 * gallons (the canonical unit); add fields here as more tools need them.
 *
 * Backed by localStorage + useSyncExternalStore so every component (and tab)
 * stays in sync. SSR-safe: the server snapshot is empty, so prerendered HTML
 * shows the no-saved-pool state and the real profile fills in after hydration.
 */
export type PoolProfile = {
  volumeGal?: number;
  cya?: number;
};

const KEY = 'fpt-pool';
const EMPTY: PoolProfile = {};

let cache: PoolProfile | null = null;
const subscribers = new Set<() => void>();

const load = (): PoolProfile => {
  if (typeof localStorage === 'undefined') return EMPTY;
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}') || EMPTY;
  } catch {
    return EMPTY;
  }
};

/** Imperative read of the current profile (for one-off prefill effects). */
export const getProfile = (): PoolProfile => {
  if (cache === null) cache = load();
  return cache;
};

const emit = () => subscribers.forEach((cb) => cb());

/** Merge a partial update and persist. Pass `undefined` to leave a field as-is. */
export const saveProfile = (patch: Partial<PoolProfile>) => {
  const next: PoolProfile = { ...getProfile() };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined && Number.isFinite(v as number)) (next as Record<string, number>)[k] = v as number;
  }
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — profile still lives for the session */
  }
  emit();
};

export const clearProfile = () => {
  cache = EMPTY;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  emit();
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

/** Reactive access to the saved pool. */
export const usePoolProfile = (): PoolProfile =>
  useSyncExternalStore(subscribe, getProfile, () => EMPTY);
