import { useSyncExternalStore } from 'react';

/**
 * Saved pools — a technician can keep many pools (one per address/customer), all
 * in localStorage. No accounts, no backend, so it stays free and adds no network
 * cost. The calculators read/write the *active* pool through the same small
 * facade they always used (getProfile/saveProfile/clearProfile), so no page
 * needs to change; the full multi-pool manager UI is a lazy chunk loaded only
 * when opened (see PoolManager).
 *
 * SSR-safe: server snapshots are stable empties, so prerendered HTML shows the
 * no-saved-pool state and the real data fills in after hydration.
 */

/** Backward-compatible shape used by calculators (the active pool's basics). */
export type PoolProfile = { volumeGal?: number; cya?: number };

/** A saved pool — what a tech keeps per address/customer. */
export type PoolRecord = {
  id: string;
  name: string; // address or label
  volumeGal?: number;
  cya?: number;
  updatedAt: number;
};

type Store = { pools: PoolRecord[]; activeId: string | null };

const KEY = 'fpt-pools';
const LEGACY_KEY = 'fpt-pool';
const EMPTY_PROFILE: PoolProfile = {};
const EMPTY_POOLS: PoolRecord[] = [];
const EMPTY_STORE: Store = { pools: [], activeId: null };

let state: Store | null = null;
let profileCache: PoolProfile = EMPTY_PROFILE; // stable derived active-pool basics
const subscribers = new Set<() => void>();

const uid = () => Math.random().toString(36).slice(2, 9);

/** One-time upgrade of the old single-pool key into a one-entry list. */
const migrateLegacy = (): Store => {
  try {
    const raw = localStorage.getItem(LEGACY_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p && (Number.isFinite(p.volumeGal) || Number.isFinite(p.cya))) {
        const rec: PoolRecord = {
          id: uid(),
          name: 'My pool',
          volumeGal: Number.isFinite(p.volumeGal) ? p.volumeGal : undefined,
          cya: Number.isFinite(p.cya) ? p.cya : undefined,
          updatedAt: Date.now(),
        };
        return { pools: [rec], activeId: rec.id };
      }
    }
  } catch {
    /* ignore */
  }
  return { pools: [], activeId: null };
};

const load = (): Store => {
  if (typeof localStorage === 'undefined') return EMPTY_STORE;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      if (s && Array.isArray(s.pools)) {
        return { pools: s.pools, activeId: typeof s.activeId === 'string' ? s.activeId : null };
      }
    }
  } catch {
    /* ignore */
  }
  return migrateLegacy();
};

const recomputeProfile = () => {
  const s = state ?? EMPTY_STORE;
  const active = s.pools.find((p) => p.id === s.activeId);
  if (!active) {
    profileCache = EMPTY_PROFILE;
    return;
  }
  const next: PoolProfile = {};
  if (active.volumeGal != null) next.volumeGal = active.volumeGal;
  if (active.cya != null) next.cya = active.cya;
  profileCache = next;
};

const get = (): Store => {
  if (state === null) {
    state = load();
    recomputeProfile();
  }
  return state;
};

const emit = () => subscribers.forEach((cb) => cb());

const persist = (next: Store) => {
  state = next;
  recomputeProfile();
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — lives for the session */
  }
  emit();
};

// ── Multi-pool API (used by the lazy PoolManager) ──
export const getPools = (): PoolRecord[] => get().pools;
export const getActiveId = (): string | null => get().activeId;

export const setActivePool = (id: string | null) => persist({ ...get(), activeId: id });

export const createPool = (data: Omit<PoolRecord, 'id' | 'updatedAt'>): string => {
  const rec: PoolRecord = { ...data, id: uid(), updatedAt: Date.now() };
  persist({ pools: [...get().pools, rec], activeId: rec.id });
  return rec.id;
};

export const updatePool = (id: string, patch: Partial<Omit<PoolRecord, 'id'>>) => {
  const s = get();
  persist({
    ...s,
    pools: s.pools.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
  });
};

export const deletePool = (id: string) => {
  const s = get();
  persist({
    pools: s.pools.filter((p) => p.id !== id),
    activeId: s.activeId === id ? null : s.activeId,
  });
};

export const exportPools = (): string => JSON.stringify(get().pools, null, 2);

/** Merge an imported list by id (incoming wins). Returns how many were read. */
export const importPools = (json: string): number => {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) throw new Error('Invalid pools file');
  const incoming: PoolRecord[] = parsed
    .filter((p) => p && typeof p === 'object')
    .map((p) => ({
      id: typeof p.id === 'string' ? p.id : uid(),
      name: typeof p.name === 'string' ? p.name : 'Pool',
      volumeGal: Number.isFinite(p.volumeGal) ? p.volumeGal : undefined,
      cya: Number.isFinite(p.cya) ? p.cya : undefined,
      updatedAt: Number.isFinite(p.updatedAt) ? p.updatedAt : Date.now(),
    }));
  const byId = new Map(get().pools.map((p) => [p.id, p]));
  for (const p of incoming) byId.set(p.id, p);
  persist({ pools: [...byId.values()], activeId: get().activeId });
  return incoming.length;
};

// ── Backward-compatible facade: the "profile" is the active pool ──
export const getProfile = (): PoolProfile => {
  get();
  return profileCache;
};

export const saveProfile = (patch: Partial<PoolProfile>) => {
  const clean: Partial<PoolProfile> = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v !== undefined && Number.isFinite(v as number)) (clean as Record<string, number>)[k] = v as number;
  }
  const s = get();
  if (s.activeId && s.pools.some((p) => p.id === s.activeId)) updatePool(s.activeId, clean);
  else createPool({ name: 'My pool', ...clean });
};

/** Stop using the active pool (deselect) — does NOT delete the saved pool. */
export const clearProfile = () => {
  const s = get();
  if (s.activeId !== null) persist({ ...s, activeId: null });
};

const subscribe = (cb: () => void) => {
  subscribers.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = load();
      recomputeProfile();
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    subscribers.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
};

export const usePoolProfile = (): PoolProfile =>
  useSyncExternalStore(subscribe, getProfile, () => EMPTY_PROFILE);

export const usePools = (): PoolRecord[] =>
  useSyncExternalStore(subscribe, getPools, () => EMPTY_POOLS);

export const useActiveId = (): string | null =>
  useSyncExternalStore(subscribe, getActiveId, () => null);
